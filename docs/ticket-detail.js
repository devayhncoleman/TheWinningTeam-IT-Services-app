// ==============================================
// The Winning Team — Ticket Detail Frontend
// ==============================================

const API_BASE_URL = "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com";
const MAX_MESSAGE_LENGTH = 1200;

// DOM
const ticketMeta = document.getElementById("ticketMeta");
const messagesList = document.getElementById("messagesList");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const detailStatus = document.getElementById("detailStatus");

function setDetailStatus(message, type = "info") {
  if (!detailStatus) return;
  detailStatus.textContent = message || "";
  detailStatus.className = "status " + (type === "success" ? "ok" : type === "error" ? "err" : type === "warn" ? "warn" : "");
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    ticketId: params.get("ticketId"),
    userId: params.get("userId") || getActiveUser("customer_ashley")
  };
}

function emergencyLabel(ticket) {
  const flag = ticket.isEmergency || "";
  const bool = ticket.isEmergencyBool;
  return flag || (bool ? "EMERGENCY" : "NORMAL");
}

function renderTicketMeta(ticket) {
  if (!ticketMeta) return;

  if (!ticket) {
    ticketMeta.innerHTML = `<div class="k">Ticket not found.</div>`;
    return;
  }

  const fullId = ticket.ticketId || "";
  const displayId = shortId(fullId, 12, 8);

  ticketMeta.innerHTML = `
    <div class="meta-grid">
      <div>
        <div class="k">TITLE</div>
        <div class="v value-wrap">${escapeHtml(ticket.title || "Untitled Ticket")}</div>
      </div>

      <div>
        <div class="k">TICKET ID</div>
        <div class="v value-wrap">${escapeHtml(displayId)}</div>
        <div class="k" style="margin-top:6px;">Full</div>
        <div class="v value-wrap">${escapeHtml(fullId)}</div>
      </div>

      <div>
        <div class="k">STATUS</div>
        <div class="v">${escapeHtml(ticket.status || "")}</div>
      </div>

      <div>
        <div class="k">PRIORITY</div>
        <div class="v">${escapeHtml(ticket.priority || "")}</div>
      </div>

      <div>
        <div class="k">EMERGENCY</div>
        <div class="v">${escapeHtml(emergencyLabel(ticket))}</div>
      </div>

      <div>
        <div class="k">CREATED BY</div>
        <div class="v value-wrap">${escapeHtml(ticket.createdByUserId || "")}</div>
      </div>

      <div>
        <div class="k">ASSIGNED TECH</div>
        <div class="v value-wrap">${escapeHtml(ticket.assignedTechId || "—")}</div>
      </div>

      <div>
        <div class="k">ASSIGNED GROUP</div>
        <div class="v value-wrap">${escapeHtml(ticket.assignedGroupId || "—")}</div>
      </div>

      <div>
        <div class="k">CREATED</div>
        <div class="v">${escapeHtml(formatDate(ticket.createdAt))}</div>
      </div>

      <div>
        <div class="k">UPDATED</div>
        <div class="v">${escapeHtml(formatDate(ticket.updatedAt))}</div>
      </div>

      <div class="meta-wide">
        <div class="k">DESCRIPTION</div>
        <div class="v value-wrap">${escapeHtml(ticket.description || "")}</div>
      </div>
    </div>
  `;
}

function renderMessages(messages) {
  if (!messagesList) return;
  messagesList.innerHTML = "";

  if (!messages || messages.length === 0) {
    messagesList.innerHTML = `<div class="k">No messages yet.</div>`;
    return;
  }

  messages.forEach((m) => {
    const div = document.createElement("div");
    div.className = "msg";

    const role = (m.senderRole || "USER").toUpperCase();
    const sender = m.senderId || "";
    const time = formatDate(m.timestamp);

    div.innerHTML = `
      <div class="msg-head">
        <span class="badge">${escapeHtml(role)}</span>
        <span class="mono">${escapeHtml(sender)}</span>
        <span style="margin-left:auto;" class="mono">${escapeHtml(time)}</span>
      </div>
      <div class="msg-body">${escapeHtml(m.messageText || "")}</div>
    `;

    messagesList.appendChild(div);
  });
}

async function loadTicketAndMessages() {
  const { ticketId, userId } = getQueryParams();

  if (!ticketId) {
    if (ticketMeta) ticketMeta.innerHTML = `<div class="k">No ticketId provided in URL.</div>`;
    return;
  }

  setActiveUser(userId);
  setDetailStatus("Loading ticket + messages...", "info");

  try {
    // Ticket
    const ticketResp = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!ticketResp.ok) {
      const text = await ticketResp.text();
      console.error("Ticket detail error:", ticketResp.status, text);
      setDetailStatus(`Error loading ticket (${ticketResp.status}).`, "error");
      return;
    }

    const ticket = await ticketResp.json();
    renderTicketMeta(ticket);

    // Messages
    const msgResp = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}/messages`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!msgResp.ok) {
      const text = await msgResp.text();
      console.error("Messages error:", msgResp.status, text);
      setDetailStatus(
        `Ticket loaded, but messages failed (${msgResp.status}). Usually CORS if PowerShell works.`,
        "error"
      );
      return;
    }

    const msgData = await msgResp.json();
    const items = Array.isArray(msgData.messages) ? msgData.messages : [];
    renderMessages(items);

    setDetailStatus("Loaded.", "success");
  } catch (err) {
    console.error("Detail fetch error:", err);
    setDetailStatus("Network error. Check console.", "error");
  }
}

async function sendMessage() {
  const { ticketId, userId } = getQueryParams();
  const content = (messageInput?.value || "").trim();

  if (!content) {
    setDetailStatus("Type a message first.", "error");
    return;
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    setDetailStatus(`Too long. Max ${MAX_MESSAGE_LENGTH} chars.`, "error");
    return;
  }

  setDetailStatus("Sending...", "info");

  try {
    const resp = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({ messageText: content })
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Send message error:", resp.status, text);
      setDetailStatus(`Send failed (${resp.status}).`, "error");
      return;
    }

    if (messageInput) messageInput.value = "";
    setDetailStatus("Sent.", "success");
    await loadTicketAndMessages();
  } catch (err) {
    console.error("Send message network error:", err);
    setDetailStatus("Network error while sending.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (messageInput) messageInput.maxLength = MAX_MESSAGE_LENGTH;
  loadTicketAndMessages();
});

if (sendMessageBtn) {
  sendMessageBtn.addEventListener("click", sendMessage);
}

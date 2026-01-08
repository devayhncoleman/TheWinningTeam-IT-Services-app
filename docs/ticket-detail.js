// ==============================================
// The Winning Team — Ticket Detail Frontend
// ==============================================

const API_BASE_URL = "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com";
const MAX_MESSAGE_LENGTH = 1200;

function $(id) { return document.getElementById(id); }

const ticketMeta = $("ticketMeta");
const messagesList = $("messagesList");
const messageInput = $("messageInput");
const sendMessageBtn = $("sendMessageBtn");
const detailStatus = $("detailStatus");

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    ticketId: params.get("ticketId"),
    userId: params.get("userId") || "customer_ashley"
  };
}

function setDetailStatus(message, type = "info") {
  if (!detailStatus) return;
  detailStatus.textContent = message || "";
  detailStatus.className = "status-message " + type;
}

function formatDate(isoString) {
  if (!isoString) return "";
  try { return new Date(isoString).toLocaleString(); } catch { return isoString; }
}

function renderTicketMeta(ticket) {
  if (!ticketMeta) return;

  if (!ticket) {
    ticketMeta.innerHTML = "<p class='small-note'>Ticket not found.</p>";
    return;
  }

  ticketMeta.innerHTML = `
    <div class="ticket-meta-grid">
      <div>
        <h3>${ticket.title || "Untitled Ticket"}</h3>
        <p><strong>ID:</strong> ${ticket.ticketId || ""}</p>
        <p><strong>Description:</strong> ${ticket.description || ""}</p>
      </div>
      <div>
        <p><strong>Status:</strong> ${ticket.status || ""}</p>
        <p><strong>Priority:</strong> ${ticket.priority || ""}</p>
        <p><strong>Emergency:</strong> ${ticket.isEmergency || (ticket.isEmergencyBool ? "EMERGENCY" : "NORMAL")}</p>
      </div>
      <div>
        <p><strong>Created By:</strong> ${ticket.createdByUserId || ""}</p>
        <p><strong>Assigned Tech:</strong> ${ticket.assignedTechId || "—"}</p>
        <p><strong>Assigned Group:</strong> ${ticket.assignedGroupId || "—"}</p>
      </div>
      <div>
        <p><strong>Created:</strong> ${formatDate(ticket.createdAt)}</p>
        <p><strong>Updated:</strong> ${formatDate(ticket.updatedAt)}</p>
      </div>
    </div>
  `;
}

function renderMessages(messages) {
  if (!messagesList) return;
  messagesList.innerHTML = "";

  if (!messages || messages.length === 0) {
    messagesList.innerHTML = "<p class='small-note'>No messages yet.</p>";
    return;
  }

  messages.forEach((m) => {
    const div = document.createElement("div");
    div.classList.add("message-item");

    div.innerHTML = `
      <div class="message-header">
        <span class="message-role">${(m.senderRole || "USER").toUpperCase()}</span>
        <span>${m.senderId || ""}</span>
        <span>${formatDate(m.timestamp)}</span>
      </div>
      <div>${(m.messageText || "").replaceAll("<","&lt;").replaceAll(">","&gt;")}</div>
      ${m.isSystem ? "<div class='message-system-tag'>SYSTEM</div>" : ""}
    `;

    messagesList.appendChild(div);
  });
}

async function loadTicketAndMessages() {
  const { ticketId, userId } = getQueryParams();

  if (!ticketId) {
    setDetailStatus("Missing ticketId in URL.", "error");
    if (ticketMeta) ticketMeta.innerHTML = "<p class='small-note'>No ticketId provided.</p>";
    return;
  }

  setDetailStatus("Loading ticket + messages...", "info");

  try {
    const ticketResp = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!ticketResp.ok) {
      const text = await ticketResp.text();
      console.error("Ticket detail API error:", ticketResp.status, text);
      setDetailStatus(`Error loading ticket (${ticketResp.status}).`, "error");
      return;
    }

    const ticket = await ticketResp.json();
    renderTicketMeta(ticket);

    const msgResp = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!msgResp.ok) {
      const text = await msgResp.text();
      console.error("Messages API error:", msgResp.status, text);
      setDetailStatus(`Ticket loaded, messages failed (${msgResp.status}).`, "error");
      return;
    }

    const msgData = await msgResp.json();
    const items = Array.isArray(msgData.messages) ? msgData.messages : [];
    renderMessages(items);

    setDetailStatus("Loaded.", "success");
  } catch (err) {
    console.error("Detail load error:", err);
    setDetailStatus("Network/CORS error. Open console.", "error");
  }
}

async function sendMessage() {
  const { ticketId, userId } = getQueryParams();
  const content = (messageInput ? messageInput.value.trim() : "");

  if (!content) return setDetailStatus("Type a message first.", "error");
  if (content.length > MAX_MESSAGE_LENGTH) {
    return setDetailStatus(`Too long (max ${MAX_MESSAGE_LENGTH}).`, "error");
  }

  setDetailStatus("Sending...", "info");

  try {
    const resp = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({ messageText: content })
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Send message API error:", resp.status, text);
      setDetailStatus(`Send failed (${resp.status}).`, "error");
      return;
    }

    if (messageInput) messageInput.value = "";
    setDetailStatus("Sent.", "success");
    await loadTicketAndMessages();
  } catch (err) {
    console.error("Send message error:", err);
    setDetailStatus("Network/CORS error sending message.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (messageInput) messageInput.maxLength = MAX_MESSAGE_LENGTH;
  if (sendMessageBtn) sendMessageBtn.addEventListener("click", sendMessage);
  loadTicketAndMessages();
});

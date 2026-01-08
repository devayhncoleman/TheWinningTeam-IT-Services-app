// ==============================================
// The Winning Team — Ticket Detail Frontend
// ticket-detail.js (FULL REWRITE - safe drop-in)
// ==============================================

const API_BASE_URL = "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com";
const MAX_MESSAGE_LENGTH = 1200;

// DOM
const ticketMeta = document.getElementById("ticketMeta");
const messagesList = document.getElementById("messagesList");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const detailStatusEl = document.getElementById("detailStatus");

// ---------- Helpers ----------
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    ticketId: params.get("ticketId"),
    userId: params.get("userId") || "customer_ashley"
  };
}

function setDetailStatus(message, type = "info") {
  if (!detailStatusEl) return;

  detailStatusEl.textContent = message || "";
  detailStatusEl.className = "status status-message status--inline";

  detailStatusEl.classList.remove("is-success", "is-error", "is-info");
  if (type === "success") detailStatusEl.classList.add("is-success");
  else if (type === "error") detailStatusEl.classList.add("is-error");
  else detailStatusEl.classList.add("is-info");
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Renderers ----------
function renderTicketMeta(ticket) {
  if (!ticketMeta) return;

  if (!ticket) {
    ticketMeta.innerHTML = `<p class="muted">Ticket not found.</p>`;
    return;
  }

  const emergency =
    ticket.isEmergency || (ticket.isEmergencyBool ? "EMERGENCY" : "NORMAL");

  ticketMeta.innerHTML = `
    <div class="ticket-meta-grid">
      <div>
        <h4>${escapeHtml(ticket.title || "Untitled Ticket")}</h4>
        <p><strong>ID:</strong> ${escapeHtml(ticket.ticketId || "")}</p>
        <p><strong>Description:</strong> ${escapeHtml(ticket.description || "")}</p>
      </div>
      <div>
        <p><strong>Status:</strong> ${escapeHtml(ticket.status || "")}</p>
        <p><strong>Priority:</strong> ${escapeHtml(ticket.priority || "")}</p>
        <p><strong>Emergency:</strong> ${escapeHtml(emergency)}</p>
      </div>
      <div>
        <p><strong>Created By:</strong> ${escapeHtml(ticket.createdByUserId || "")}</p>
        <p><strong>Assigned Tech:</strong> ${escapeHtml(ticket.assignedTechId || "—")}</p>
        <p><strong>Assigned Group:</strong> ${escapeHtml(ticket.assignedGroupId || "—")}</p>
      </div>
      <div>
        <p><strong>Created:</strong> ${escapeHtml(formatDate(ticket.createdAt))}</p>
        <p><strong>Updated:</strong> ${escapeHtml(formatDate(ticket.updatedAt))}</p>
      </div>
    </div>
  `;
}

function renderMessages(messages) {
  if (!messagesList) return;

  messagesList.innerHTML = "";

  if (!Array.isArray(messages) || messages.length === 0) {
    messagesList.innerHTML = `<p class="muted">No messages yet on this ticket.</p>`;
    return;
  }

  messages.forEach((m) => {
    const wrapper = document.createElement("div");
    wrapper.className = "message-item";

    const roleLabel = m.senderRole || "USER";
    const timeLabel = formatDate(m.timestamp);

    wrapper.innerHTML = `
      <div class="message-header">
        <span class="message-role">${escapeHtml(roleLabel)}</span>
        <span class="message-sender">${escapeHtml(m.senderId || "")}</span>
        <span class="message-time">${escapeHtml(timeLabel)}</span>
      </div>
      <div class="message-body">${escapeHtml(m.messageText || "")}</div>
      ${m.isSystem ? `<div class="message-system-tag">System</div>` : ""}
    `;

    messagesList.appendChild(wrapper);
  });
}

// ---------- Loaders ----------
async function loadTicketAndMessages() {
  const { ticketId, userId } = getQueryParams();

  if (!ticketId) {
    if (ticketMeta) ticketMeta.innerHTML = `<p class="muted">No ticketId provided in URL.</p>`;
    return;
  }

  setDetailStatus("Loading ticket…", "info");

  try {
    // Ticket
    const ticketResp = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!ticketResp.ok) {
      const text = await ticketResp.text();
      console.error("Ticket error:", text);
      setDetailStatus(`Error loading ticket (${ticketResp.status}).`, "error");
      if (ticketMeta) ticketMeta.innerHTML = `<p class="muted">Could not load ticket details.</p>`;
      return;
    }

    const ticket = await ticketResp.json();
    renderTicketMeta(ticket);

    // Messages
    const msgResp = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!msgResp.ok) {
      const text = await msgResp.text();
      console.error("Messages error:", text);
      setDetailStatus(`Loaded ticket, but error loading messages (${msgResp.status}).`, "error");
      return;
    }

    const msgData = await msgResp.json();
    const items = Array.isArray(msgData.messages) ? msgData.messages : [];
    renderMessages(items);

    setDetailStatus("Ticket and messages loaded.", "success");
  } catch (err) {
    console.error("Detail fetch error:", err);
    setDetailStatus("Network or CORS error while loading ticket detail.", "error");
  }
}

// ---------- Send ----------
async function sendMessage() {
  const { ticketId, userId } = getQueryParams();
  const content = (messageInput?.value || "").trim();

  if (!ticketId) {
    setDetailStatus("Missing ticketId in URL.", "error");
    return;
  }

  if (!content) {
    setDetailStatus("Please type a message before sending.", "error");
    return;
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    setDetailStatus(`Message too long (max ${MAX_MESSAGE_LENGTH} chars).`, "error");
    return;
  }

  setDetailStatus("Sending…", "info");

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
      console.error("Send message error:", text);
      setDetailStatus(`Error sending message (${resp.status}).`, "error");
      return;
    }

    if (messageInput) messageInput.value = "";
    setDetailStatus("Message sent.", "success");
    await loadTicketAndMessages();
  } catch (err) {
    console.error("Send message network error:", err);
    setDetailStatus("Network or CORS error while sending message.", "error");
  }
}

// ---------- Wiring ----------
document.addEventListener("DOMContentLoaded", () => {
  if (messageInput) messageInput.maxLength = MAX_MESSAGE_LENGTH;
  loadTicketAndMessages();
});

if (sendMessageBtn) {
  sendMessageBtn.addEventListener("click", sendMessage);
}

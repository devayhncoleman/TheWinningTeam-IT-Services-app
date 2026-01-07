// ==============================================
// The Winning Team – Ticket Detail Frontend
// ==============================================

// Keep this in sync with tickets.js
const API_BASE_URL = "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com";
const MAX_MESSAGE_LENGTH = 1200; // browser-side limit

// DOM elements
const ticketMeta = document.getElementById("ticketMeta");
const messagesList = document.getElementById("messagesList");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const detailStatus = document.getElementById("detailStatus");

// Parse query string: ?ticketId=...&userId=...
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    ticketId: params.get("ticketId"),
    userId: params.get("userId") || "customer_ashley"
  };
}

function setDetailStatus(message, type = "info") {
  detailStatus.textContent = message || "";
  detailStatus.className = "status-message " + type;
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleString();
  } catch {
    return isoString;
  }
}

// Render ticket metadata
function renderTicketMeta(ticket) {
  if (!ticket) {
    ticketMeta.innerHTML = "<p>Ticket not found.</p>";
    return;
  }

  ticketMeta.innerHTML = `
    <div class="ticket-meta-grid">
      <div>
        <h4>${ticket.title || "Untitled Ticket"}</h4>
        <p><strong>ID:</strong> ${ticket.ticketId || ""}</p>
        <p><strong>Description:</strong> ${ticket.description || ""}</p>
      </div>
      <div>
        <p><strong>Status:</strong> ${ticket.status || ""}</p>
        <p><strong>Priority:</strong> ${ticket.priority || ""}</p>
        <p><strong>Emergency:</strong> ${
          ticket.isEmergency || (ticket.isEmergencyBool ? "EMERGENCY" : "NORMAL")
        }</p>
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

// Render messages
function renderMessages(messages) {
  messagesList.innerHTML = "";

  if (!messages || messages.length === 0) {
    messagesList.innerHTML =
      '<p class="small-note">No messages yet on this ticket.</p>';
    return;
  }

  messages.forEach((m) => {
    const div = document.createElement("div");
    div.classList.add("message-item");

    // Match Lambda fields:
    // senderId, senderRole, timestamp, messageText
    const roleLabel = m.senderRole || "USER";
    const timeLabel = formatDate(m.timestamp);

    div.innerHTML = `
      <div class="message-header">
        <span class="message-role">${roleLabel}</span>
        <span class="message-sender">${m.senderId || ""}</span>
        <span class="message-time">${timeLabel}</span>
      </div>
      <div class="message-body">
        ${m.messageText || ""}
      </div>
      ${m.isSystem ? '<div class="message-system-tag">System</div>' : ""}
    `;

    messagesList.appendChild(div);
  });
}

// API calls
async function loadTicketAndMessages() {
  const { ticketId, userId } = getQueryParams();

  if (!ticketId) {
    ticketMeta.innerHTML = "<p>No ticketId provided in URL.</p>";
    return;
  }

  setDetailStatus("Loading ticket...", "info");

  try {
    // 1) Load ticket
    const ticketResp = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: "GET",
      headers: {
        "x-user-id": userId
      }
    });

    if (!ticketResp.ok) {
      const text = await ticketResp.text();
      console.error("Ticket error:", text);
      setDetailStatus(`Error loading ticket (${ticketResp.status}).`, "error");
      ticketMeta.innerHTML = "<p>Could not load ticket details.</p>";
      return;
    }

    const ticket = await ticketResp.json();
    renderTicketMeta(ticket);

    // 2) Load messages
    const msgResp = await fetch(
      `${API_BASE_URL}/tickets/${ticketId}/messages`,
      {
        method: "GET",
        headers: {
          "x-user-id": userId
        }
      }
    );

    if (!msgResp.ok) {
      const text = await msgResp.text();
      console.error("Messages error:", text);
      setDetailStatus(
        `Loaded ticket, but error loading messages (${msgResp.status}).`,
        "error"
      );
      return;
    }

    const msgData = await msgResp.json();
    // Lambda returns: { ticketId, messages: [...] }
    const items = Array.isArray(msgData.messages) ? msgData.messages : [];

    renderMessages(items);
    setDetailStatus("Ticket and messages loaded.", "success");
  } catch (err) {
    console.error("Detail fetch error:", err);
    setDetailStatus(
      "Network or CORS error while loading ticket detail.",
      "error"
    );
  }
}

async function sendMessage() {
  const { ticketId, userId } = getQueryParams();
  const content = messageInput.value.trim();

  if (!content) {
    setDetailStatus("Please type a message before sending.", "error");
    return;
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    setDetailStatus(
      `Message too long (max ${MAX_MESSAGE_LENGTH} characters).`,
      "error"
    );
    return;
  }

  setDetailStatus("Sending message...", "info");

  try {
    // IMPORTANT: backend expects "messageText"
    const resp = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify({
        messageText: content
        // You *can* also send senderId/senderRole if you want to override:
        // senderId: userId,
        // senderRole: "customer"
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Send message error:", text);
      setDetailStatus(`Error sending message (${resp.status}).`, "error");
      return;
    }

    // Clear input and reload messages
    messageInput.value = "";
    setDetailStatus("Message sent.", "success");
    await loadTicketAndMessages();
  } catch (err) {
    console.error("Send message network error:", err);
    setDetailStatus(
      "Network or CORS error while sending message.",
      "error"
    );
  }
}

// Wiring
document.addEventListener("DOMContentLoaded", () => {
  if (messageInput) {
    messageInput.maxLength = MAX_MESSAGE_LENGTH;
  }
  loadTicketAndMessages();
});

sendMessageBtn.addEventListener("click", sendMessage);

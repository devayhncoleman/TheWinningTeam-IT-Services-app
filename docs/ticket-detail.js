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
        <p><strong>Updated:</strong> ${escapeHtml(formatDate(tick

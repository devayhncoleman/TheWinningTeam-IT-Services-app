// ==============================================
// The Winning Team — Ticket Dashboard Frontend
// ==============================================

const API_BASE_URL = "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com";

function $(id) { return document.getElementById(id); }

const userSelect = $("userSelect");
const loadTicketsBtn = $("loadTicketsBtn");
const ticketsTableBody = document.querySelector("#ticketsTable tbody");
const statusMessage = $("statusMessage");

function setStatus(message, type = "info") {
  if (!statusMessage) return;
  statusMessage.textContent = message || "";
  statusMessage.className = "status-message " + type;
}

function formatDate(isoString) {
  if (!isoString) return "";
  try { return new Date(isoString).toLocaleString(); } catch { return isoString; }
}

function clearTicketsTable() {
  if (!ticketsTableBody) return;
  ticketsTableBody.innerHTML = "";
}

function renderTickets(tickets) {
  clearTicketsTable();

  if (!ticketsTableBody) {
    console.error("ticketsTableBody not found. Check tickets.html table markup.");
    return;
  }

  if (!tickets || tickets.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "No tickets found for this user.";
    row.appendChild(cell);
    ticketsTableBody.appendChild(row);
    return;
  }

  tickets.forEach((ticket) => {
    const row = document.createElement("tr");
    row.classList.add("clickable-row");

    const cols = [
      ticket.ticketId || "",
      ticket.title || "",
      ticket.status || "",
      ticket.priority || "",
      ticket.isEmergency || (ticket.isEmergencyBool ? "EMERGENCY" : "NORMAL"),
      formatDate(ticket.createdAt),
      formatDate(ticket.updatedAt)
    ];

    cols.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      row.appendChild(td);
    });

    row.addEventListener("click", () => {
      const userId = (userSelect && userSelect.value) ? userSelect.value : "customer_ashley";
      const ticketId = ticket.ticketId;
      if (!ticketId) return;

      window.location.href =
        `ticket-detail.html?ticketId=${encodeURIComponent(ticketId)}&userId=${encodeURIComponent(userId)}`;
    });

    ticketsTableBody.appendChild(row);
  });
}

async function fetchTicketsForUser(userId) {
  if (!API_BASE_URL) {
    setStatus("API_BASE_URL missing in tickets.js", "error");
    return;
  }

  setStatus(`Loading tickets for ${userId}...`, "info");
  clearTicketsTable();

  try {
    const resp = await fetch(`${API_BASE_URL}/tickets`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Tickets API error:", resp.status, text);
      setStatus(`Error loading tickets (${resp.status}). Open console.`, "error");
      return;
    }

    const data = await resp.json();
    const items = Array.isArray(data.items) ? data.items : [];
    renderTickets(items);
    setStatus(`Loaded ${items.length} ticket(s) for ${userId}.`, "success");
  } catch (err) {
    console.error("Fetch error:", err);
    setStatus("Network/CORS error loading tickets. Open console.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!userSelect || !loadTicketsBtn || !ticketsTableBody) {
    console.error("Missing DOM elements. Ensure tickets.html ids match tickets.js.");
    setStatus("Page wiring error: missing elements. Check console.", "error");
    return;
  }

  loadTicketsBtn.addEventListener("click", () => fetchTicketsForUser(userSelect.value));
  fetchTicketsForUser(userSelect.value || "customer_ashley");
});

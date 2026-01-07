// ==============================================
// The Winning Team – Ticket Dashboard Frontend
// ==============================================

// 1. Set your API base URL here.
//    Replace <your-api-id> and region with your real API Gateway URL.
//    Example you’ve used in PowerShell will look like:
//    https://abc123.execute-api.us-east-1.amazonaws.com
const API_BASE_URL = "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com";

// 2. DOM elements
const userSelect = document.getElementById("userSelect");
const loadTicketsBtn = document.getElementById("loadTicketsBtn");
const ticketsTableBody = document.querySelector("#ticketsTable tbody");
const statusMessage = document.getElementById("statusMessage");

// 3. Helpers

function setStatus(message, type = "info") {
  // type can be "info", "success", "error"
  statusMessage.textContent = message || "";
  statusMessage.className = "status-message " + type;
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    // Simple readable format
    return date.toLocaleString();
  } catch {
    return isoString;
  }
}

function clearTicketsTable() {
  while (ticketsTableBody.firstChild) {
    ticketsTableBody.removeChild(ticketsTableBody.firstChild);
  }
}

function renderTickets(tickets) {
  clearTicketsTable();

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

    const idCell = document.createElement("td");
    idCell.textContent = ticket.ticketId || "";
    row.appendChild(idCell);

    const titleCell = document.createElement("td");
    titleCell.textContent = ticket.title || "";
    row.appendChild(titleCell);

    const statusCell = document.createElement("td");
    statusCell.textContent = ticket.status || "";
    row.appendChild(statusCell);

    const priorityCell = document.createElement("td");
    priorityCell.textContent = ticket.priority || "";
    row.appendChild(priorityCell);

    const emergencyCell = document.createElement("td");
    const isEmergencyFlag = ticket.isEmergency || "";
    const isEmergencyBool = ticket.isEmergencyBool;
    emergencyCell.textContent = isEmergencyFlag || (isEmergencyBool ? "EMERGENCY" : "NORMAL");
    row.appendChild(emergencyCell);

    const createdCell = document.createElement("td");
    createdCell.textContent = formatDate(ticket.createdAt);
    row.appendChild(createdCell);

    const updatedCell = document.createElement("td");
    updatedCell.textContent = formatDate(ticket.updatedAt);
    row.appendChild(updatedCell);

    ticketsTableBody.appendChild(row);
  });
}

// 4. API call

async function fetchTicketsForUser(userId) {
  if (!API_BASE_URL || API_BASE_URL.includes("<your-api-id>")) {
    setStatus("Please update API_BASE_URL in tickets.js with your real API Gateway URL.", "error");
    return;
  }

  setStatus(`Loading tickets for ${userId}...`, "info");
  clearTicketsTable();

  try {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: "GET",
      headers: {
        "x-user-id": userId
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error response:", text);
      setStatus(`Error loading tickets (${response.status}). Check console for details.`, "error");
      return;
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    renderTickets(items);
    setStatus(`Loaded ${items.length} ticket(s) for ${userId}.`, "success");
  } catch (err) {
    console.error("Fetch error:", err);
    setStatus("Network or CORS error while loading tickets. See console for details.", "error");
  }
}

// 5. Event wiring

loadTicketsBtn.addEventListener("click", () => {
  const userId = userSelect.value;
  fetchTicketsForUser(userId);
});

// Optional: auto-load on first page open with default user
document.addEventListener("DOMContentLoaded", () => {
  const defaultUser = userSelect.value || "customer_ashley";
  fetchTicketsForUser(defaultUser);
});

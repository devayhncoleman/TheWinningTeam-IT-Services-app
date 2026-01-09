// ==============================================
// The Winning Team — Ticket Dashboard Frontend
// ==============================================

const API_BASE_URL = "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com";

// DOM
const userSelect = document.getElementById("userSelect");
const loadTicketsBtn = document.getElementById("loadTicketsBtn");
const ticketsTableBody = document.querySelector("#ticketsTable tbody");
const statusMessage = document.getElementById("statusMessage");
const roleBadge = document.getElementById("roleBadge");

// Create ticket DOM
const newTitle = document.getElementById("newTitle");
const newDesc = document.getElementById("newDesc");
const newPriority = document.getElementById("newPriority");
const newEmergency = document.getElementById("newEmergency");
const createTicketBtn = document.getElementById("createTicketBtn");
const createStatus = document.getElementById("createStatus");

// Admin DOM
const adminPanel = document.getElementById("adminPanel");
const adminTicketId = document.getElementById("adminTicketId");
const adminStatus = document.getElementById("adminStatus");
const adminPriority = document.getElementById("adminPriority");
const adminTech = document.getElementById("adminTech");
const adminGroup = document.getElementById("adminGroup");
const adminUpdateBtn = document.getElementById("adminUpdateBtn");
const adminStatusMsg = document.getElementById("adminStatusMsg");

let lastLoadedTickets = [];

function setStatus(message, type = "info") {
  if (!statusMessage) return;
  statusMessage.textContent = message || "";
  statusMessage.className = "status " + (type === "success" ? "ok" : type === "error" ? "err" : type === "warn" ? "warn" : "");
}

function setSmallStatus(el, message, type = "info") {
  if (!el) return;
  el.textContent = message || "";
  el.className = "status " + (type === "success" ? "ok" : type === "error" ? "err" : type === "warn" ? "warn" : "");
}

function clearTicketsTable() {
  if (!ticketsTableBody) return;
  ticketsTableBody.innerHTML = "";
}

function emergencyLabel(ticket) {
  const flag = ticket.isEmergency || "";
  const bool = ticket.isEmergencyBool;
  return flag || (bool ? "EMERGENCY" : "NORMAL");
}

function currentUserId() {
  return userSelect?.value || getActiveUser("customer_ashley");
}

function applyRoleUI(userId) {
  const role = roleFromUserId(userId);
  if (roleBadge) roleBadge.textContent = role;

  // Show admin panel only for TECH/ADMIN in UI (backend still enforces for real)
  const showAdmin = (role === "ADMIN" || role === "TECH");
  if (adminPanel) adminPanel.style.display = showAdmin ? "block" : "none";
}

function renderTickets(tickets) {
  clearTicketsTable();
  lastLoadedTickets = Array.isArray(tickets) ? tickets : [];

  if (!ticketsTableBody) return;

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

    const fullId = ticket.ticketId || "";
    const cells = [
      shortId(fullId, 10, 6),
      ticket.title || "",
      ticket.status || "",
      ticket.priority || "",
      emergencyLabel(ticket),
      formatDate(ticket.createdAt),
      formatDate(ticket.updatedAt)
    ];

    cells.forEach((v, idx) => {
      const td = document.createElement("td");
      td.textContent = v;
      if (idx === 0) td.className = "idcell";
      row.appendChild(td);
    });

    row.addEventListener("click", () => {
      const userId = currentUserId();
      const ticketId = ticket.ticketId;
      if (!ticketId) return;

      // Fill admin selected id for quick patching
      if (adminTicketId) adminTicketId.value = ticketId;

      setActiveUser(userId);
      window.location.href =
        `ticket-detail.html?ticketId=${encodeURIComponent(ticketId)}&userId=${encodeURIComponent(userId)}`;
    });

    ticketsTableBody.appendChild(row);
  });
}

async function fetchTicketsForUser(userId) {
  if (!API_BASE_URL) {
    setStatus("Missing API_BASE_URL in tickets.js.", "error");
    return;
  }

  setStatus(`Loading tickets for ${userId}...`, "info");
  clearTicketsTable();

  try {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: "GET",
      headers: { "x-user-id": userId }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Tickets error:", response.status, text);
      setStatus(
        `Browser failed to load tickets (${response.status}). If PowerShell works, this is usually CORS.`,
        "error"
      );
      return;
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    renderTickets(items);
    setStatus(`Loaded ${items.length} ticket(s) for ${userId}.`, "success");
  } catch (err) {
    console.error("Tickets fetch error:", err);
    setStatus("Network error while loading tickets. Check console.", "error");
  }
}

// ---------- Create Ticket ----------
async function createTicket() {
  const userId = currentUserId();
  const title = (newTitle?.value || "").trim();
  const description = (newDesc?.value || "").trim();
  const priority = newPriority?.value || "MEDIUM";
  const emergency = newEmergency?.value || "NORMAL";

  if (!title) {
    setSmallStatus(createStatus, "Title is required.", "error");
    return;
  }

  setSmallStatus(createStatus, "Submitting ticket...", "info");

  // Backend field naming can vary. This tries common keys.
  const payload = {
    title,
    description,
    priority,
    // try both styles (backend can ignore unknown)
    isEmergency: emergency,
    emergency: emergency,
    isEmergencyBool: emergency === "EMERGENCY"
  };

  try {
    const resp = await fetch(`${API_BASE_URL}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Create ticket error:", resp.status, text);
      setSmallStatus(createStatus, `Create failed (${resp.status}). Check Lambda validation rules.`, "error");
      return;
    }

    setSmallStatus(createStatus, "Created. Reloading tickets...", "success");
    if (newTitle) newTitle.value = "";
    if (newDesc) newDesc.value = "";

    await fetchTicketsForUser(userId);
  } catch (err) {
    console.error("Create ticket network error:", err);
    setSmallStatus(createStatus, "Network error while creating ticket.", "error");
  }
}

// ---------- Admin Patch ----------
async function adminUpdateTicket() {
  const userId = currentUserId();
  const ticketId = (adminTicketId?.value || "").trim();

  if (!ticketId) {
    setSmallStatus(adminStatusMsg, "Select a ticket first (click a row).", "error");
    return;
  }

  const patch = {};
  if (adminStatus?.value) patch.status = adminStatus.value;
  if (adminPriority?.value) patch.priority = adminPriority.value;

  // assignment fields (backend must support)
  if (adminTech?.value) patch.assignedTechId = adminTech.value;
  if (adminGroup?.value) patch.assignedGroupId = adminGroup.value;

  if (Object.keys(patch).length === 0) {
    setSmallStatus(adminStatusMsg, "No changes selected.", "warn");
    return;
  }

  setSmallStatus(adminStatusMsg, "Applying update...", "info");

  try {
    const resp = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId
      },
      body: JSON.stringify(patch)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Admin patch error:", resp.status, text);
      setSmallStatus(adminStatusMsg, `Update failed (${resp.status}). Check Lambda logs for reserved keywords/validation.`, "error");
      return;
    }

    setSmallStatus(adminStatusMsg, "Updated. Reloading tickets...", "success");
    await fetchTicketsForUser(userId);

    // reset dropdowns to "(no change)" after update
    if (adminStatus) adminStatus.value = "";
    if (adminPriority) adminPriority.value = "";
    if (adminTech) adminTech.value = "";
    if (adminGroup) adminGroup.value = "";
  } catch (err) {
    console.error("Admin patch network error:", err);
    setSmallStatus(adminStatusMsg, "Network error while updating.", "error");
  }
}

// Wiring
document.addEventListener("DOMContentLoaded", () => {
  if (userSelect) {
    userSelect.value = getActiveUser("customer_ashley");
    userSelect.addEventListener("change", () => {
      setActiveUser(userSelect.value);
      applyRoleUI(userSelect.value);
    });
  }

  const initialUser = currentUserId();
  applyRoleUI(initialUser);

  if (loadTicketsBtn) {
    loadTicketsBtn.addEventListener("click", () => {
      const userId = currentUserId();
      setActiveUser(userId);
      applyRoleUI(userId);
      fetchTicketsForUser(userId);
    });
  }

  if (createTicketBtn) createTicketBtn.addEventListener("click", createTicket);
  if (adminUpdateBtn) adminUpdateBtn.addEventListener("click", adminUpdateTicket);

  // Auto-load
  fetchTicketsForUser(initialUser);
});

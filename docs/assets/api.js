// ==============================================
// The Winning Team — Shared API Client (Frontends)
// Location: docs/assets/api.js  (IMPORTANT)
// ES Module exports used by admin/tech/customer pages
// ==============================================

function mustConfig() {
  if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
    throw new Error("Missing APP_CONFIG.API_BASE_URL. Check docs/assets/config.js");
  }
  return window.APP_CONFIG;
}

function headerUserId(userId) {
  return { "x-user-id": userId };
}

async function request(path, { method = "GET", userId, body } = {}) {
  const { API_BASE_URL } = mustConfig();
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    ...headerUserId(userId || "demo-user"),
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.Items)) return data.Items;
  return [];
}

// ----------------------
// Dev identity storage
// ----------------------
export function getDevIdentity(defaultRole = "customer") {
  const raw = localStorage.getItem("TWT_DEV_IDENTITY");
  if (raw) {
    try {
      const obj = JSON.parse(raw);
      if (obj?.userId) return obj;
    } catch {}
  }

  const fallback =
    defaultRole === "admin" ? { userId: "admin_jordan", role: "admin" } :
    defaultRole === "tech" ? { userId: "tech_mike", role: "tech" } :
    { userId: "customer_ashley", role: "customer" };

  return fallback;
}

export function setDevIdentity(userId) {
  const role =
    (userId || "").toLowerCase().startsWith("admin_") ? "admin" :
    (userId || "").toLowerCase().startsWith("tech_") ? "tech" :
    "customer";

  localStorage.setItem("TWT_DEV_IDENTITY", JSON.stringify({ userId, role }));
  return { userId, role };
}

// ----------------------
// Friendly wrappers
// ----------------------
export async function tryAdmin(fn, friendlyMsg = "Admin routes not deployed or not authorized.") {
  try {
    return await fn();
  } catch (e) {
    const msg = e?.message || String(e);
    throw new Error(`${friendlyMsg} (${msg})`);
  }
}

export async function tryTech(fn, friendlyMsg = "Tech routes not deployed or not authorized.") {
  try {
    return await fn();
  } catch (e) {
    const msg = e?.message || String(e);
    throw new Error(`${friendlyMsg} (${msg})`);
  }
}

// ----------------------
// Customer ticket APIs
// ----------------------
export async function customerListTickets({ userId }) {
  const data = await request(`/tickets`, { method: "GET", userId });
  return normalizeList(data);
}

export async function customerCreateTicket({ userId, payload }) {
  return request(`/tickets`, { method: "POST", userId, body: payload });
}

export async function customerGetTicket({ userId, ticketId }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}`, { method: "GET", userId });
}

export async function customerPatchTicket({ userId, ticketId, patch }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}`, { method: "PATCH", userId, body: patch });
}

// Messages (shared — customer/tech/admin can use if they are participant)
export async function listMessages({ userId, ticketId }) {
  const data = await request(`/tickets/${encodeURIComponent(ticketId)}/messages`, { method: "GET", userId });
  // your backend seems to return { messages: [...] }
  if (Array.isArray(data?.messages)) return data.messages;
  return normalizeList(data);
}

export async function sendMessage({ userId, ticketId, messageText }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/messages`, {
    method: "POST",
    userId,
    body: { messageText }
  });
}

// ----------------------
// Admin APIs (your PowerShell proves these exist)
// ----------------------
export async function adminListAllTickets({ adminUserId }) {
  const data = await request(`/admin/tickets`, { method: "GET", userId: adminUserId });
  return normalizeList(data);
}

export async function adminGetTicket({ adminUserId, ticketId }) {
  return request(`/admin/tickets/${encodeURIComponent(ticketId)}`, { method: "GET", userId: adminUserId });
}

export async function adminPatchTicket({ adminUserId, ticketId, patch }) {
  return request(`/admin/tickets/${encodeURIComponent(ticketId)}`, {
    method: "PATCH",
    userId: adminUserId,
    body: patch
  });
}

// ----------------------
// Tech APIs
// ----------------------
export async function techListAssignedTickets({ techUserId }) {
  const data = await request(`/tech/tickets`, { method: "GET", userId: techUserId });
  return normalizeList(data);
}

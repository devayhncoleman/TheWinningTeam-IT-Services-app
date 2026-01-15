// docs/assets/api.js
// ==============================================
// The Winning Team — Shared API Client (Frontends)
// Supports list responses shaped as:
//   - { items: [...] }   (your Tickets lambda pattern)
//   - { tickets: [...] } (alternate)
//   - [...]              (direct array)
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

  // IMPORTANT: avoid double slashes
  const base = String(API_BASE_URL).replace(/\/+$/, "");
  const p = String(path).startsWith("/") ? path : `/${path}`;
  const url = `${base}${p}`;

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
  if (Array.isArray(data?.Messages)) return data.Messages;
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
// Helpers for "admin not deployed yet" UX
// ----------------------
export async function tryAdmin(fn, friendlyMessage) {
  try {
    return await fn();
  } catch (e) {
    // If the route is missing in API GW you might see "Not Found" or "Route not handled"
    const msg = String(e?.message || "");
    if (
      msg.includes("Not Found") ||
      msg.includes("Route not handled") ||
      msg.includes("Missing Authentication Token")
    ) {
      throw new Error(friendlyMessage || "Admin routes not deployed.");
    }
    throw e;
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

export async function customerListMessages({ userId, ticketId }) {
  const data = await request(`/tickets/${encodeURIComponent(ticketId)}/messages`, { method: "GET", userId });
  return normalizeList(data);
}

export async function customerPostMessage({ userId, ticketId, payload }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}/messages`, { method: "POST", userId, body: payload });
}

// ----------------------
// Tech APIs
// ----------------------
export async function techListAssignedTickets({ techUserId }) {
  const data = await request(`/tech/tickets`, { method: "GET", userId: techUserId });
  return normalizeList(data);
}

// optional: tech can update ticket status/notes via /tickets/{id} PATCH if your lambda allows it
export async function techPatchTicket({ techUserId, ticketId, patch }) {
  return request(`/tickets/${encodeURIComponent(ticketId)}`, { method: "PATCH", userId: techUserId, body: patch });
}

// ----------------------
// Admin APIs
// ----------------------
export async function adminListAllTickets({ adminUserId }) {
  const data = await request(`/admin/tickets`, { method: "GET", userId: adminUserId });
  return normalizeList(data);
}

export async function adminGetTicket({ adminUserId, ticketId }) {
  return request(`/admin/tickets/${encodeURIComponent(ticketId)}`, { method: "GET", userId: adminUserId });
}

export async function adminPatchTicket({ adminUserId, ticketId, patch }) {
  return request(`/admin/tickets/${encodeURIComponent(ticketId)}`, { method: "PATCH", userId: adminUserId, body: patch });
}

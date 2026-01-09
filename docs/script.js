// =======================================
// Global helpers (shared across pages)
// =======================================

const TEAM_USER_KEY = "dw-active-user";

function setActiveUser(userId) {
  try { localStorage.setItem(TEAM_USER_KEY, userId); } catch (_) {}
}

function getActiveUser(defaultUser = "customer_ashley") {
  try {
    const v = localStorage.getItem(TEAM_USER_KEY);
    return v || defaultUser;
  } catch (_) {
    return defaultUser;
  }
}

function formatDate(isoString) {
  if (!isoString) return "";
  try { return new Date(isoString).toLocaleString(); }
  catch { return isoString; }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Shorten long DynamoDB-ish ids for display (keeps full id intact in data)
function shortId(id, head = 10, tail = 6) {
  const s = String(id || "");
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

// Lightweight role guess (for UI only)
function roleFromUserId(userId) {
  const u = String(userId || "").toLowerCase();
  if (u.startsWith("admin_")) return "ADMIN";
  if (u.startsWith("tech_")) return "TECH";
  if (u.startsWith("customer_")) return "CUSTOMER";
  return "USER";
}

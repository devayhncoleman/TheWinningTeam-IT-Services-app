// =======================================
// Global Theme + Interactions Script
// Applies to: index.html, Showcase.html, tickets.html, ticket-detail.html
// =======================================

const THEME_KEY = "dw-theme";

// ---------- THEME SYSTEM (single source of truth) ----------
// We support BOTH so old/new CSS can't fight:
// 1) body classes: theme-day / theme-night
// 2) html attribute: <html data-theme="day|night">

function normalizeMode(mode) {
  return mode === "night" ? "night" : "day";
}

function setDomTheme(mode) {
  const m = normalizeMode(mode);

  // body classes (legacy + current)
  document.body.classList.remove("theme-day", "theme-night");
  document.body.classList.add(m === "night" ? "theme-night" : "theme-day");

  // html attribute (modern, stronger selector control)
  document.documentElement.setAttribute("data-theme", m);
}

function setToggleLabel(mode) {
  const toggleBtn = document.getElementById("toggleNightShift");
  if (!toggleBtn) return;

  // You said: "gold button reads Night Shift when it should read Day to toggle purple/gold"
  // That means the label should describe CURRENT mode, not the action.
  // Day mode = purple/gold (your preference)
  // Night mode = blues
  if (mode === "night") {
    toggleBtn.textContent = "Night Mode 🌙"; // blues active
  } else {
    toggleBtn.textContent = "Day Mode ☀️"; // purple/gold active
  }

  // Accessibility + consistency
  toggleBtn.setAttribute("aria-pressed", mode === "night" ? "true" : "false");
  toggleBtn.setAttribute("title", "Toggle Day/Night theme");
}

function persistTheme(mode) {
  try {
    localStorage.setItem(THEME_KEY, normalizeMode(mode));
  } catch (_) {}
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "day" || stored === "night") return stored;
  } catch (_) {}
  return null;
}

function readPreferredTheme() {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "night";
    }
  } catch (_) {}
  return "day";
}

function getCurrentThemeFromDom() {
  // Prefer html attribute if present, otherwise body class
  const htmlTheme = document.documentElement.getAttribute("data-theme");
  if (htmlTheme === "day" || htmlTheme === "night") return htmlTheme;
  return document.body.classList.contains("theme-night") ? "night" : "day";
}

function applyTheme(mode) {
  const m = normalizeMode(mode);
  setDomTheme(m);
  setToggleLabel(m);
  persistTheme(m);
}

function toggleTheme() {
  const current = getCurrentThemeFromDom();
  applyTheme(current === "night" ? "day" : "night");
}

function initTheme() {
  // 1) stored preference
  // 2) OS preference
  const initial = readStoredTheme() || readPreferredTheme();
  applyTheme(initial);

  const toggleBtn = document.getElementById("toggleNightShift");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleTheme);
  }
}

// OPTIONAL: quick cache bust helper (use in console if GH Pages is stubborn)
function forceReloadNoCache() {
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString());
  window.location.replace(url.toString());
}

// ---------- UTILITIES ----------
async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}

// ---------- LANDING PAGE INTERACTIONS ----------
function initLandingPage() {
  const hireMeBtn = document.getElementById("hireMeBtn");
  if (hireMeBtn) {
    hireMeBtn.addEventListener("click", () => {
      alert(
        "Quick contact:\n\n• Phone: (510) 934-7112\n• LinkedIn: linkedin.com/in/devayhn-coleman-788411223"
      );
    });
  }

  // Status panel
  const statusLine = document.getElementById("statusLine");
  const simulateAlertBtn = document.getElementById("simulateAlertBtn");
  const calmDownBtn = document.getElementById("calmDownBtn");

  if (statusLine && simulateAlertBtn && calmDownBtn) {
    simulateAlertBtn.addEventListener("click", () => {
      statusLine.textContent = "High-priority alert generated. Triage in progress…";
      statusLine.parentElement?.classList.add("status-panel--active");
    });

    cal

// =======================================
// Global Theme (Classic <-> Lime)
// Works on: index.html, Showcase.html,
// tickets.html, ticket-detail.html
// =======================================

const THEME_KEY = "dw-theme-v2"; // new key to avoid older saved values

function applyTheme(mode) {
  const body = document.body;

  if (mode !== "classic" && mode !== "lime") mode = "classic";

  body.classList.remove("theme-classic", "theme-lime");
  body.classList.add(mode === "lime" ? "theme-lime" : "theme-classic");

  // persist
  try { localStorage.setItem(THEME_KEY, mode); } catch (_) {}

  // update toggle label (same id across all pages)
  const btn = document.getElementById("toggleNightShift");
  if (btn) {
    btn.textContent = mode === "lime" ? "Classic Mode" : "Lime Mode";
  }
}

function initTheme() {
  let mode = "classic";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "classic" || stored === "lime") mode = stored;
  } catch (_) {}

  applyTheme(mode);

  const btn = document.getElementById("toggleNightShift");
  if (btn) {
    btn.addEventListener("click", () => {
      const isLime = document.body.classList.contains("theme-lime");
      applyTheme(isLime ? "classic" : "lime");
    });
  }
}

document.addEventListener("DOMContentLoaded", initTheme);

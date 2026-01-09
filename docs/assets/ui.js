// docs/assets/ui.js

export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function qs(sel) {
  return document.querySelector(sel);
}

export function qsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

export function formatIso(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString();
}

export function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = escapeHtml(msg);

  const wrap = document.querySelector("#toast-wrap") || (() => {
    const w = document.createElement("div");
    w.id = "toast-wrap";
    document.body.appendChild(w);
    return w;
  })();

  wrap.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 2800);
}

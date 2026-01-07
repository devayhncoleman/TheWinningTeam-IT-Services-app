// =========================
// Theme toggle (day / night)
// =========================

const THEME_KEY = "twt_theme_mode";

function applyTheme(mode) {
  if (mode === "night") {
    document.body.classList.add("night-mode");
  } else {
    document.body.classList.remove("night-mode");
  }
}

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "night") {
    applyTheme("night");
  } else {
    applyTheme("day");
  }
})();

const toggleNightShiftBtn = document.getElementById("toggleNightShift");

if (toggleNightShiftBtn) {
  toggleNightShiftBtn.addEventListener("click", () => {
    const isNight = document.body.classList.contains("night-mode");
    const next = isNight ? "day" : "night";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

// =========================
// Background music controls
// =========================

const musicToggle = document.getElementById("musicToggle");
const musicVol = document.getElementById("musicVol");
const bgMusic = document.getElementById("bgMusic");
const alertSound = document.getElementById("alertSound");

if (musicToggle && bgMusic) {
  musicToggle.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play().catch(() => {});
      musicToggle.textContent = "Pause music 🎵";
    } else {
      bgMusic.pause();
      musicToggle.textContent = "Play music 🎵";
    }
  });
}

if (musicVol && bgMusic) {
  musicVol.addEventListener("input", () => {
    bgMusic.volume = parseFloat(musicVol.value || "0.25");
  });
}

// =========================
// Landing page fun bits
// =========================

const hireMeBtn = document.getElementById("hireMeBtn");
if (hireMeBtn) {
  hireMeBtn.addEventListener("click", () => {
    const contact = [
      "DeVayhn (Devayjah) Coleman",
      "Austin, TX",
      "Phone: (510) 934-7112",
      "LinkedIn: linkedin.com/in/devayhn-coleman-788411223"
    ].join("\n");
    navigator.clipboard?.writeText(contact).catch(() => {});
    alert("Contact info copied. Looking forward to hearing from you.");
  });
}

const statusLine = document.getElementById("statusLine");
const simulateAlertBtn = document.getElementById("simulateAlertBtn");
const calmDownBtn = document.getElementById("calmDownBtn");

if (simulateAlertBtn && statusLine) {
  simulateAlertBtn.addEventListener("click", () => {
    statusLine.textContent = "Incident detected: elevated error rates in production. Triaging…";
    alertSound?.play().catch(() => {});
  });
}

if (calmDownBtn && statusLine) {
  calmDownBtn.addEventListener("click", () => {
    statusLine.textContent = "Status: Standing by for alerts…";
  });
}

// RCA mini-game

const rcaGenBtn = document.getElementById("rcaGenBtn");
const rcaA = document.getElementById("rcaA");
const rcaB = document.getElementById("rcaB");
const rcaC = document.getElementById("rcaC");
const rcaPrompt = document.getElementById("rcaPrompt");
const rcaFeedback = document.getElementById("rcaFeedback");

const INCIDENTS = [
  {
    text: "Alert: Web app latency spike detected on one node.",
    answer: "C"
  },
  {
    text: "Alert: DNS failures from one branch office.",
    answer: "A"
  },
  {
    text: "Alert: Multiple authentication failures from a single account.",
    answer: "C"
  }
];

if (rcaGenBtn && rcaPrompt && rcaFeedback) {
  rcaGenBtn.addEventListener("click", () => {
    const idx = Math.floor(Math.random() * INCIDENTS.length);
    const incident = INCIDENTS[idx];
    rcaPrompt.textContent = incident.text;
    rcaPrompt.dataset.correct = incident.answer;
    rcaFeedback.textContent = "";
  });

  function handleRca(choice) {
    const correct = rcaPrompt.dataset.correct;
    if (!correct) return;
    if (choice === correct) {
      rcaFeedback.textContent = "Correct: observe, gather evidence, then escalate with context.";
    } else if (choice === "B") {
      rcaFeedback.textContent = "Restarting everything is risky. Check logs and confirm first.";
    } else {
      rcaFeedback.textContent = "Logs help, but you still want to escalate with evidence and impact.";
    }
  }

  rcaA?.addEventListener("click", () => handleRca("A"));
  rcaB?.addEventListener("click", () => handleRca("B"));
  rcaC?.addEventListener("click", () => handleRca("C"));
}

// Copy helpers

const copyBulletsBtn = document.getElementById("copyBulletsBtn");
if (copyBulletsBtn) {
  copyBulletsBtn.addEventListener("click", () => {
    const experienceSection = document.getElementById("experience");
    if (!experienceSection) return;
    const bullets = experienceSection.querySelectorAll("li");
    const text = Array.from(bullets)
      .map((li) => "- " + li.textContent.trim())
      .join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    alert("Experience bullets copied.");
  });
}

const copyContactBtn = document.getElementById("copyContactBtn");
if (copyContactBtn) {
  copyContactBtn.addEventListener("click", () => {
    const text =
      "DeVayhn (Devayjah) Coleman\nAustin, TX\nPhone: (510) 934-7112\nLinkedIn: linkedin.com/in/devayhn-coleman-788411223\nGitHub: github.com/devayhncoleman";
    navigator.clipboard?.writeText(text).catch(() => {});
    alert("Contact info copied.");
  });
}

const panicBtn = document.getElementById("panicBtn");
if (panicBtn) {
  panicBtn.addEventListener("click", () => {
    alert("Deep breath. Triage, document, escalate with context. You’ve got this.");
  });
}

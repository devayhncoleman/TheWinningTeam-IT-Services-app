// =======================================
// Global Theme + Interactions Script
// index.html, Showcase.html, tickets.html,
// ticket-detail.html
// =======================================

const THEME_KEY = "dw-theme";

// ------------------ THEME ------------------

function applyTheme(mode) {
  const body = document.body;

  if (mode !== "night" && mode !== "day") {
    mode = "day";
  }

  body.classList.remove("theme-day", "theme-night");
  body.classList.add(mode === "night" ? "theme-night" : "theme-day");

  // persist choice
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch (_) {}

  // update toggle label
  const toggleBtn = document.getElementById("toggleNightShift");
  if (toggleBtn) {
    toggleBtn.textContent =
      mode === "night" ? "Day Mode ☀️" : "Night Shift Mode 🦉";
  }
}

function initTheme() {
  let initial = "day";

  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "day" || stored === "night") {
      initial = stored;
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      initial = "night";
    }
  } catch (_) {}

  applyTheme(initial);

  const toggleBtn = document.getElementById("toggleNightShift");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isNight = document.body.classList.contains("theme-night");
      applyTheme(isNight ? "day" : "night");
    });
  }
}

// ------------------ UTILITIES ------------------

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}

// ------------------ LANDING PAGE INTERACTIONS ------------------

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
      statusLine.textContent =
        "High-priority alert generated. Triage in progress…";
      statusLine.parentElement?.classList.add("status-panel--active");
    });

    calmDownBtn.addEventListener("click", () => {
      statusLine.textContent = "Standing by for alerts…";
      statusLine.parentElement?.classList.remove("status-panel--active");
    });
  }

  // Chips
  const chips = document.querySelectorAll(".chip");
  if (chips.length) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("chip--active");
      });
    });
  }

  // Mini RCA game
  const rcaPrompt = document.getElementById("rcaPrompt");
  const rcaGenBtn = document.getElementById("rcaGenBtn");
  const rcaA = document.getElementById("rcaA");
  const rcaB = document.getElementById("rcaB");
  const rcaC = document.getElementById("rcaC");
  const rcaFeedback = document.getElementById("rcaFeedback");

  if (rcaPrompt && rcaGenBtn && rcaA && rcaB && rcaC && rcaFeedback) {
    const scenarios = [
      {
        text: "Users in one region report app timeouts. CPU is normal, but latency on one API jumps.",
        answer: "A",
        feedback:
          "Checking logs first is the right move — gather evidence before restarting or escalating."
      },
      {
        text: "A non-critical batch job fails, but customer-facing services are healthy.",
        answer: "C",
        feedback:
          "Escalate with evidence so the owning team can fix it without disrupting healthy systems."
      },
      {
        text: "All monitoring panels go red after a recent config deployment.",
        answer: "A",
        feedback:
          "Check logs + recent changes first. Blind restarts can make noisy incidents even worse."
      }
    ];

    let currentScenarioIndex = -1;

    function loadScenario() {
      currentScenarioIndex =
        (currentScenarioIndex + 1) % scenarios.length;
      rcaPrompt.textContent = scenarios[currentScenarioIndex].text;
      rcaFeedback.textContent = "";
    }

    function checkAnswer(choice) {
      if (currentScenarioIndex < 0) return;
      const scenario = scenarios[currentScenarioIndex];
      if (choice === scenario.answer) {
        rcaFeedback.textContent = "Solid call. That’s how you think like NOC.";
        rcaFeedback.className = "mini feedback feedback--good";
      } else {
        rcaFeedback.textContent =
          "Not ideal. In ops, slow is smooth, smooth is fast — gather info, then act.";
        rcaFeedback.className = "mini feedback feedback--bad";
      }
    }

    rcaGenBtn.addEventListener("click", loadScenario);
    rcaA.addEventListener("click", () => checkAnswer("A"));
    rcaB.addEventListener("click", () => checkAnswer("B"));
    rcaC.addEventListener("click", () => checkAnswer("C"));
  }

  // Copy bullets
  const copyBulletsBtn = document.getElementById("copyBulletsBtn");
  if (copyBulletsBtn) {
    copyBulletsBtn.addEventListener("click", async () => {
      const bullets = document.querySelector("#experience .bullets");
      if (!bullets) return;
      const text = Array.from(bullets.querySelectorAll("li"))
        .map((li) => "• " + li.textContent.trim())
        .join("\n");
      const ok = await copyTextToClipboard(text);
      copyBulletsBtn.textContent = ok ? "Copied ✅" : "Copy failed";
      setTimeout(() => {
        copyBulletsBtn.textContent = "Copy experience bullets 📋";
      }, 2000);
    });
  }

  // Copy contact
  const copyContactBtn = document.getElementById("copyContactBtn");
  if (copyContactBtn) {
    copyContactBtn.addEventListener("click", async () => {
      const infoBlock = document.querySelector("#contact article");
      if (!infoBlock) return;
      const ok = await copyTextToClipboard(infoBlock.innerText.trim());
      copyContactBtn.textContent = ok ? "Copied ✅" : "Copy failed";
      setTimeout(() => {
        copyContactBtn.textContent = "Copy contact info";
      }, 2000);
    });
  }

  const panicBtn = document.getElementById("panicBtn");
  if (panicBtn) {
    panicBtn.addEventListener("click", () => {
      alert(
        "Panic button hit.\n\nFirst move in real life? Breathe, check impact, check runbooks, then escalate with context."
      );
    });
  }
}

// ------------------ GLOBAL MUSIC CONTROLS ------------------

function initMusic() {
  const musicToggle = document.getElementById("musicToggle");
  const musicVol = document.getElementById("musicVol");
  const bgMusic = document.getElementById("bgMusic");

  if (!musicToggle || !bgMusic || !musicVol) return;

  let isPlaying = false;

  musicToggle.addEventListener("click", () => {
    if (!isPlaying) {
      bgMusic.play().catch(() => {});
      isPlaying = true;
      musicToggle.textContent = "Pause music ⏸️";
    } else {
      bgMusic.pause();
      isPlaying = false;
      musicToggle.textContent = "Play music 🎵";
    }
  });

  musicVol.addEventListener("input", () => {
    bgMusic.volume = parseFloat(musicVol.value || "0.25");
  });
}

// ------------------ INIT ------------------

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMusic();
  initLandingPage(); // safe on pages without those elements
});

// ==============================================
// Global UI Script
// ==============================================

// Night Shift Mode (day = purple, night = royal blue)
const toggleNightShiftBtn = document.getElementById("toggleNightShift");

if (toggleNightShiftBtn) {
  toggleNightShiftBtn.addEventListener("click", () => {
    document.body.classList.toggle("night-mode");
  });
}

// Music controls
const musicToggle = document.getElementById("musicToggle");
const musicVol = document.getElementById("musicVol");
const bgMusic = document.getElementById("bgMusic");
const alertSound = document.getElementById("alertSound");

if (bgMusic && musicToggle) {
  let isPlaying = false;

  musicToggle.addEventListener("click", () => {
    if (!isPlaying) {
      bgMusic.loop = true;
      bgMusic.play().catch((err) => console.warn("Music play blocked:", err));
      isPlaying = true;
      musicToggle.textContent = "Pause music 🎵";
    } else {
      bgMusic.pause();
      isPlaying = false;
      musicToggle.textContent = "Play music 🎵";
    }
  });

  if (musicVol) {
    musicVol.addEventListener("input", (e) => {
      bgMusic.volume = Number(e.target.value);
    });
  }
}

// Hire Me button
const hireMeBtn = document.getElementById("hireMeBtn");
if (hireMeBtn) {
  hireMeBtn.addEventListener("click", () => {
    window.location.href = "mailto:devayhncoleman@gmail.com?subject=Role%20Inquiry%20-%20NOC%20/%20Cloud%20Ops";
  });
}

// Fun "Status" panel on index
const statusLine = document.getElementById("statusLine");
const simulateAlertBtn = document.getElementById("simulateAlertBtn");
const calmDownBtn = document.getElementById("calmDownBtn");

if (simulateAlertBtn && statusLine) {
  simulateAlertBtn.addEventListener("click", () => {
    statusLine.textContent = "High priority alert detected. Investigating logs and impact…";
    if (alertSound) {
      alertSound.currentTime = 0;
      alertSound.play().catch(() => {});
    }
  });
}

if (calmDownBtn && statusLine) {
  calmDownBtn.addEventListener("click", () => {
    statusLine.textContent = "Incident resolved. Documented, closed, and ready for the next shift.";
  });
}

// Mini RCA game
const rcaGenBtn = document.getElementById("rcaGenBtn");
const rcaPrompt = document.getElementById("rcaPrompt");
const rcaA = document.getElementById("rcaA");
const rcaB = document.getElementById("rcaB");
const rcaC = document.getElementById("rcaC");
const rcaFeedback = document.getElementById("rcaFeedback");

const incidents = [
  "Service latency spike reported on customer portal.",
  "Multiple failed logins from a single IP address.",
  "Disk usage on a critical server is at 92%.",
];

if (rcaGenBtn && rcaPrompt && rcaA && rcaB && rcaC && rcaFeedback) {
  rcaGenBtn.addEventListener("click", () => {
    const pick = incidents[Math.floor(Math.random() * incidents.length)];
    rcaPrompt.textContent = pick;
    rcaFeedback.textContent = "Which next step would you take?";
  });

  rcaA.addEventListener("click", () => {
    rcaFeedback.textContent = "Good first move. Logs give you evidence before touching systems.";
  });

  rcaB.addEventListener("click", () => {
    rcaFeedback.textContent = "Restarting everything is risky. You’d want more data before doing that.";
  });

  rcaC.addEventListener("click", () => {
    rcaFeedback.textContent =
      "Escalating with evidence is strong, but make sure you’ve at least checked logs and basic health first.";
  });
}

// Copy bullets (experience section)
const copyBulletsBtn = document.getElementById("copyBulletsBtn");
if (copyBulletsBtn) {
  copyBulletsBtn.addEventListener("click", () => {
    const bullets = document.querySelector("#experience .bullets");
    if (!bullets) return;
    const text = Array.from(bullets.querySelectorAll("li"))
      .map((li) => "• " + li.textContent.trim())
      .join("\n");

    navigator.clipboard.writeText(text).then(
      () => alert("Experience bullets copied to clipboard."),
      () => alert("Could not copy bullets.")
    );
  });
}

// Copy contact info
const copyContactBtn = document.getElementById("copyContactBtn");
if (copyContactBtn) {
  copyContactBtn.addEventListener("click", () => {
    const text =
      "DeVayhn (Devayjah) Coleman\nAustin, TX\nPhone: (510) 934-7112\nLinkedIn: linkedin.com/in/devayhn-coleman-788411223\nGitHub: github.com/devayhncoleman";
    navigator.clipboard.writeText(text).then(
      () => alert("Contact info copied."),
      () => alert("Could not copy contact info.")
    );
  });
}

// Panic button (for fun)
const panicBtn = document.getElementById("panicBtn");
if (panicBtn) {
  panicBtn.addEventListener("click", () => {
    alert("Deep breath. Step 1: Check impact. Step 2: Check logs. Step 3: Communicate clearly. You got this.");
  });
}

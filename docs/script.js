(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  // ---------- Toasts ----------
  const toast = (() => {
    let host = $("#toastHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "toastHost";
      host.style.cssText = `
        position: fixed; z-index: 9999; right: 16px; bottom: 16px;
        display: grid; gap: 10px; max-width: min(360px, 90vw);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      `;
      document.body.appendChild(host);
    }

        function show(msg, type = "info", ttl = 3200) {
      const el = document.createElement("div");

      const isNight = document.documentElement.classList.contains("night-shift");
      let bg;

      if (!isNight) {
        // DAY: purple + gold energy
        bg =
          type === "good"
            ? "linear-gradient(135deg, #2bbf82, #20a566)"    // success: green/gold
            : type === "bad"
            ? "linear-gradient(135deg, #f24b70, #c8334f)"    // error: deep pink/red
            : "linear-gradient(135deg, #4f3dd9, #8b5cf6)";   // info: royal purple
      } else {
        // NIGHT: royal blue energy
        bg =
          type === "good"
            ? "linear-gradient(135deg, #2dd4bf, #14b8a6)"    // teal success
            : type === "bad"
            ? "linear-gradient(135deg, #fb7185, #e11d48)"    // neon red
            : "linear-gradient(135deg, #3b82f6, #1d4ed8)";   // blue info
      }

      el.style.cssText = `
        background: ${bg};
        color: white;
        padding: 12px 14px;
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0,0,0,.22);
        transform: translateY(8px);
        opacity: 0;
        transition: transform .18s ease, opacity .18s ease;
        line-height: 1.25;
        border: 1px solid rgba(255,255,255,0.12);
      `;

      el.textContent = msg;
      host.appendChild(el);

      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });

      const t = setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(8px)";
        setTimeout(() => el.remove(), 220);
      }, ttl);

      el.addEventListener("click", () => { clearTimeout(t); el.remove(); });
    }

    return { show };
  })();

  // ---------- Smooth scroll ----------
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ---------- Reveal ----------
  const revealables = $$("[data-reveal]");
  if (revealables.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add("is-visible");
          io.unobserve(ent.target);
        }
      });
    }, { threshold: 0.12 });
    revealables.forEach(el => io.observe(el));
  }

   // ---------- Night shift mode ----------
  const nightBtn = $("#toggleNightShift");
  if (nightBtn) {
    const key = "nightShiftMode";

    const applyNightShift = (on) => {
      document.documentElement.classList.toggle("night-shift", on);
      nightBtn.textContent = on ? "Switch to Day Mode ☀️" : "Night Shift Mode 🦉";
    };

    // Load saved preference
    const saved = localStorage.getItem(key);
    if (saved) {
      applyNightShift(saved === "on");
    } else {
      applyNightShift(false); // default: DAY = purple + gold
    }

    nightBtn.addEventListener("click", () => {
      const isOn = document.documentElement.classList.contains("night-shift");
      const next = !isOn;
      applyNightShift(next);
      localStorage.setItem(key, next ? "on" : "off");
      toast.show(
        next ? "Night Shift Mode engaged. Royal blue vibes. 🦉" : "Day Mode restored. Purple & gold. ☀️",
        "info"
      );
    });
  }


  // ---------- Sparkle burst ----------
  function sparkleBurst(anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const count = 18;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      const angle = (Math.PI * 2) * (i / count);
      const dist = 60 + Math.random() * 30;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      p.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        width: 8px; height: 8px; border-radius: 999px;
        background: white; opacity: .9;
        transform: translate(-50%,-50%);
        pointer-events: none; z-index: 9998;
        filter: drop-shadow(0 6px 10px rgba(0,0,0,.25));
      `;
      document.body.appendChild(p);

      p.animate([
        { transform: `translate(-50%,-50%) translate(0px,0px) scale(1)`, opacity: .95 },
        { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.6)`, opacity: 0 }
      ], { duration: 520 + Math.random() * 240, easing: "cubic-bezier(.2,.8,.2,1)" })
      .onfinish = () => p.remove();
    }
  }

  // ---------- Hire Me ----------
  const hireBtn = $("#hireMeBtn");
  if (hireBtn) {
    const lines = [
      "Recruiter detected. Deploying charm packets…",
      "✅ Uptime: high. ✅ Drama: low. ✅ Coffee: yes.",
      "This click has been logged as an incident (Severity: Exciting).",
      "Autoscaling confidence… now at 9000%.",
      "If you can read this toast, you're in the running to become America's Next Top Model"
    ];
    hireBtn.addEventListener("click", () => {
      sparkleBurst(hireBtn);
      toast.show(lines[Math.floor(Math.random() * lines.length)], "good");
    });
  }

  // ---------- Fun “Alert simulator” ----------
  const statusLine = $("#statusLine");
  const simulateAlertBtn = $("#simulateAlertBtn");
  const calmDownBtn = $("#calmDownBtn");

  const alertLines = [
    "ALERT: CPU at 99% (it’s thinking about life).",
    "ALERT: DNS is acting brand new again.",
    "ALERT: Service flapped. It’s indecisive.",
    "ALERT: Disk space low. Someone’s hoarding logs.",
    "ALERT: Latency spike. Packets stuck in traffic."
  ];
  const calmLines = [
    "Incident resolved. Uptime protected. 🛡️",
    "Stability restored. The graphs are smiling again.",
    "We’re back. Post-incident snack break approved.",
    "All clear. Return to scheduled excellence."
  ];

  function setStatus(txt) {
    if (statusLine) statusLine.textContent = txt;
  }

  if (simulateAlertBtn) {
    simulateAlertBtn.addEventListener("click", () => {
      setStatus(alertLines[Math.floor(Math.random() * alertLines.length)]);
      toast.show("New alert received. Triage time. 🔍", "bad");
    });
  }
  if (calmDownBtn) {
    calmDownBtn.addEventListener("click", () => {
      setStatus(calmLines[Math.floor(Math.random() * calmLines.length)]);
      toast.show("Resolved. Document it and flex. 📒", "good");
    });
  }

  // ---------- Clickable skill chips ----------
  $$(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const word = chip.getAttribute("data-chip") || "Skill";
      const quips = [
        `${word}? Yeah. I speak that fluently.`,
        `${word} selected. This is where the magic happens.`,
        `${word} loaded. No bugs… only “features.”`,
        `${word}: respectfully, I’m like that.`
      ];
      toast.show(quips[Math.floor(Math.random() * quips.length)], "info");
      sparkleBurst(chip);
    });
  });

  // ---------- Copy buttons ----------
  const copyBulletsBtn = $("#copyBulletsBtn");
  if (copyBulletsBtn) {
    copyBulletsBtn.addEventListener("click", async () => {
      const bullets = $$("#experience .bullets li").map(li => `• ${li.textContent.trim()}`).join("\n");
      try {
        await navigator.clipboard.writeText(bullets);
        toast.show("Experience bullets copied. Paste with confidence. 📋", "good");
      } catch {
        toast.show("Clipboard blocked. Try HTTPS or run Live Server in VS Code.", "bad");
      }
    });
  }

  const copyContactBtn = $("#copyContactBtn");
  if (copyContactBtn) {
    copyContactBtn.addEventListener("click", async () => {
      const text = `DeVayhn (Devayjah) Coleman\nAustin, TX\n(510) 934-7112`;
      try {
        await navigator.clipboard.writeText(text);
        toast.show("Contact info copied. Easy. ✅", "good");
      } catch {
        toast.show("Clipboard blocked. Try HTTPS or VS Code Live Server.", "bad");
      }
    });
  }

  // ---------- Panic button (comedic) ----------
  const panicBtn = $("#panicBtn");
if (panicBtn) {
  panicBtn.addEventListener("click", () => {
    toast.show("PANIC MODE: enabled. (Only use for production incidents and job offers.)", "bad", 4200);
    document.documentElement.classList.toggle("boss-mode");

    // Play red alert sound if present
    if (alertSound) {
      try {
        alertSound.currentTime = 0;  // restart from beginning
        alertSound.volume = 0.9;     // loud but not max
        alertSound.play();
      } catch (e) {
        console.warn("Alert sound failed to play:", e);
      }
    }
  });
}


  // ---------- Mini game: Find the Root Cause ----------
  const rcaPrompt = $("#rcaPrompt");
  const rcaFeedback = $("#rcaFeedback");
  const rcaGenBtn = $("#rcaGenBtn");
  const rcaA = $("#rcaA");
  const rcaB = $("#rcaB");
  const rcaC = $("#rcaC");

  const incidents = [
    { text: "Users report: ‘Website slow’ + CPU normal + DB connections climbing.", best: "A", why: "Start with logs/metrics to find the bottleneck before touching anything." },
    { text: "Alert: DNS failures across multiple hosts after a change window.", best: "C", why: "Escalate with evidence + suspected change impact; avoid random restarts." },
    { text: "Service is down on one node only; other nodes fine.", best: "A", why: "Check logs + service status on the affected node first." },
    { text: "Random packet loss reported, correlated with peak traffic hours.", best: "A", why: "Check logs/monitoring and network metrics; collect evidence." },
    { text: "Pager says ‘Disk space low’ and logs are exploding.", best: "A", why: "Confirm what’s consuming space (logs) before taking corrective action." }
  ];

  let current = null;

  function setFeedback(msg, good = true) {
    if (!rcaFeedback) return;
    rcaFeedback.textContent = msg;
    rcaFeedback.style.fontWeight = "600";
    rcaFeedback.style.marginTop = "0.6rem";
    rcaFeedback.style.color = good ? "#1b7a3a" : "#b00020";
  }

  if (rcaGenBtn) {
    rcaGenBtn.addEventListener("click", () => {
      current = incidents[Math.floor(Math.random() * incidents.length)];
      if (rcaPrompt) rcaPrompt.innerHTML = `<strong>Incident:</strong> ${current.text}`;
      setFeedback("Choose your next step.", true);
      toast.show("New incident generated. Don’t restart everything. 😭", "info");
    });
  }

  function choose(letter) {
    if (!current) {
      toast.show("Generate an incident first 😅", "bad");
      return;
    }
    if (letter === current.best) {
      setFeedback(`Correct ✅ ${current.why}`, true);
      toast.show("W decision. Evidence > vibes. 📈", "good");
    } else {
      setFeedback(`Not quite ❌ Best answer was ${current.best}. ${current.why}`, false);
      toast.show("That choice causes a postmortem. Try again. 🫠", "bad");
    }
  }

  if (rcaA) rcaA.addEventListener("click", () => choose("A"));
  if (rcaB) rcaB.addEventListener("click", () => choose("B"));
  if (rcaC) rcaC.addEventListener("click", () => choose("C"));

  // ---------- Music ----------
  const audio = $("#bgMusic");
  const musicToggle = $("#musicToggle");
  const musicVol = $("#musicVol");
  const alertSound = $("#alertSound");

  if (audio && musicToggle) {
    audio.loop = true;
    audio.volume = 0.25;

    const key = "musicMuted";
    const savedMuted = localStorage.getItem(key);
    if (savedMuted === "yes") audio.muted = true;

    const syncLabel = () => {
      if (audio.muted) musicToggle.textContent = "Unmute music 🔊";
      else musicToggle.textContent = audio.paused ? "Play music 🎵" : "Pause music ⏸️";
    };
    syncLabel();

    musicToggle.addEventListener("click", async () => {
      try {
        if (audio.muted) {
          audio.muted = false;
          localStorage.setItem(key, "no");
          toast.show("Unmuted. Vibes restored. 🎶", "good");
          syncLabel();
          return;
        }
        if (audio.paused) {
          await audio.play();
          toast.show("Now playing: tasteful bops. 🎧", "good");
        } else {
          audio.pause();
          toast.show("Music paused. Back to business. 🧠", "info");
        }
        syncLabel();
      } catch (e) {
        toast.show("Audio couldn’t start. Check assets/music.mp3 path.", "bad");
        console.warn(e);
      }
    });

    if (musicVol) {
      musicVol.addEventListener("input", () => {
        audio.volume = clamp(Number(musicVol.value), 0, 1);
      });
    }

    // Press "M" to mute/unmute
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "m") {
        audio.muted = !audio.muted;
        localStorage.setItem(key, audio.muted ? "yes" : "no");
        toast.show(audio.muted ? "Muted. Stealth mode. 🥷" : "Unmuted. Vibes back. 🎵", "info");
        syncLabel();
      }
    });
  }

  // ---------- Konami code => Boss mode ----------
  const konami = ["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
  let idx = 0;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === konami[idx]) {
      idx++;
      if (idx === konami.length) {
        idx = 0;
        document.documentElement.classList.toggle("boss-mode");
        toast.show("Boss Mode unlocked. 🕶️", "good");
      }
    } else {
      idx = 0;
    }
  });

  window.addEventListener("load", () => {
    toast.show("Welcome. Please keep hands and feet inside the uptime at all times. 🛠️", "info");
  });
})();

/* easter-egg.js — Konami code: toast + pixel confetti. Skippable, non-blocking. */
(function () {
  "use strict";
  const SEQ = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let pos = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onKey(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === SEQ[pos]) {
      pos++;
      if (pos === SEQ.length) {
        pos = 0;
        trigger();
      }
    } else {
      // allow restart if the key matches the first element
      pos = (k === SEQ[0]) ? 1 : 0;
    }
  }
  window.addEventListener("keydown", onKey);

  function trigger() {
    if (window.SFX) SFX.konami();
    if (window.toast) {
      window.toast("<strong>ACHIEVEMENT UNLOCKED</strong><br>You found the hidden code.", { icon: "i-trophy", ttl: 4200 });
    }
    if (!reduce) confetti();
  }

  function confetti() {
    const cs = getComputedStyle(document.documentElement);
    const pick = (v, fb) => (cs.getPropertyValue(v).trim() || fb);
    const colors = [
      pick("--accent", "#FF5A2E"),
      pick("--accent-tint", "#FFD9C7"),
      pick("--bg-surface-alt", "#1B3A66"),
      pick("--white", "#FFFFFF"),
      pick("--accent-deep", "#D8431C")
    ];
    const n = 60;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      const size = 6 + Math.floor(Math.random() * 6);
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.background = colors[i % colors.length];
      p.style.left = (Math.random() * 100) + "vw";
      p.style.top = "-20px";
      p.style.animationDuration = (1.1 + Math.random() * 1.1) + "s";
      p.style.animationDelay = (Math.random() * 0.25) + "s";
      p.style.transform = "rotate(" + (Math.random() * 360) + "deg)";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 2200);
    }
  }
})();

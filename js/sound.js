/* sound.js — 8-bit UI blips + looping background music. Starts enabled. Attempts autoplay on load. */
(function () {
  "use strict";

  /* Background music track */
  const music = new Audio("assets/music/music.mp3");
  music.loop = true;
  music.preload = "auto";
  music.volume = 0.4;

  /* Backup loop trigger in case browser ignores the loop attribute */
  music.addEventListener("ended", function () {
    if (SFX.enabled) {
      music.currentTime = 0;
      music.play().catch(() => {});
    }
  });

  const SFX = {
    enabled: true,
    ctx: null,
    music: music,
    blip(freq, dur, type, gain) {
      if (!this.enabled) return;
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this.ctx;
        if (ctx.state === "suspended") ctx.resume();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type || "square";
        o.frequency.value = freq || 440;
        g.gain.value = gain == null ? 0.06 : gain;
        o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime;
        o.start(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
        o.stop(t + (dur || 0.08));
      } catch (e) { /* audio unavailable — fail silent */ }
    },
    click() { this.blip(660, 0.05, "square", 0.05); },
    unlock() { this.blip(523, 0.06, "square", 0.06); setTimeout(() => this.blip(784, 0.09, "square", 0.06), 70); },
    copy() { this.blip(880, 0.05, "square", 0.05); },
    konami() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.blip(f,0.09,"square",0.07), i*90)); },
    setEnabled(on) {
      this.enabled = !!on;
      try {
        if (this.enabled) {
          music.muted = false;
          music.play().catch(() => { /* autoplay blocked until user gesture */ });
        } else {
          music.pause();
          music.muted = true;
        }
      } catch (e) { /* audio unavailable */ }
    }
  };

  /* Attempt autoplay on page load. Browsers may block this; if so,
     the first user interaction (click, touch, key) will trigger playback. */
  function tryPlay() {
    if (SFX.enabled) music.play().catch(() => { /* browser denied autoplay */ });
  }
  tryPlay();

  /* Fallback: unlock audio on first user gesture if autoplay was denied */
  function unlockOnInteraction(e) {
    if (!SFX.enabled) return;
    if (e && e.target && e.target.closest("#soundToggle")) return; /* don't fight the toggle button */
    if (music.paused) {
      music.play().catch(() => {});
    }
    if (SFX.ctx && SFX.ctx.state === "suspended") {
      try { SFX.ctx.resume(); } catch (_) {}
    }
    window.removeEventListener("click", unlockOnInteraction, true);
    window.removeEventListener("touchstart", unlockOnInteraction, true);
    window.removeEventListener("keydown", unlockOnInteraction, true);
  }
  window.addEventListener("click", unlockOnInteraction, true);
  window.addEventListener("touchstart", unlockOnInteraction, true);
  window.addEventListener("keydown", unlockOnInteraction, true);

  /* Update sound toggle button to ON by default */
  const soundBtn = document.getElementById("soundToggle");
  if (soundBtn) soundBtn.setAttribute("aria-pressed", "true");

  window.SFX = SFX;
})();

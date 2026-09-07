/* sound.js — 8-bit UI blips + looping background music. Starts enabled. Attempts autoplay on load. */
(function () {
  "use strict";

  /* Background music track */
  const music = new Audio("assets/music/music.mp3");
  music.loop = true;
  music.preload = "auto";
  music.volume = 0.4;
  music.muted = true; /* start muted so browser allows autoplay */

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
          music.play().catch(() => {});
        } else {
          music.pause();
        }
      } catch (e) { /* audio unavailable */ }
    }
  };

  /* Attempt muted autoplay on page load. Browsers allow muted autoplay.
     On first user interaction, we unmute so the music becomes audible. */
  function tryPlay() {
    if (SFX.enabled) {
      music.muted = true;
      music.play().catch(() => { /* browser denied even muted autoplay */ });
    }
  }
  tryPlay();

  /* Unmute on first user interaction — this satisfies browser autoplay policy */
  function unmuteOnInteraction(e) {
    if (!SFX.enabled) return;
    if (e && e.target && e.target.closest && e.target.closest("#soundToggle")) {
      /* Let the toggle handler in main.js control mute state */
      window.removeEventListener("click", unmuteOnInteraction, true);
      window.removeEventListener("touchstart", unmuteOnInteraction, true);
      window.removeEventListener("keydown", unmuteOnInteraction, true);
      window.removeEventListener("scroll", unmuteOnInteraction, true);
      window.removeEventListener("mousemove", unmuteOnInteraction, true);
      return;
    }
    music.muted = false;
    if (music.paused) music.play().catch(() => {});
    if (SFX.ctx && SFX.ctx.state === "suspended") {
      try { SFX.ctx.resume(); } catch (_) {}
    }
    window.removeEventListener("click", unmuteOnInteraction, true);
    window.removeEventListener("touchstart", unmuteOnInteraction, true);
    window.removeEventListener("keydown", unmuteOnInteraction, true);
    window.removeEventListener("scroll", unmuteOnInteraction, true);
    window.removeEventListener("mousemove", unmuteOnInteraction, true);
  }
  window.addEventListener("click", unmuteOnInteraction, true);
  window.addEventListener("touchstart", unmuteOnInteraction, true);
  window.addEventListener("keydown", unmuteOnInteraction, true);
  window.addEventListener("scroll", unmuteOnInteraction, true);
  window.addEventListener("mousemove", unmuteOnInteraction, true);

  /* Update sound toggle button to ON by default */
  const soundBtn = document.getElementById("soundToggle");
  if (soundBtn) soundBtn.setAttribute("aria-pressed", "true");

  window.SFX = SFX;
})();

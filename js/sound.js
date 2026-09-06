/* sound.js — 8-bit UI blips via WebAudio. Muted by default. Never autoplays. */
(function () {
  "use strict";
  const SFX = {
    enabled: false,
    ctx: null,
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
    konami() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.blip(f,0.09,"square",0.07), i*90)); }
  };
  window.SFX = SFX;
})();

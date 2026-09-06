/* main.js — boot, nav, smooth scroll, copy email, to-top, toast helper */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Toast ---------- */
  window.toast = function (msg, opts) {
    opts = opts || {};
    const stack = $("#toastStack");
    if (!stack) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    const icon = opts.icon ? '<svg class="ico" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><use href="#' + opts.icon + '"/></svg>' : "";
    el.innerHTML = icon + "<span>" + msg + "</span>";
    stack.appendChild(el);
    const ttl = opts.ttl || 2600;
    setTimeout(() => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 260);
    }, ttl);
  };

  /* ---------- Boot sequence (once per session) ---------- */
  function revealHero() { document.body.classList.add("booted"); }
  function runBoot() {
    const boot = $("#boot");
    if (reduce || sessionStorage.getItem("jh_boot_done")) {
      if (boot) boot.remove();
      revealHero();
      return;
    }
    const done = () => {
      sessionStorage.setItem("jh_boot_done", "1");
      boot.classList.add("is-done");
      revealHero();
      setTimeout(() => boot.remove(), 420);
    };
    // bar fill is ~1s via CSS; reveal hero as boot fades
    setTimeout(done, 1150);
  }
  runBoot();

  /* ---------- Nav toggle (mobile drawer) ---------- */
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      if (open && window.SFX) SFX.click();
    });
    $$("a", links).forEach(a => a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  /* ---------- Smooth scroll for in-page anchors ---------- */
  $$("a[data-scroll], a.nav-link, a.nav-logo").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (href.charAt(0) !== "#" || href.length < 2) return;
    a.addEventListener("click", (e) => {
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (window.SFX) SFX.click();
    });
  });

  /* ---------- Active nav link via IntersectionObserver ---------- */
  const sections = $$("main section[id]");
  const navMap = {};
  $$(".nav-link").forEach(l => { navMap[l.getAttribute("href").slice(1)] = l; });
  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          $$(".nav-link").forEach(l => l.classList.remove("is-active"));
          const active = navMap[en.target.id];
          if (active) active.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Copy email ---------- */
  const copyBtn = $("#copyEmail");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = "jaybondholliete1@gmail.com";
      if (window.SFX) SFX.copy();
      try {
        await navigator.clipboard.writeText(email);
        window.toast("Email copied to clipboard", { icon: "i-envelope" });
      } catch (e) {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = email; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); window.toast("Email copied to clipboard", { icon: "i-envelope" }); }
        catch (_) { window.toast("Copy failed — email: " + email); }
        ta.remove();
      }
    });
  }

  /* ---------- Back to top ---------- */
  const toTop = $("#toTop");
  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      if (window.SFX) SFX.click();
    });
  }

  /* ---------- Sound toggle ---------- */
  const soundBtn = $("#soundToggle");
  if (soundBtn && window.SFX) {
    soundBtn.addEventListener("click", () => {
      SFX.enabled = !SFX.enabled;
      soundBtn.setAttribute("aria-pressed", String(SFX.enabled));
      if (SFX.enabled) SFX.click();
      window.toast(SFX.enabled ? "Sound on" : "Sound muted", { ttl: 1400 });
    });
  }

  /* ---------- Generic click blip for [data-sound] ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-sound]");
    if (t && window.SFX) SFX.click();
  });
})();

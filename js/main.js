/* main.js — boot, nav, smooth scroll, copy email, to-top, toast helper */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Clean tracking params from URL ---------- */
  /* Strips fbclid, utm_*, gclid, ref, etc. so the address bar stays clean */
  (function cleanUrl() {
    if (!window.history || !history.replaceState) return;
    const url = new URL(window.location.href);
    const trackers = ["fbclid", "gclid", "msclkid", "ref", "_ga", "mc_eid", "mc_cid"];
    let changed = false;
    // remove known trackers
    trackers.forEach(function (k) {
      if (url.searchParams.has(k)) { url.searchParams.delete(k); changed = true; }
    });
    // remove any utm_* params
    Array.from(url.searchParams.keys()).forEach(function (k) {
      if (k.indexOf("utm_") === 0) { url.searchParams.delete(k); changed = true; }
    });
    if (changed) history.replaceState(null, "", url.pathname + url.search + url.hash);
  })();

  /* ---------- Hash routing for codelibrary ---------- */
  /* Shows /#codelibrary in the address bar instead of /codelibrary.html */
  /* Also strips index.html from the URL so it shows /#about instead of /index.html#about */
  (function hashRoute() {
    if (!window.history || !history.replaceState) return;
    var path = window.location.pathname;
    var hash = window.location.hash;
    var base = path.substring(0, path.lastIndexOf("/") + 1); // e.g. /fortfolio/

    // If on codelibrary.html, rewrite URL to /#codelibrary
    if (path.indexOf("codelibrary.html") !== -1) {
      history.replaceState(null, "", base + "#codelibrary");
      return;
    }

    // If on index.html, strip "index.html" from the URL
    if (path.indexOf("index.html") !== -1) {
      history.replaceState(null, "", base + hash);
      // don't return — still check for #codelibrary below
    }

    // If on root (index.html served implicitly) and hash is #codelibrary,
    // redirect to codelibrary.html which will then rewrite URL back to /#codelibrary
    if (hash === "#codelibrary") {
      window.location.replace(base + "codelibrary.html");
      return;
    }
  })();

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

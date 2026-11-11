/* analytics.js — page views, download clicks, RaftyTrip rating widget, GitHub counts.
   Fire-and-forget: every block is isolated in try/catch so nothing here can
   break the page or each other. */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const API_BASE = (window.JH_API_BASE || "https://fortfolio-api.vercel.app").replace(/\/+$/, ""); // TODO: update to real Vercel URL after deploy
  const GAME = "raftytrip";

  /* ---------- transport ---------- */

  function beacon(path, data) {
    try {
      const body = JSON.stringify(data);
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon && navigator.sendBeacon(API_BASE + path, blob)) return;
      fetch(API_BASE + path, {
        method: "POST",
        body: body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        mode: "cors",
      }).catch(function () {});
    } catch (e) { /* analytics must never throw */ }
  }

  function apiGet(path) {
    return fetch(API_BASE + path, { mode: "cors" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function apiPost(path, data) {
    return fetch(API_BASE + path, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
      mode: "cors",
    })
      .then(function (r) { return r.ok ? r.json().catch(function () { return { ok: true }; }) : null; })
      .catch(function () { return null; });
  }

  /* ---------- page view ---------- */

  function trackPageView() {
    beacon("/api/track", {
      event: "page_view",
      game: "site",
      path: window.location.pathname,
    });
  }

  /* ---------- download clicks ---------- */

  function platformFor(href) {
    const h = (href || "").toLowerCase();
    if (h.indexOf(".apk") !== -1) return "android";
    if (h.indexOf(".zip") !== -1) return "pc";
    return null;
  }

  function initDownloadClicks() {
    document.addEventListener("click", function (e) {
      try {
        const a = e.target && e.target.closest ? e.target.closest(".game-dl-row a") : null;
        if (!a) return;
        const platform = platformFor(a.getAttribute("href"));
        if (!platform) return;
        beacon("/api/track", {
          event: "download_click",
          game: GAME,
          platform: platform,
          path: window.location.pathname,
        });
      } catch (err) { /* never block navigation */ }
    });
  }

  /* ---------- rating widget ---------- */

  function rateMetaText(avg, count) {
    if (!count) return "No ratings yet — be the first!";
    return "★ " + avg.toFixed(1) + " · " + count + (count === 1 ? " rating" : " ratings");
  }

  function paintStars(widget, filled) {
    $$(".rate-star", widget).forEach(function (btn, i) {
      btn.classList.toggle("is-on", i < filled);
    });
  }

  function initRating() {
    const widget = $("#rateWidget");
    if (!widget) return;
    const stars = $$(".rate-star", widget);
    const meta = $(".rate-meta", widget);
    const hp = $(".rate-hp", widget);
    if (!stars.length) return;

    let selected = 0;

    function setMeta(avg, count) {
      if (meta && count != null) meta.textContent = rateMetaText(avg, count);
    }

    function setChecked(n) {
      stars.forEach(function (btn, i) {
        btn.setAttribute("aria-checked", String(i < n));
      });
    }

    stars.forEach(function (btn, i) {
      const score = i + 1;
      btn.addEventListener("mouseenter", function () { paintStars(widget, score); });
      btn.addEventListener("focus", function () { paintStars(widget, score); });
      btn.addEventListener("blur", function () { paintStars(widget, selected); });
      btn.addEventListener("click", function () {
        selected = score;
        paintStars(widget, score);
        setChecked(score);
        const payload = { game: GAME, score: score, honeypot: hp ? hp.value : "" };
        apiPost("/api/rate", payload).then(function (res) {
          if (res && res.ok) {
            if (res.rating_count != null) setMeta(res.avg_rating, res.rating_count);
            if (window.toast) window.toast("Rating saved — thanks!", { icon: "i-star", ttl: 2200 });
            if (window.SFX) window.SFX.unlock();
          } else if (window.toast) {
            window.toast("Couldn't save rating — try again");
          }
        });
      });
    });

    widget.addEventListener("mouseleave", function () { paintStars(widget, selected); });

    apiGet("/api/stats?game=" + GAME).then(function (res) {
      if (res) setMeta(res.avg_rating, res.rating_count);
    });
  }

  /* ---------- GitHub release download counts ---------- */

  function fmtCount(n) {
    if (n >= 1000) {
      const k = n / 1000;
      return (k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")) + "k";
    }
    return String(n);
  }

  function initGithubCounts() {
    fetch("https://api.github.com/repos/jaybondholliete/fortfolio/releases?per_page=30", {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (releases) {
        if (!Array.isArray(releases)) return;
        let android = 0, pc = 0;
        releases.forEach(function (rel) {
          (rel.assets || []).forEach(function (asset) {
            const name = (asset.name || "").toLowerCase();
            const count = asset.download_count || 0;
            if (name.endsWith(".apk")) android += count;
            else if (name.endsWith(".zip")) pc += count;
          });
        });
        $$(".game-dl-row a").forEach(function (a) {
          const slot = $(".dl-count", a);
          if (!slot) return;
          const href = (a.getAttribute("href") || "").toLowerCase();
          if (href.indexOf(".apk") !== -1) slot.textContent = fmtCount(android) + " downloads";
          else if (href.indexOf(".zip") !== -1) slot.textContent = fmtCount(pc) + " downloads";
        });
      })
      .catch(function () { /* silent fallback — static sizes remain */ });
  }

  /* ---------- init ---------- */

  function init() {
    try { trackPageView(); } catch (e) {}
    try { initDownloadClicks(); } catch (e) {}
    try { initRating(); } catch (e) {}
    try { initGithubCounts(); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

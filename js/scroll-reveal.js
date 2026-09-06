/* scroll-reveal.js — one-time skill bar fill + achievement unlock pop */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelectorAll(s);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window)) {
    // no IO support: just show everything
    document.querySelectorAll(".skill-row").forEach(fillSkill);
    document.querySelectorAll("[data-badge]").forEach(b => b.classList.add("is-unlocked"));
    return;
  }

  /* Skills: fill first N blocks once */
  const skillIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        fillSkill(en.target);
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll(".skill-row").forEach(r => skillIO.observe(r));

  function fillSkill(row) {
    const tier = parseInt(row.getAttribute("data-tier") || "0", 10);
    const blocks = row.querySelectorAll(".stat-block");
    blocks.forEach((b, i) => {
      if (i < tier) {
        // stagger the fill
        setTimeout(() => b.classList.add("filled"), reduce ? 0 : i * 90);
      }
    });
  }

  /* Achievements: staggered unlock pop once */
  const badges = Array.from(document.querySelectorAll("[data-badge]"));
  let unlocked = false;
  const badgeIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting && !unlocked) {
        unlocked = true;
        badges.forEach((b, i) => {
          setTimeout(() => {
            b.classList.add("is-unlocked");
            if (window.SFX) SFX.unlock();
          }, reduce ? 0 : i * 80);
        });
        obs.disconnect();
      }
    });
  }, { threshold: 0.25 });
  const grid = document.getElementById("trophyGrid");
  if (grid) badgeIO.observe(grid);
})();

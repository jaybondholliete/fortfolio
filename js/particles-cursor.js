/* particles-cursor.js — pixel dot + short trail. Desktop only. */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (reduce || coarse) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const trail = document.createElement("div");
  trail.className = "cursor-trail";
  document.body.appendChild(dot);
  document.body.appendChild(trail);
  document.body.classList.add("cursor-on");

  let dx = 0, dy = 0, tx = 0, ty = 0, mx = 0, my = 0;
  let raf = null;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dx = mx; dy = my;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    trail.style.opacity = "0";
  });
  window.addEventListener("mouseenter", () => {
    dot.style.opacity = "1";
    trail.style.opacity = ".5";
  });

  function loop() {
    // trail eases toward dot
    tx += (mx - tx) * 0.18;
    ty += (my - ty) * 0.18;
    dot.style.transform = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
    trail.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    if (Math.abs(mx - tx) > 0.5 || Math.abs(my - ty) > 0.5) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }
})();

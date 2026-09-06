/* codelibrary.js — language tab switching + copy-to-clipboard for code blocks */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Language tab switching ---------- */
  const langBtns = $$(".lib-lang-btn");
  const panels = $$(".lib-panel");

  function showLang(lang) {
    langBtns.forEach(b => b.classList.toggle("is-active", b.getAttribute("data-lang") === lang));
    panels.forEach(p => p.classList.toggle("is-active", p.id === "panel-" + lang));
    // scroll content into view (below the fixed nav)
    const content = $(".lib-content");
    if (content) {
      const top = content.getBoundingClientRect().top + window.scrollY - 90;
      if (Math.abs(window.scrollY - top) > 10) {
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    }
    if (window.SFX) SFX.click();
    // update URL hash without jump
    if (history.replaceState) history.replaceState(null, "", "#" + lang);
  }

  langBtns.forEach(btn => {
    btn.addEventListener("click", () => showLang(btn.getAttribute("data-lang")));
  });

  // open from URL hash
  const hash = (location.hash || "").replace("#", "");
  if (hash && ["html","css","js","python","flutter","csharp","lua","animation","playground"].indexOf(hash) !== -1) {
    showLang(hash);
  }

  /* ---------- Copy code buttons ---------- */
  $$(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const block = btn.closest(".codeblock");
      if (!block) return;
      const pre = block.querySelector("pre");
      if (!pre) return;
      const text = pre.innerText;
      if (window.SFX) SFX.copy();
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied!";
        btn.classList.add("is-copied");
        if (window.toast) window.toast("Code copied to clipboard", { icon: "i-crest", ttl: 1600 });
      } catch (e) {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); btn.textContent = "Copied!"; btn.classList.add("is-copied"); }
        catch (_) { btn.textContent = "Copy failed"; }
        ta.remove();
      }
      setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("is-copied"); }, 2000);
    });
  });

  /* ---------- Back to top ---------- */
  const toTop = $("#toTop");
  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.SFX) SFX.click();
    });
  }

  /* ---------- Live JS DOM demo (Variables/DOM panel) ---------- */
  const demoBtn = $("#jsDemoBtn");
  const demoOut = $("#jsDemoOut");
  if (demoBtn && demoOut) {
    let clicks = 0;
    demoBtn.addEventListener("click", () => {
      clicks++;
      demoBtn.textContent = "Clicked " + clicks + "x";
      demoBtn.style.background = "var(--accent-deep)";
      demoOut.textContent = 'event: click → textContent="Clicked ' + clicks + 'x"';
      if (window.SFX) SFX.click();
    });
  }
})();

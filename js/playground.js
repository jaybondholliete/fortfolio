/* playground.js — live code editor with iframe output */
(function () {
  "use strict";

  var pane = document.getElementById("panel-playground");
  if (!pane) return;

  var tabs = Array.prototype.slice.call(pane.querySelectorAll(".pg-tab"));
  var panes = Array.prototype.slice.call(pane.querySelectorAll(".pg-editor-pane"));
  var htmlEl = document.getElementById("pgHtml");
  var cssEl = document.getElementById("pgCss");
  var jsEl = document.getElementById("pgJs");
  var runBtn = document.getElementById("pgRun");
  var resetBtn = document.getElementById("pgReset");
  var examplesSel = document.getElementById("pgExamples");
  var iframe = document.getElementById("pgOutput");

  /* ---------- Tab switching ---------- */
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-pg-tab");
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      panes.forEach(function (p) {
        var match = p.getAttribute("data-pg-pane") === target;
        p.classList.toggle("is-active", match);
        p.hidden = !match;
      });
    });
  });

  /* ---------- Run code ---------- */
  function runCode() {
    var html = htmlEl.value;
    var css = cssEl.value;
    var js = jsEl.value;
    var doc = "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
      "<style>" + css + "</style></head><body>" + html +
      "<script>" + js + "<\/script></body></html>";
    iframe.srcdoc = doc;
  }

  if (runBtn) runBtn.addEventListener("click", runCode);

  /* ---------- Reset ---------- */
  function resetCode() {
    htmlEl.value = "";
    cssEl.value = "";
    jsEl.value = "";
    iframe.srcdoc = "<!DOCTYPE html><html><head></head><body></body></html>";
  }
  if (resetBtn) resetBtn.addEventListener("click", resetCode);

  /* ---------- Tab key inserts spaces in textareas ---------- */
  [htmlEl, cssEl, jsEl].forEach(function (ta) {
    if (!ta) return;
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        var start = ta.selectionStart;
        var end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + "  " + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 2;
      }
    });
  });

  /* ---------- Examples ---------- */
  var examples = {
    hello: {
      html: '<h1>Hello, World!</h1>\n<p>Welcome to the playground. Try editing me!</p>',
      css: 'body {\n  font-family: sans-serif;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  margin: 0;\n  background: linear-gradient(135deg, #667eea, #764ba2);\n  color: white;\n}\nh1 { font-size: 2.5em; }',
      js: 'console.log("Page loaded!");'
    },
    card: {
      html: '<div class="card">\n  <h2>Hover Card</h2>\n  <p>Hover over me to see the effect.</p>\n</div>',
      css: 'body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; }\n.card {\n  background: #16213e;\n  color: white;\n  padding: 2em;\n  border-radius: 12px;\n  text-align: center;\n  font-family: sans-serif;\n  transition: transform 0.3s, box-shadow 0.3s;\n  cursor: pointer;\n}\n.card:hover {\n  transform: translateY(-10px) scale(1.05);\n  box-shadow: 0 20px 40px rgba(0,0,0,0.4);\n}',
      js: ''
    },
    counter: {
      html: '<h1>Count: <span id="count">0</span></h1>\n<button id="inc">+1</button>\n<button id="dec">-1</button>\n<button id="reset">Reset</button>',
      css: 'body { font-family: sans-serif; text-align: center; padding: 2em; }\nh1 { font-size: 2em; }\nbutton {\n  font-size: 1.2em;\n  padding: 10px 20px;\n  margin: 5px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  background: #4CAF50;\n  color: white;\n}\nbutton:hover { background: #45a049; }\n#dec { background: #f44336; }\n#dec:hover { background: #d32f2f; }\n#reset { background: #ff9800; }\n#reset:hover { background: #e68a00; }',
      js: 'var c = 0;\nvar el = document.getElementById("count");\ndocument.getElementById("inc").onclick = function() { c++; el.textContent = c; };\ndocument.getElementById("dec").onclick = function() { c--; el.textContent = c; };\ndocument.getElementById("reset").onclick = function() { c = 0; el.textContent = c; };'
    },
    flexbox: {
      html: '<div class="container">\n  <div class="box">1</div>\n  <div class="box">2</div>\n  <div class="box">3</div>\n  <div class="box">4</div>\n  <div class="box">5</div>\n</div>',
      css: 'body { margin: 0; padding: 2em; background: #f0f0f0; }\n.container {\n  display: flex;\n  gap: 10px;\n  flex-wrap: wrap;\n  justify-content: center;\n}\n.box {\n  width: 80px;\n  height: 80px;\n  background: linear-gradient(135deg, #ff6b6b, #ee5a52);\n  color: white;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 1.5em;\n  font-family: sans-serif;\n  border-radius: 12px;\n  transition: transform 0.2s;\n}\n.box:hover { transform: scale(1.1); }',
      js: ''
    },
    animation: {
      html: '<div class="ball"></div>\n<p>Bouncing ball animation</p>',
      css: 'body { text-align: center; padding: 2em; font-family: sans-serif; }\n.ball {\n  width: 60px;\n  height: 60px;\n  background: radial-gradient(circle at 30% 30%, #ff9a56, #ff5e62);\n  border-radius: 50%;\n  margin: 0 auto;\n  animation: bounce 1s infinite alternate;\n}\n@keyframes bounce {\n  from { transform: translateY(0); }\n  to { transform: translateY(-150px); }\n}\np { margin-top: 2em; color: #333; }',
      js: ''
    },
    form: {
      html: '<form id="myForm">\n  <label>Name: <input type="text" id="name" required></label><br><br>\n  <label>Email: <input type="email" id="email" required></label><br><br>\n  <button type="submit">Submit</button>\n</form>\n<p id="result"></p>',
      css: 'body { font-family: sans-serif; padding: 2em; max-width: 400px; }\ninput { padding: 8px; margin: 5px 0; width: 100%; border: 2px solid #ddd; border-radius: 6px; }\ninput:focus { border-color: #4CAF50; outline: none; }\nbutton { padding: 10px 24px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1em; }\nbutton:hover { background: #45a049; }\n#result { color: green; font-weight: bold; margin-top: 1em; }',
      js: 'document.getElementById("myForm").addEventListener("submit", function(e) {\n  e.preventDefault();\n  var name = document.getElementById("name").value;\n  document.getElementById("result").textContent = "Welcome, " + name + "!";\n});'
    }
  };

  if (examplesSel) {
    examplesSel.addEventListener("change", function () {
      var key = examplesSel.value;
      if (!key || !examples[key]) return;
      var ex = examples[key];
      htmlEl.value = ex.html;
      cssEl.value = ex.css;
      jsEl.value = ex.js;
      runCode();
      examplesSel.value = "";
    });
  }

  /* ---------- Auto-run on load with default example ---------- */
  htmlEl.value = examples.hello.html;
  cssEl.value = examples.hello.css;
  jsEl.value = examples.hello.js;
  runCode();
})();

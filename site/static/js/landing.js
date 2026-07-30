/**
 * Vim+ landing page — interactive browser mock + utilities.
 * Respects prefers-reduced-motion.
 */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Demo video: hide placeholder if MP4 loads ---------- */
  (function demoVideo() {
    var video = document.querySelector(".lp-demo-video");
    var ph = document.querySelector("[data-demo-placeholder]");
    if (!video || !ph) return;
    var hide = function () {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        ph.classList.add("is-hidden");
        video.classList.add("is-ready");
      }
    };
    video.addEventListener("loadeddata", hide);
    video.addEventListener("error", function () { /* keep placeholder */ });
  })();

  /* ---------- Copy install command ---------- */
  (function copyInstall() {
    var btn = document.querySelector("[data-copy-target]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-copy-target");
      var el = document.getElementById(id);
      if (!el) return;
      var text = el.innerText || el.textContent || "";
      var done = function () {
        var prev = btn.textContent;
        btn.textContent = "Copied";
        btn.classList.add("is-copied");
        setTimeout(function () {
          btn.textContent = prev;
          btn.classList.remove("is-copied");
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          fallbackCopy(text);
          done();
        });
      } else {
        fallbackCopy(text);
        done();
      }
    });
    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  })();

  /* ---------- Interactive browser mock ---------- */
  var root = document.getElementById("live-demo");
  if (!root) return;

  var hud = root.querySelector("[data-hud]");
  var progress = root.querySelector("[data-progress]");
  var keyfeed = root.querySelector("[data-keyfeed]");
  var urlText = root.querySelector("[data-url-text]");
  var omni = root.querySelector("[data-omni]");
  var omniText = root.querySelector("[data-omni-text]");
  var omniList = root.querySelector("[data-omni-list]");
  var palette = root.querySelector("[data-palette]");
  var palText = root.querySelector("[data-pal-text]");
  var page = root.querySelector(".lp-page");
  var sceneBtns = document.querySelectorAll("[data-jump-scene]");

  var scenes = [
    {
      name: "hints",
      keys: ["f", "a"],
      run: function (step) {
        setHud("HINTS");
        setUrl("news.ycombinator.com");
        hideOverlays();
        page.classList.toggle("hints-on", step >= 0);
        if (step >= 1) {
          var a = page.querySelector('[data-hint="A"]');
          if (a) a.classList.add("hit");
        }
      },
      reset: function () {
        page.classList.remove("hints-on");
        page.querySelectorAll(".link").forEach(function (n) { n.classList.remove("hit"); });
      }
    },
    {
      name: "omni",
      keys: ["o", "v", "i", "m", "↵"],
      run: function (step) {
        setHud("OMNI");
        hideOverlays();
        omni.hidden = false;
        var q = "vim+".slice(0, Math.max(0, step));
        omniText.textContent = q;
        omniList.innerHTML =
          '<li class="on">vim-plus — github.com/JamalYusuf/vim-plus</li>' +
          "<li>Vim concepts — jamalyusuf.github.io/vim-plus</li>" +
          "<li>!g keyboard navigation</li>";
        if (step >= 4) {
          setUrl("github.com/JamalYusuf/vim-plus");
          omni.hidden = true;
          setHud("NORMAL");
        }
      },
      reset: function () {
        omni.hidden = true;
        omniText.textContent = "";
        omniList.innerHTML = "";
      }
    },
    {
      name: "palette",
      keys: [":", "r", "e", "a", "d", "↵"],
      run: function (step) {
        setHud("COMMAND");
        hideOverlays();
        palette.hidden = false;
        var typed = "read".slice(0, Math.max(0, step - 1));
        palText.textContent = typed;
        if (step >= 5) {
          palette.hidden = true;
          setHud("READER");
          page.classList.add("reader");
          setUrl("example.com/long-article · reader");
        }
      },
      reset: function () {
        palette.hidden = true;
        palText.textContent = "";
        page.classList.remove("reader");
      }
    },
    {
      name: "scroll",
      keys: ["j", "j", "k", "G"],
      run: function (step) {
        setHud("NORMAL");
        hideOverlays();
        page.classList.remove("reader");
        setUrl("example.com/long-article");
        var p = Math.min(100, 18 + step * 22);
        if (progress) progress.style.width = p + "%";
        page.style.transform = "translateY(" + (-step * 8) + "px)";
      },
      reset: function () {
        if (progress) progress.style.width = "12%";
        page.style.transform = "";
      }
    }
  ];

  var sceneIndex = 0;
  var stepIndex = 0;
  var timer = null;

  function setHud(t) {
    if (hud) hud.textContent = t;
  }
  function setUrl(t) {
    if (urlText) urlText.textContent = t;
  }
  function hideOverlays() {
    if (omni) omni.hidden = true;
    if (palette) palette.hidden = true;
  }
  function showKeys(keys, activeIdx) {
    if (!keyfeed) return;
    keyfeed.innerHTML = keys
      .map(function (k, i) {
        var cls = i < activeIdx ? "done" : i === activeIdx ? "active" : "";
        return '<kbd class="' + cls + '">' + escapeHtml(k) + "</kbd>";
      })
      .join("");
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function setSceneButtons() {
    sceneBtns.forEach(function (b) {
      var i = Number(b.getAttribute("data-jump-scene"));
      b.classList.toggle("on", i === sceneIndex);
    });
  }
  function resetAll() {
    scenes.forEach(function (s) {
      if (s.reset) s.reset();
    });
  }
  function runStep() {
    var scene = scenes[sceneIndex];
    resetAll();
    scene.run(stepIndex);
    showKeys(scene.keys, stepIndex);
    setSceneButtons();
  }
  function advance() {
    var scene = scenes[sceneIndex];
    if (stepIndex < scene.keys.length - 1) {
      stepIndex++;
    } else {
      sceneIndex = (sceneIndex + 1) % scenes.length;
      stepIndex = 0;
    }
    runStep();
  }
  function jumpScene(i) {
    sceneIndex = i;
    stepIndex = 0;
    runStep();
    if (!reduce) restartTimer();
  }
  function restartTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(advance, 900);
  }

  sceneBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      jumpScene(Number(b.getAttribute("data-jump-scene")));
    });
  });

  // Init
  if (progress) progress.style.width = "12%";
  runStep();
  if (!reduce) {
    restartTimer();
    // Pause when off-screen
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) restartTimer();
            else if (timer) clearInterval(timer);
          });
        },
        { threshold: 0.25 }
      );
      io.observe(root);
    }
  }
})();

/**
 * Vim+ landing — interactive browser mock + utilities.
 * Modes: autoplay tour, or try-it-yourself (real keys + on-screen pad).
 */
(function () {
  "use strict";

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Demo video ---------- */
  (function demoVideo() {
    var video = document.querySelector(".lp-demo-video");
    var ph = document.querySelector("[data-demo-placeholder]");
    if (!video || !ph) return;
    video.addEventListener("loadeddata", function () {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        ph.classList.add("is-hidden");
        video.classList.add("is-ready");
      }
    });
  })();

  /* ---------- Copy install ---------- */
  (function copyInstall() {
    var btn = document.querySelector("[data-copy-target]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.getAttribute("data-copy-target"));
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
          fallback(text);
          done();
        });
      } else {
        fallback(text);
        done();
      }
    });
    function fallback(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(ta);
    }
  })();

  /* ---------- Interactive mock ---------- */
  var root = document.getElementById("live-demo");
  if (!root) return;

  var hud = root.querySelector("[data-hud]");
  var progressEl = root.querySelector("[data-progress]");
  var keyfeed = root.querySelector("[data-keyfeed]");
  var keyfeedLabel = root.querySelector("[data-keyfeed-label]");
  var statusEl = root.querySelector("[data-status]");
  var coach = document.querySelector("[data-coach]");
  var urlText = root.querySelector("[data-url-text]");
  var omni = root.querySelector("[data-omni]");
  var omniText = root.querySelector("[data-omni-text]");
  var omniList = root.querySelector("[data-omni-list]");
  var palette = root.querySelector("[data-palette]");
  var palText = root.querySelector("[data-pal-text]");
  var palList = root.querySelector("[data-pal-list]");
  var findBar = root.querySelector("[data-find]");
  var findText = root.querySelector("[data-find-text]");
  var page = root.querySelector(".lp-page");
  var pageTitle = root.querySelector("[data-page-title]");
  var toast = root.querySelector("[data-toast]");
  var sceneBtns = document.querySelectorAll("[data-jump-scene]");
  var modeBtns = document.querySelectorAll("[data-demo-mode]");
  var vkButtons = document.querySelectorAll(".lp-vk[data-key]");
  var linkButtons = root.querySelectorAll(".link[data-hint]");

  var mode = "auto"; // auto | try
  var state = "normal"; // normal | hints | omni | palette | find
  var buffer = "";
  var scroll = 0; // 0..4
  var lastKeys = [];
  var timer = null;
  var toastTimer = null;
  var sceneIndex = 0;
  var stepIndex = 0;
  var autoPlaying = false;

  var pages = {
    home: {
      url: "docs.example.com/long-guide",
      title: "A practical guide to staying in flow",
    },
    article: {
      url: "docs.example.com/keyboard-patterns",
      title: "Keyboard navigation patterns",
    },
    tax: {
      url: "docs.example.com/context-switch",
      title: "Context switching costs",
    },
    modes: {
      url: "docs.example.com/modes",
      title: "Modes without the ceremony",
    },
  };

  var omniResults = [
    { q: "", items: ["docs.example.com/long-guide", "github.com/JamalYusuf/vim-plus", "Tabs · 12 open"] },
    { q: "v", items: ["vim-plus — github.com/JamalYusuf/vim-plus", "Vim concepts — guide", "!g vim keyboard"] },
    { q: "vi", items: ["vim-plus — github.com/JamalYusuf/vim-plus", "visual mode help"] },
    { q: "vim", items: ["vim-plus — github.com/JamalYusuf/vim-plus", "Vim concepts"] },
    { q: "vim+", items: ["vim-plus — github.com/JamalYusuf/vim-plus"] },
  ];

  var autoScenes = [
    {
      name: "hints",
      keys: ["f", "a"],
      coach: "Autoplay: link hints — f then a label",
      run: function (step) {
        resetVisual(false);
        enterHints();
        if (step >= 1) activateHint("a");
      },
    },
    {
      name: "omni",
      keys: ["o", "v", "i", "m", "↵"],
      coach: "Autoplay: omnibar — search then open",
      run: function (step) {
        resetVisual(false);
        openOmni();
        var typed = "vim+".slice(0, Math.min(4, step));
        buffer = typed;
        renderOmni();
        if (step >= 4) {
          closeOverlays();
          goPage("article");
          setHud("NORMAL");
          state = "normal";
          showToast("Opened from omnibar");
        }
      },
    },
    {
      name: "palette",
      keys: [":", "r", "e", "a", "d", "↵"],
      coach: "Autoplay: command palette — :read",
      run: function (step) {
        resetVisual(false);
        openPalette();
        buffer = "read".slice(0, Math.max(0, step - 1));
        renderPalette();
        if (step >= 5) {
          runCommand("read");
        }
      },
    },
    {
      name: "scroll",
      keys: ["j", "j", "k", "G"],
      coach: "Autoplay: scroll and progress",
      run: function (step) {
        resetVisual(false);
        closeOverlays();
        state = "normal";
        setHud("NORMAL");
        if (step === 0) setScroll(1);
        else if (step === 1) setScroll(2);
        else if (step === 2) setScroll(1);
        else setScroll(4);
      },
    },
    {
      name: "find",
      keys: ["/", "f", "l", "o", "w", "↵"],
      coach: "Autoplay: find mode",
      run: function (step) {
        resetVisual(false);
        openFind();
        buffer = "flow".slice(0, Math.max(0, step - 1));
        renderFind();
        if (step >= 5) {
          closeOverlays();
          state = "normal";
          setHud("NORMAL");
          page.classList.add("find-hit");
          showToast("Match highlighted");
        }
      },
    },
  ];

  /* ---- UI helpers ---- */
  function setHud(t) {
    if (hud) hud.textContent = t;
  }
  function setUrl(t) {
    if (urlText) urlText.textContent = t;
  }
  function setCoach(t) {
    if (coach) coach.textContent = t;
  }
  function setStatus(t) {
    if (statusEl) statusEl.textContent = t || "";
  }
  function showToast(msg) {
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 1600);
  }
  function pushKey(k) {
    lastKeys.push(k);
    if (lastKeys.length > 8) lastKeys.shift();
    renderKeyfeed();
    flashVk(k);
  }
  function renderKeyfeed() {
    if (!keyfeed) return;
    keyfeed.innerHTML = lastKeys
      .map(function (k, i) {
        var cls = i === lastKeys.length - 1 ? "active" : "done";
        return '<kbd class="' + cls + '">' + esc(k) + "</kbd>";
      })
      .join("");
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function flashVk(key) {
    var map = key === "↵" || key === "Enter" ? "Enter" : key === "Esc" || key === "Escape" ? "Escape" : key;
    vkButtons.forEach(function (b) {
      if (b.getAttribute("data-key") === map || b.getAttribute("data-key") === key) {
        b.classList.add("is-flash");
        setTimeout(function () {
          b.classList.remove("is-flash");
        }, 180);
      }
    });
  }
  function setScroll(n) {
    scroll = Math.max(0, Math.min(4, n));
    if (progressEl) progressEl.style.width = 12 + scroll * 20 + "%";
    if (page) page.style.transform = "translateY(" + -scroll * 10 + "px)";
  }
  function goPage(id) {
    var p = pages[id] || pages.home;
    setUrl(p.url);
    if (pageTitle) pageTitle.textContent = p.title;
    page.classList.remove("reader", "find-hit", "hints-on");
    linkButtons.forEach(function (b) {
      b.classList.remove("hit");
    });
    setScroll(0);
  }
  function closeOverlays() {
    if (omni) omni.hidden = true;
    if (palette) palette.hidden = true;
    if (findBar) findBar.hidden = true;
    page.classList.remove("hints-on");
  }
  function resetVisual(full) {
    closeOverlays();
    buffer = "";
    page.classList.remove("reader", "find-hit", "hints-on");
    linkButtons.forEach(function (b) {
      b.classList.remove("hit");
    });
    if (full) {
      goPage("home");
      setScroll(0);
      state = "normal";
      setHud("NORMAL");
    }
  }

  function enterHints() {
    state = "hints";
    setHud("HINTS");
    closeOverlays();
    page.classList.add("hints-on");
    setStatus("Type a / s / d — or click a link");
    setCoach("Hints on — choose a label or click a link");
  }
  function activateHint(letter) {
    letter = String(letter).toLowerCase();
    var map = { a: "article", s: "tax", d: "modes" };
    var btn = root.querySelector('.link[data-hint="' + letter.toUpperCase() + '"]');
    if (!btn) return false;
    linkButtons.forEach(function (b) {
      b.classList.remove("hit");
    });
    btn.classList.add("hit");
    var dest = map[letter] || btn.getAttribute("data-open");
    setTimeout(function () {
      closeOverlays();
      state = "normal";
      setHud("NORMAL");
      goPage(dest);
      showToast("Opened link “" + letter.toUpperCase() + "”");
      setStatus("");
      setCoach(mode === "try" ? "Link opened. Try o for omnibar, or : for commands." : coach.textContent);
    }, mode === "try" ? 200 : 350);
    return true;
  }
  function openOmni() {
    state = "omni";
    setHud("OMNI");
    closeOverlays();
    if (omni) omni.hidden = false;
    buffer = "";
    renderOmni();
    setStatus("Type to filter · Enter opens");
    setCoach("Omnibar — type a query, Enter to open the top match");
  }
  function renderOmni() {
    if (omniText) omniText.textContent = buffer;
    if (!omniList) return;
    var pick = omniResults[0];
    for (var i = 0; i < omniResults.length; i++) {
      if (buffer.indexOf(omniResults[i].q) === 0 || omniResults[i].q.indexOf(buffer) === 0) {
        if (omniResults[i].q.length >= (pick.q || "").length) pick = omniResults[i];
      }
    }
    if (!buffer) pick = omniResults[0];
    else {
      pick = omniResults[0];
      for (var j = omniResults.length - 1; j >= 0; j--) {
        if (buffer.indexOf(omniResults[j].q) === 0) {
          pick = omniResults[j];
          break;
        }
      }
    }
    omniList.innerHTML = (pick.items || [])
      .map(function (item, idx) {
        return "<li class=\"" + (idx === 0 ? "on" : "") + "\">" + esc(item) + "</li>";
      })
      .join("");
  }
  function openPalette() {
    state = "palette";
    setHud("COMMAND");
    closeOverlays();
    if (palette) palette.hidden = false;
    buffer = "";
    renderPalette();
    setStatus("Type a command · Enter runs");
    setCoach("Palette — try typing read, prog, zen, win, or hl");
  }
  function renderPalette() {
    if (palText) palText.textContent = buffer;
    if (!palList) return;
    var items = palList.querySelectorAll("li");
    var first = true;
    items.forEach(function (li) {
      var cmd = li.getAttribute("data-cmd") || "";
      var show = !buffer || cmd.indexOf(buffer) === 0;
      li.style.display = show ? "" : "none";
      li.classList.toggle("on", show && first);
      if (show && first) first = false;
    });
  }
  function runCommand(cmd) {
    closeOverlays();
    state = "normal";
    if (cmd === "read") {
      setHud("READER");
      page.classList.add("reader");
      setUrl((urlText.textContent || "").replace(/ · reader$/, "") + " · reader");
      showToast("Reader View");
    } else if (cmd === "prog") {
      setHud("NORMAL");
      setScroll(scroll >= 3 ? 1 : 3);
      showToast("Reading progress updated");
    } else if (cmd === "zen") {
      setHud("ZEN");
      root.classList.add("is-zen");
      showToast("Zen window (preview)");
      setTimeout(function () {
        root.classList.remove("is-zen");
        setHud("NORMAL");
      }, 1400);
    } else if (cmd === "win") {
      setHud("DOCK");
      root.classList.add("is-dock");
      showToast("Window docked (preview)");
      setTimeout(function () {
        root.classList.remove("is-dock");
        setHud("NORMAL");
      }, 1400);
    } else if (cmd === "hl") {
      setHud("NORMAL");
      page.classList.add("find-hit");
      showToast("Highlighter (preview)");
    } else {
      setHud("NORMAL");
      showToast("Ran :" + cmd);
    }
    setStatus("");
    setCoach(mode === "try" ? "Command ran. Esc always returns to normal." : "");
  }
  function openFind() {
    state = "find";
    setHud("FIND");
    closeOverlays();
    if (findBar) findBar.hidden = false;
    buffer = "";
    renderFind();
    setStatus("Type to search · Enter confirms");
    setCoach("Find mode — type a word, Enter to highlight");
  }
  function renderFind() {
    if (findText) findText.textContent = buffer;
  }

  /* ---- Input handling ---- */
  function handleKey(raw) {
    var key = raw;
    if (key === "Enter") key = "Enter";
    if (key === "Escape") key = "Escape";

    // Normalize display
    var display =
      key === "Enter" ? "↵" : key === "Escape" ? "Esc" : key.length === 1 ? key : key;
    pushKey(display);

    if (mode === "auto") {
      // User interaction interrupts autoplay into try mode
      setMode("try", true);
    }

    if (key === "Escape") {
      resetVisual(true);
      setStatus("");
      setCoach("Normal mode. Try f, o, :, /, j, k.");
      showToast("Esc → normal");
      return;
    }

    if (state === "hints") {
      if (key === "a" || key === "A" || key === "s" || key === "S" || key === "d" || key === "D") {
        activateHint(key);
      } else if (key === "f") {
        // already in hints
        showToast("Hints already on");
      } else {
        showToast("Use a, s, or d");
      }
      return;
    }

    if (state === "omni") {
      if (key === "Enter") {
        closeOverlays();
        state = "normal";
        setHud("NORMAL");
        goPage("article");
        showToast("Opened top result");
        setCoach("Opened from omnibar.");
        return;
      }
      if (key === "Backspace") {
        buffer = buffer.slice(0, -1);
        renderOmni();
        return;
      }
      if (key.length === 1 && /[a-z0-9+\-_.! ]/i.test(key)) {
        buffer += key.toLowerCase();
        renderOmni();
      }
      return;
    }

    if (state === "palette") {
      if (key === "Enter") {
        var on = palList && palList.querySelector("li.on");
        var cmd = on ? on.getAttribute("data-cmd") : buffer || "read";
        // fuzzy: if buffer matches a cmd
        if (buffer) {
          var match = null;
          palList.querySelectorAll("li").forEach(function (li) {
            var c = li.getAttribute("data-cmd");
            if (c && c.indexOf(buffer) === 0 && !match) match = c;
          });
          if (match) cmd = match;
        }
        runCommand(cmd || "read");
        return;
      }
      if (key === "Backspace") {
        buffer = buffer.slice(0, -1);
        renderPalette();
        return;
      }
      if (key.length === 1 && /[a-z]/i.test(key)) {
        buffer += key.toLowerCase();
        renderPalette();
      }
      return;
    }

    if (state === "find") {
      if (key === "Enter") {
        closeOverlays();
        state = "normal";
        setHud("NORMAL");
        page.classList.add("find-hit");
        showToast(buffer ? "Found “" + buffer + "”" : "Find closed");
        return;
      }
      if (key === "Backspace") {
        buffer = buffer.slice(0, -1);
        renderFind();
        return;
      }
      if (key.length === 1) {
        buffer += key;
        renderFind();
      }
      return;
    }

    // normal
    if (key === "f" || key === "F") {
      enterHints();
      return;
    }
    if (key === "o" || key === "O") {
      openOmni();
      return;
    }
    if (key === ":") {
      openPalette();
      return;
    }
    if (key === "/") {
      openFind();
      return;
    }
    if (key === "j") {
      setScroll(scroll + 1);
      setHud("NORMAL");
      setStatus("scroll " + Math.round(12 + scroll * 20) + "%");
      return;
    }
    if (key === "k") {
      setScroll(scroll - 1);
      setHud("NORMAL");
      setStatus("scroll " + Math.round(12 + scroll * 20) + "%");
      return;
    }
    if (key === "g") {
      setScroll(0);
      showToast("Top of page");
      return;
    }
    if (key === "G") {
      setScroll(4);
      showToast("Bottom of page");
      return;
    }
    if (key === "r") {
      // mini easter: reload feel
      goPage("home");
      showToast("Reload (preview)");
      return;
    }
    setCoach("Unknown here — try f · o · : · / · j · k · Esc");
  }

  /* ---- Mode / autoplay ---- */
  function setMode(m, fromUser) {
    mode = m;
    modeBtns.forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-demo-mode") === m);
    });
    root.classList.toggle("is-try", m === "try");
    if (keyfeedLabel) keyfeedLabel.textContent = m === "try" ? "You pressed" : "Sequence";
    if (m === "try") {
      stopAuto();
      if (!fromUser) resetVisual(true);
      setCoach("Click the browser (or a key below), then type. Esc cancels.");
      setStatus("Waiting for keys…");
      root.focus({ preventScroll: true });
    } else {
      lastKeys = [];
      renderKeyfeed();
      setCoach("Autoplay loop — switch to Try it yourself anytime");
      setStatus("");
      startAuto();
    }
  }

  function stopAuto() {
    autoPlaying = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function startAuto() {
    if (reduce) {
      // show first frame only
      sceneIndex = 0;
      stepIndex = 0;
      runAutoStep();
      return;
    }
    stopAuto();
    autoPlaying = true;
    sceneIndex = 0;
    stepIndex = 0;
    runAutoStep();
    timer = setInterval(function () {
      if (!autoPlaying) return;
      var scene = autoScenes[sceneIndex];
      if (stepIndex < scene.keys.length - 1) stepIndex++;
      else {
        sceneIndex = (sceneIndex + 1) % autoScenes.length;
        stepIndex = 0;
        lastKeys = [];
      }
      runAutoStep();
    }, 850);
  }
  function runAutoStep() {
    var scene = autoScenes[sceneIndex];
    lastKeys = scene.keys.slice(0, stepIndex + 1);
    renderKeyfeed();
    scene.run(stepIndex);
    setCoach(scene.coach);
    sceneBtns.forEach(function (b) {
      b.classList.toggle("on", Number(b.getAttribute("data-jump-scene")) === sceneIndex);
    });
  }
  function jumpScene(i) {
    sceneIndex = i % autoScenes.length;
    stepIndex = 0;
    lastKeys = [];
    if (mode === "try") {
      // jump into that interaction state immediately
      resetVisual(true);
      var starters = ["f", "o", ":", "j", "/"];
      handleKey(starters[sceneIndex] || "f");
    } else {
      runAutoStep();
      if (!reduce) {
        stopAuto();
        autoPlaying = true;
        timer = setInterval(function () {
          if (!autoPlaying) return;
          var scene = autoScenes[sceneIndex];
          if (stepIndex < scene.keys.length - 1) stepIndex++;
          else {
            sceneIndex = (sceneIndex + 1) % autoScenes.length;
            stepIndex = 0;
            lastKeys = [];
          }
          runAutoStep();
        }, 850);
      }
    }
  }

  /* ---- Wire events ---- */
  modeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      setMode(b.getAttribute("data-demo-mode"), true);
    });
  });

  sceneBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      jumpScene(Number(b.getAttribute("data-jump-scene")));
    });
  });

  vkButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      if (mode !== "try") setMode("try", true);
      var k = b.getAttribute("data-key");
      root.focus({ preventScroll: true });
      handleKey(k);
    });
  });

  linkButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      if (mode !== "try") setMode("try", true);
      var letter = b.getAttribute("data-hint");
      if (state !== "hints") enterHints();
      pushKey(letter.toLowerCase());
      activateHint(letter);
    });
  });

  // Palette click
  if (palList) {
    palList.addEventListener("click", function (e) {
      var li = e.target.closest("li[data-cmd]");
      if (!li) return;
      if (mode !== "try") setMode("try", true);
      pushKey("↵");
      runCommand(li.getAttribute("data-cmd"));
    });
  }

  root.addEventListener("click", function () {
    if (mode === "try") root.focus({ preventScroll: true });
  });

  root.addEventListener("keydown", function (e) {
    if (mode !== "try") return;
    // Don't steal when user is typing elsewhere — root must be focused
    if (document.activeElement !== root && !root.contains(document.activeElement)) return;

    var k = e.key;
    if (k === "Enter" || k === "Escape" || k === "Backspace") {
      e.preventDefault();
      handleKey(k);
      return;
    }
    if (k.length === 1) {
      e.preventDefault();
      handleKey(k);
    }
  });

  // Global shortcut only when try mode and demo focused or body when try+recent
  document.addEventListener("keydown", function (e) {
    if (mode !== "try") return;
    if (document.activeElement === root) return; // handled above
    // allow keys when focus is on vk/scene buttons inside try section
    var t = e.target;
    if (t && (t.closest("#try") || t === document.body || t === document.documentElement)) {
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (t.closest("a, button.btn, details, summary")) return;
      var k = e.key;
      if (k === "Enter" || k === "Escape" || k === "Backspace" || k.length === 1) {
        // only if try section roughly in view
        var rect = root.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        e.preventDefault();
        handleKey(k === "Enter" || k === "Escape" || k === "Backspace" ? k : k);
      }
    }
  });

  // Pause auto when off-screen
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) stopAuto();
          else if (mode === "auto" && !reduce) startAuto();
        });
      },
      { threshold: 0.2 }
    );
    io.observe(root);
  }

  // Init
  setScroll(0);
  goPage("home");
  setMode(reduce ? "try" : "auto", false);
})();

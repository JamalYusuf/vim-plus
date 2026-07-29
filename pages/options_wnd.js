import { CurCVer_, CurFFVer_, OnFirefox, OnChrome, OnEdge, $, $$, post_, disconnect_, isVApiReady_, simulateClick_, PageOs_, toggleDark_, browser_, selfTabId_, enableNextTick_, nextTick_, IsEdg_, import2_, BrowserName_, pageTrans_, isRepeated_, prevent_, pageLangs_ } from "./async_bg.js";

import { bgSettings_, showI18n_, setupBorderWidth_, Option_, debounce_, oTrans_, delayBinding_, didBindEvent_, getSettingsCache_ } from "./options_base.js";

import { saveBtn_, exportBtn_, savedStatus_, onKeyMappingsError_ } from "./options_defs.js";

import { manifest_ } from "./options_permissions.js";

export let delayed_task;

export const clear_delayed_task = () => {
  delayed_task = null;
};

enableNextTick_(8 /* kReadyInfo.LOCK */);

nextTick_(showI18n_);

setupBorderWidth_ && nextTick_(setupBorderWidth_);

nextTick_(versionEl => {
  versionEl.textContent = manifest_.version_name || manifest_.version;
  parseInt(manifest_.version) >= 2 !== (manifest_.manifest_version === 3) && (versionEl.parentElement.nextElementSibling.textContent = "-mv" + manifest_.manifest_version);
}, $("#version"));

delayBinding_(saveBtn_, "click", virtually => {
  if (virtually !== false) {
    Option_.saveOptions_().then(changed => {
      changed && saveBtn_.onclick(false);
    });
    return;
  }
  const toSync = Option_.syncToFrontend_;
  Option_.syncToFrontend_ = [];
  saveBtn_.disabled = true;
  saveBtn_.firstChild.data = oTrans_("115_3");
  exportBtn_.disabled = false;
  savedStatus_(false);
  window.onbeforeunload = null;
  window.addEventListener("beforeunload", refreshSync, true);
  if (toSync.length === 0) {
    return;
  }
  setTimeout(toSync1 => {
    post_(4 /* kPgReq.notifyUpdate */ , toSync1.map(key => bgSettings_.valuesToLoad_[key]));
  }, 100, toSync);
}, "on");

const refreshSync = () => {
  post_(30 /* kPgReq.saveToSyncAtOnce */);
};

const onClickBrowserLink = event => {
  prevent_(event);
  post_(15 /* kPgReq.focusOrLaunch */ , {
    u: event.target.href,
    p: true
  });
};

let optionsInit1_ = function() {
  var _a;
  Option_.suppressPopulate_ = false;
  {
    const fetching = Object.values(Option_.all_).map(i => i.fetch_() && i.field_).filter(i => i);
    fetching.length > 0 && console.log("Warning: some options are not ready to fetch:", fetching.join(", "));
  }
  Option_.all_.exclusionRules.previous_.length > 0 && nextTick_(el => {
    el.style.visibility = "";
  }, $("#exclusionToolbar"));
  const omniStyles = (_a = getSettingsCache_().vomnibarOptions) === null || _a === void 0 ? void 0 : _a.styles;
  omniStyles && / inputmode=(no|false|0) /.test(` ${omniStyles instanceof Array ? omniStyles.join(" ") : omniStyles} `) && nextTick_(els => {
    for (const i of els) {
      i.removeAttribute("inputmode");
    }
  }, $$("[inputmode]"));
  document.addEventListener("keyup", onKeyUp);
  delayBinding_("[data-check]", "input", function onCheck() {
    for (const el of $$("[data-check]")) {
      el.removeEventListener("input", onCheck);
    }
    import2_("./options_checker.js");
  });
  delayBinding_("[data-auto-resize]", "click", event => {
    const target = $("#" + event.target.dataset.autoResize);
    let height = target.scrollHeight, width = target.scrollWidth, dw = width - target.clientWidth;
    if (height <= target.clientHeight && dw <= 0) {
      return;
    }
    const maxWidth = Math.max(Math.min(innerWidth, 1024) - 120, 550);
    target.style.maxWidth = width > maxWidth ? maxWidth + "px" : "";
    target.style.height = target.style.width = "";
    dw = width - target.clientWidth;
    let delta = target.offsetHeight - target.clientHeight;
    delta = dw > 0 ? Math.max(26, delta) : delta + 18;
    height += delta;
    dw > 0 && (target.style.width = target.offsetWidth + dw + 4 + "px");
    target.style.height = height + "px";
  });
  delayBinding_("[data-delay]", "click", function(event) {
    let str = this.dataset.delay, e = null;
    str === "event" && (e = event || null);
    str !== "continue" && event && prevent_(event);
    delayed_task = [ "#" + this.id, e ];
    if (document.readyState === "complete") {
      import2_("./options_ext.js");
      return;
    }
    window.addEventListener("load", function onLoad(event1) {
      if (event1.target === document) {
        window.removeEventListener("load", onLoad);
        import2_("./options_ext.js");
      }
    });
  }, "on");
  const permissionEls = $$("[data-permission]");
  permissionEls.length > 0 && (els => {
    const validKeys2 = manifest_.permissions || [];
    for (let i = els.length; 0 <= --i; ) {
      let el = els[i];
      let key = el.dataset.permission;
      let transArgs;
      if (key[0] === "C") {
        if (CurCVer_ >= parseInt(key.slice(1))) {
          continue;
        }
        const secondCond = key.split(",", 2)[1] || ",";
        if (secondCond[0] === "." ? window[secondCond.slice(1)] != null : secondCond[0] !== "F" && secondCond[0] === "(" && matchMedia(secondCond).matches) {
          continue;
        }
        transArgs = [ "beforeChromium", [ key.slice(1).split(",", 1)[0] ] ];
      } else {
        if (key in manifest_ || validKeys2.includes(key)) {
          continue;
        }
        transArgs = [ "lackPermission", [ key ? ":\n* " + key : "" ] ];
      }
      nextTick_(el1 => {
        el1.disabled = true;
        const str = oTrans_("invalidOption", [ oTrans_(transArgs[0], transArgs[1]) ]);
        if (el1 instanceof HTMLInputElement && el1.type === "checkbox") {
          el1.nextElementSibling.tabIndex = -1;
          el1 = el1.parentElement;
          el1.title = str;
          el1.querySelector("span").style.textDecoration = "line-through";
        } else {
          el1.value = "";
          el1.title = str;
          delayBinding_(el1.parentElement, "click", onclick, "on");
          el1 instanceof HTMLSpanElement && (el1.style.textDecoration = "line-through");
        }
      }, el);
    }
    function onclick() {
      const el = this.querySelector("[data-permission]");
      this.onclick = null;
      if (!el) {
        return;
      }
      const key = el.dataset.permission;
      el.placeholder = oTrans_("lackPermission", [ key ? `: "${key}"` : "" ]);
    }
  })(permissionEls);
  delayBinding_("[data-vim-url]", "mousedown", () => {
    document.onmouseover = null;
    document.removeEventListener("vimiumData", FillDataHref);
    for (const element of $$("[data-vim-url]")) {
      element.onmousedown = null;
      post_(10 /* kPgReq.convertToUrl */ , [ element.dataset.vimUrl, -1 /* Urls.WorkType.ConvertKnown */ ]).then(([str]) => {
        element.removeAttribute("data-vim-url");
        element.href = str;
        element.target = "_blank";
        element.rel = "noopener noreferrer";
      });
    }
  }, "on");
  const FillDataHref = () => {
    didBindEvent_("mousedown");
    $("[data-vim-url]").onmousedown();
  };
  document.onmouseover = FillDataHref;
  document.addEventListener("vimiumData", FillDataHref);
  const browserLinks = [ "#openExtensionsPage", "#browserSettingsSearch" ].map($);
  IsEdg_ && nextTick_(arr => {
    const s = "edge://extensions/", el = arr.shift();
    for (const i of arr) {
      i.textContent = i.href = i.href.replace("chrome:", "edge:");
    }
    el.href = s + "shortcuts", el.textContent = s + "\u2026";
  }, browserLinks.slice());
  nextTick_(arr => {
    for (const i of arr) {
      delayBinding_(i, "click", onClickBrowserLink);
    }
  }, browserLinks);
  // Preferred vomnibar example is the built-in page (no third-party Web Store deps).
    nextTick_(el => {
    el && !el.textContent && (el.textContent = "front/vomnibar.html");
  }, $("#chromeExtVomnibar"));
  const onRefStatClick = event => {
    prevent_(event);
    const sel2 = event.currentTarget.dataset.for.split(":").slice(-1)[0];
    const maybeNode2 = $$(sel2);
    const node2 = (maybeNode2.find(i => i.checked) || maybeNode2[0]).nextElementSibling;
    scrollAndFocus_(node2, OnChrome, node3 => {
      VApi && VApi.x(node3.parentElement.parentElement);
    });
  };
  for (const element of $$(".ref-text")) {
    const name = element.dataset.for, fields = name.slice(name.indexOf(":") + 1);
    const targetOptName = name.split(":")[0];
    const opt = Option_.all_[targetOptName.replace("#", "")];
    const oldOnSave = opt.onSave_, box = element.parentElement;
    const syncForLabel = () => {
      nextTick_(([statEl, nameEl, checkboxes]) => {
        const related = checkboxes.find(i => i.checked) || checkboxes[0];
        statEl.textContent = oTrans_(related.checked ? "145_2" : "144");
        if (nameEl) {
          const el2 = related.nextElementSibling, i2 = el2.getAttribute("data-i2");
          nameEl.textContent = i2 ? pageTrans_(i2) : el2.textContent;
        }
      }, [ box.querySelector(".status-of-related"), box.querySelector(".name-of-related"), fields !== name ? $$(fields) : [ opt.element_ ] ]);
    };
    opt.onSave_ = () => {
      syncForLabel();
      return oldOnSave.call(opt);
    };
    delayBinding_(element, "click", onRefStatClick, "on");
    delayBinding_(opt.element_, "change", syncForLabel, true);
  }
}, optionsInitAll_ = () => {
  optionsInit1_();
  optionsInit1_ = optionsInitAll_ = null;
  PageOs_ || nextTick_(el => {
    el.textContent = "Cmd";
  }, $("#Ctrl"));
  for (let key in Option_.all_) {
    Option_.all_[key].onSave_();
  }
  nextTick_(() => {
    document.documentElement.classList.remove("loading");
  });
  isVApiReady_.then(disconnect_);
  location.hash && nextTick_(window.onhashchange);
  enableNextTick_(0 /* kReadyInfo.NONE */ , 8 /* kReadyInfo.LOCK */);
  Option_.all_.keyMappings.onSave_ = () => post_(7 /* kPgReq.keyMappingErrors */).then(onKeyMappingsError_);
  let useDarkQuery = true;
  let darkMedia = matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    useDarkQuery && darkOpt.saved_ && post_(11 /* kPgReq.updateMediaQueries */);
    setTimeout(useLocalStyle, 34);
  };
  const darkOpt = Option_.all_.autoDarkMode;
  const useLocalStyle = () => {
    const rawVal = darkOpt.readValueFromElement_();
    const val = rawVal === 2 ? !!darkMedia && darkMedia.matches : rawVal === 1;
    if (VApi && VApi.z) {
      const root = VApi.y().r;
      if (root) {
        let uiParent = root.firstElementChild && root.firstElementChild.localName === "span" ? root.firstElementChild : root;
        const children = uiParent.children;
        for (let el of children) {
          if (el.localName !== "style") {
            el.classList.toggle("D", val);
            el = el.firstElementChild || el;
            if (el.localName === "iframe") {
              const isFind = el.classList.contains("Find");
              const childDoc = el.contentDocument;
              const dark = childDoc.querySelector("style#dark");
              dark && dark.sheet && (dark.sheet.disabled = !val);
              childDoc.body.classList.toggle(isFind ? "D" : "has-dark", val);
              if (isFind) {
                const input = VApi.y().f;
                input && input.parentElement.classList.toggle("D", val);
              }
            }
          }
        }
      }
      post_(3 /* kPgReq.updatePayload */ , {
        key: "d",
        val
      }).then(val2 => {
        VApi.z.d = val2;
      });
    }
    toggleDark_(val ? rawVal === 2 ? 2 : 1 : 0);
  };
  // As https://bugzilla.mozilla.org/show_bug.cgi?id=1550804 said, to simulate color schemes, enable
  // https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features#Color_scheme_simulation
    darkOpt.onSave_ = onChange;
  nextTick_(() => {
    darkOpt.previous_ === 2 && isVApiReady_.then(onChange);
    darkMedia.onchange = onChange;
  });
  nextTick_(() => {
    setTimeout(() => {
      const loaderScript = document.createElement("script");
      loaderScript.src = "loader.js";
      loaderScript.async = true;
      document.head.append(loaderScript);
      document.documentElement.classList.add("smooth");
    }, 120);
  });
};

const onKeyUp = event => {
  const el = event.target, i = event.keyCode;
  if (i !== 13 /* kKeyCode.enter */) {
    if (i !== 32 /* kKeyCode.space */) {
      return;
    }
    if (el instanceof HTMLSpanElement && el.parentElement instanceof HTMLLabelElement) {
      prevent_(event);
      const ctrl = el.parentElement.control;
      ctrl.disabled || simulateClick_(ctrl);
    }
    return;
  }
  if (el instanceof HTMLAnchorElement) {
    el.hasAttribute("href") || (setTimeout(el1 => {
      simulateClick_(el1);
      el1.blur();
    }, 0, el), prevent_(event));
  } else if (event.ctrlKey || event.metaKey) {
    prevent_(event);
    el.blur && el.blur();
    if (savedStatus_()) {
      didBindEvent_("click");
      saveBtn_.onclick();
    }
  }
};

delayBinding_(Option_.all_.userDefinedCss.element_, "input", debounce_(() => {
  const self = Option_.all_.userDefinedCss;
  const isDebugging = self.element_.classList.contains("debugging");
  if (self.saved_ && !isDebugging || !VApi || !VApi.z) {
    return;
  }
  const newVal = self.readValueFromElement_(), isSame = newVal === self.previous_, cssPromise = post_(8 /* kPgReq.parseCSS */ , [ newVal, selfTabId_ ]), misc = VApi.y(), root = misc.r;
  cssPromise.then(css => {
    self.element_.classList.toggle("debugging", !isSame);
    VApi.t({
      k: root || isSame ? 0 : 1 /* kTip.raw */ ,
      t: oTrans_("livePreview") || "Live preview CSS\u2026",
      H: css.ui,
      f: css.find
    });
    const frame = root && root.querySelector("iframe.Omnibar");
    const doc = frame && frame.contentDocument;
    if (doc) {
      let styleDebug = doc.querySelector("style.debugged") || doc.querySelector("style#custom");
      if (!styleDebug) {
        /** should keep the same as {@link ../front/vomnibar#Vomnibar_.css_} */
        styleDebug = doc.createElement("style");
        styleDebug.id = "custom";
      }
      styleDebug.parentNode || doc.head.append(styleDebug);
      styleDebug.classList.add("debugged");
      styleDebug.textContent = (isSame ? "\n" : "\n.inactive { opacity: 1; }\n") + (css.omni && css.omni + "\n" || "");
    }
  });
}, 1200, null, 0));

export const noBlobSupport_cr_mv2_ = autoReopenPage => {
  const mayCrash = false /* Build.MV3 */;
  mayCrash && autoReopenPage && post_(32 /* kPgReq.reopenTab */ , {
    url: location.href.split("#")[0] + "#importButton",
    tabId: selfTabId_
  });
  return mayCrash;
};

delayBinding_("#importButton", "click", () => {
  const opt = $("#importOptions");
  opt.onchange ? opt.onchange(null) : simulateClick_($("#settingsFile"));
}, "on");

// Reset all options to author template defaults (recommended)
delayBinding_("#resetDefaults", "click", () => {
  const ok = window.confirm("Reset all Vim+ options to the author defaults?\n\nThis replaces your current settings with the recommended template.\nExport a backup first if you want to keep your maps.");
  if (!ok) {
    return;
  }
  const el2 = $("#importOptions");
  if (!el2) {
    return;
  }
  const oldSelected = el2.selectedIndex;
  const rec = $("#recommendedSettings");
  rec && (rec.selected = true);
  const finish = () => {
    el2.onchange && el2.onchange(null);
    el2.selectedIndex = oldSelected;
  };
  // Same path as the hidden “a-f12 → recommended” shortcut
    el2.onchange != null ? finish() : setTimeout(finish, 100);
}, "on");

nextTick_(el0 => {
  const platform = bgSettings_.platform_;
  let name = BrowserName_, version = CurCVer_;
  if (!name) {
    const data = navigator.userAgentData;
    const brands = data.brands.filter(i => (parseInt(i.version) === CurCVer_ && i.brand !== "Chromium" || i.brand.includes("Opera")) && !` ${i.brand} `.includes(" Not "));
    const brand = brands.find(i => /\b(Edge|Opera)\b/.test(i.brand)) || brands[0];
    const nameFallback = IsEdg_ ? "MS Edge" : "";
    name = brand ? brand.brand : data ? nameFallback || "Chromium" : (/\bChromium\b/.exec(navigator.userAgent) || [ "" ])[0] || nameFallback || "Chrome";
    brand && (version = parseInt(brand.version));
  }
  el0.textContent = name + " " + version + (name === "Chromium" ? oTrans_("based") : "") + oTrans_("comma") + oTrans_("NS") + (oTrans_(platform) || platform[0].toUpperCase() + platform.slice(1));
}, $("#browserName"));

document.addEventListener("keydown", event => {
  if (!PageOs_ && event.metaKey) {
    onKeyUp(event);
    return;
  }
  if (event.keyCode !== 32 /* kKeyCode.space */) {
    if (!VApi || !VApi.z || "input textarea".includes(document.activeElement.localName)) {
      return;
    }
    const key = VApi.r[3]({
      c: " " /* kChar.INVALID */ ,
      e: event,
      i: event.keyCode,
      v: ""
    }, 11 /* kModeId.NO_MAP_KEY */);
    if (key === "a-f12" /* kChar.f12 */) {
      let el2 = $("#importOptions");
      const oldSelected = el2.selectedIndex, callback = () => {
        el2.onchange && el2.onchange(null);
        el2.selectedIndex = oldSelected;
      };
      $("#recommendedSettings").selected = true;
      el2.onchange != null ? callback() : setTimeout(callback, 100) && el2.click();
    } else if (key === "?") {
      console.log('The document receives a "?" key which has been passed (excluded) by Vim+,', "so open the help dialog.");
      $("#showCommands").click();
    }
    return;
  }
  const el = event.target;
  el.localName === "span" && el.parentElement.localName === "label" && event.preventDefault();
});

export const onHash_ = hash => {
  let node;
  hash = hash.slice(hash[1] === "!" ? 2 : 1);
  if (!hash || !/^[a-z][\w-]*$/i.test(hash)) {
    return;
  }
  if (node = $(`[data-hash="${hash}"]`)) {
    didBindEvent_("click");
    node.onclick && node.onclick(null, "hash");
  } else if (node = $(`[id="${hash.replace(/-/g, "")}" i]`)) {
    if (node.dataset.model != null) {
      if (node.localName === "input" && node.type === "checkbox") {
        const p1 = node.parentElement, p2 = p1.parentElement;
        node = p2.localName === "td" ? p2 : p1;
      }
      node.classList.add("highlight");
    }
    const callback = event => {
      if (event && event.target !== window) {
        return;
      }
      if (window.onload) {
        window.onload = null;
        scrollTo({
          behavior: "instant",
          top: 0,
          left: 0
        });
      }
      scrollAndFocus_(node);
      const tag = node.localName;
      tag !== "button" && tag !== "a" || simulateClick_(node);
    };
    if (document.readyState === "complete") {
      return callback();
    }
    window.scrollTo(0, 0);
    window.onload = callback;
  }
};

window.onhashchange = () => {
  onHash_(location.hash);
};

const scrollAndFocus_ = (node, near, callback) => {
  let last = -1;
  node.scrollIntoView({
    block: near ? "nearest" : "center",
    behavior: "smooth"
  });
  const timer = setInterval(() => {
    const newTop = scrollY;
    if (newTop === last) {
      clearInterval(timer);
      callback && callback(node);
      node.focus();
    }
    last = newTop;
  }, 72);
};

bgSettings_.preloadCache_().then(optionsInitAll_);

post_(7 /* kPgReq.keyMappingErrors */).then(err => {
  nextTick_(onKeyMappingsError_, err);
});

post_(12 /* kPgReq.whatsHelp */).then(matched => {
  matched !== "?" && nextTick_(([el, s]) => {
    el.textContent = s;
  }, [ $("#questionShortcut"), matched ]);
});

delayBinding_(document, "click", function onClickOnce() {
  const api1 = VApi, misc = api1 && api1.y();
  if (!misc || !misc.r) {
    return;
  }
  document.removeEventListener("click", onClickOnce, true);
  misc.r.addEventListener("click", event => {
    let str, target = event.target;
    if (VApi && target.classList.contains("HelpCommandName")) {
      str = target.textContent.slice(1, -1);
      VApi.p({
        H: 18 /* kFgReq.copy */ ,
        s: str
      });
    }
  }, true);
  document.addEventListener("click", event => {
    const el = event.target;
    if (el.localName !== "a" || !event.ctrlKey && !event.metaKey || selfTabId_ < -1 /* GlobalConsts.TabIdNone */) {
      return;
    }
    const api2 = VApi, hintWorker = api2 && api2.b, stat = hintWorker && hintWorker.$();
    if (stat && stat.a && stat.k && stat.k.c === null) {
      // .a: isActive; .k.c === null : is calling executor
      const m1 = stat.m & -17 /* HintMode.queue */;
      m1 < 32 /* HintMode.min_job */ && m1 & 2 /* HintMode.newTab */ && !(m1 & 1 /* HintMode.focused */) && setTimeout(() => {
        selfTabId_ >= 0 && (browser_.tabs ? browser_.tabs.update(selfTabId_, {
          active: true
        }, () => {}) : post_(25 /* kPgReq.callApi */ , {
          module: "tabs",
          name: "update",
          args: [ selfTabId_, {
            active: true
          } ]
        }));
      }, 0);
    }
  });
}, true);

delayBinding_("#testKeyInputBox", "focus", function KeyTester(_focusEvent) {
  const box = _focusEvent.currentTarget;
  const testKeyInput = $("#testKeyInput");
  const text_ = (newText, moveSel) => {
    const result = newText !== void 0 ? testKeyInput.textContent = newText : testKeyInput.textContent;
    if (newText && moveSel !== 0 && document.activeElement === testKeyInput) {
      const sel = getSelection(), node = testKeyInput.firstChild;
      sel.setBaseAndExtent(node, newText.length, node, newText.length);
    }
    return result;
  };
  const tip_head = testKeyInput.previousElementSibling.textContent;
  let lastKey, lastPrevented = 0 /* kKeyCode.None */ , hasOutline = false;
  let lastKeyLayout;
  let tick = 0;
  testKeyInput.onkeydown = event => {
    hasOutline && (hasOutline = false, testKeyInput.classList.remove("outline"));
    if (event.keyCode === 229 /* kKeyCode.ime */ || event.key === "Process") {
      text_("");
      return;
    }
    if (VApi && !isRepeated_(event)) {
      const eventWrapper = {
        c: " " /* kChar.INVALID */ ,
        e: event,
        i: event.keyCode,
        v: ""
      };
      const key = VApi.r[3](eventWrapper, 11 /* kModeId.NO_MAP_KEY */), isEsc = key === "esc" || key === "c-[";
      const key2 = VApi.z.l & 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */ ? VApi.r[3](eventWrapper, 10 /* kModeId.NO_MAP_KEY_BUT_MAY_IGNORE_LAYOUT */) : key;
      if (!key && (eventWrapper.i === 16 /* kKeyCode.shiftKey */ || event.key === "Shift")) {
        return;
 // ignore an auto-generated `Shift` keydown during `Shift down + Numpad5 up` when NumLock is on
            }
      const s1 = key.length > 1 ? `<${key}>` : key || "(empty)";
      const s2 = key2 === key ? "" : key2.length > 1 ? `<${key2}>` : key2 || "(empty)";
      lastKey = event, lastKeyLayout = VApi.z.l;
      text_(s2 ? `${s1} / ${s2}` : s1);
      VApi.f(7 /* kFgCmd.insertMode */ , Object.setPrototypeOf({
        i: true,
        r: 0,
        k: "v-esc:test",
        p: true,
        h: tip_head + ` (${++tick})`
      }, null), 1, 0);
      if (key === "enter" || key === "tab" || key === "s-tab" || isEsc || key === "f12") {
        (key === "enter" || isEsc) && testKeyInput.blur();
        return;
      }
    }
    lastPrevented = event.keyCode;
    prevent_(event);
  };
  testKeyInput.onkeyup = event => {
    event.keyCode === lastPrevented && prevent_(event);
  };
  testKeyInput.onfocus = () => {
    if (VApi) {
      testKeyInput.classList.add("outline");
      hasOutline = true;
      tick = 0;
      VApi.f(7 /* kFgCmd.insertMode */ , Object.setPrototypeOf({
        i: true,
        r: 0,
        k: "v-esc:test",
        p: true,
        h: tip_head
      }, null), 1, 0);
    }
  };
  testKeyInput.onblur = () => {
    if (VApi) {
      VApi.f(16 /* kFgCmd.dispatchEventCmd */ , Object.setPrototypeOf({
        type: "keydown",
        key: "Esc",
        esc: true
      }, null), 1, 0);
      VApi.h(1 /* kTip.raw */ , 0, tip_head + (tick ? ` (${tick})` : ""));
    }
    tick = 0;
  };
  testKeyInput.addEventListener("compositionend", () => {
    text_("");
  });
  testKeyInput.onpaste = prevent_;
  testKeyInput.onclick = () => {
    testKeyInput.focus();
  };
  const checkboxTestKeyInInput = $("#testKeyInInput");
  checkboxTestKeyInInput.onchange = () => {
    checkboxTestKeyInInput.checked ? testKeyInput.contentEditable = "true" : testKeyInput.removeAttribute("contenteditable");
    testKeyInput.focus();
  };
  box.removeEventListener("focus", KeyTester, true);
  box.addEventListener("blur", event => {
    const active = hasOutline ? event.relatedTarget : null;
    if (active ? !box.contains(active) : hasOutline) {
      hasOutline = false;
      testKeyInput.classList.remove("outline");
    }
  }, true);
  Option_.onFgCacheUpdated_ = () => {
    lastKey && lastKeyLayout !== VApi.z.l && testKeyInput.onkeydown(lastKey);
  };
}, true);
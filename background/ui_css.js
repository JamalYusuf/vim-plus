"use strict";
__filename = "background/ui_css.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./settings", "./ports" ], (require, exports, store_1, utils_1, browser_1, settings_1, ports_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.setMediaState_ = exports.MediaWatcher_ = exports.mergeCSS = exports.reloadCSS_ = void 0;
  let StyleCacheId_;
  let findCSS_file_old_cr;
  let _mediaTimer = 0;
  const reloadCSS_ = (action, knownCssStr) => {
    if (action === -1 /* MergeAction.virtual */) {
      return exports.mergeCSS(knownCssStr, -1 /* MergeAction.virtual */);
    }
    action === 2 /* MergeAction.rebuildAndBroadcast */ && store_1.set_helpDialogData_(null);
    {
      let findCSSStr;
      if (action === 0 /* MergeAction.readFromCache */ && (findCSSStr = store_1.storageCache_.get("findCSS"))) {
        findCSS_file_old_cr = null;
        store_1.set_findCSS_(parseFindCSS_(findCSSStr));
        store_1.set_innerCSS_(knownCssStr.slice(StyleCacheId_.length));
        store_1.omniPayload_.c = store_1.storageCache_.get("omniCSS") || "";
        return;
      }
    }
    utils_1.fetchFile_("vimium-c.css").then(css => {
      StyleCacheId_.slice(StyleCacheId_.indexOf(",") + 1);
      const hasAll = true /* BrowserVer.MinUsableCSS$All */;
      css.startsWith(":host{") || console.log('Assert error: `css.startsWith(":host{")` in updateHooks_.baseCSS');
      css = css.replace(/\r\n?/g, "\n");
      const cssFile = parseSections_(css);
      css = cssFile.ui;
      if (hasAll) {
        // Note: must not move "all:" into ":host" even when "s" and >= MinSelector$deep$InDynamicCssMeansNothing
        // in case that ":host" is set [style="all:unset"]
        const ind2 = css.indexOf("all:"), ind1 = css.lastIndexOf("{", ind2), ind3 = css.indexOf(";", ind2);
        css = css.slice(0, ind1 + 1) + css.slice(ind2, ind3 + 1) + css.slice(css.indexOf("\n", ind3) + 1 || css.length);
      } else {
        css = css.replace(/all:\s?\w+;?/, "");
      }
      {
        const ind2 = css.indexOf("display:"), ind1 = css.lastIndexOf("{", ind2);
        css = css.slice(0, ind1 + 1) + css.slice(ind2);
      }
      css = css.replace(/\n/g, "");
      settings_1.setInLocal_("innerCSS", StyleCacheId_ + css);
      let findCSS = cssFile.find;
      settings_1.setInLocal_("findCSS", findCSS.length + "\n" + findCSS);
      exports.mergeCSS(store_1.settingsCache_.userDefinedCss, action);
    }).catch(err => {
      console.log("Vim+: UI CSS failed to load (hints/HUD may be invisible):", err);
    });
  };
  exports.reloadCSS_ = reloadCSS_;
  const parseSections_ = css => {
    const arr = css ? css.split(/^\/\*\s?#!?([A-Za-z:]+)\s?\*\//m) : [ "" ];
    const sections = {
      ui: arr[0].trim()
    };
    for (let i = 1; i < arr.length; i += 2) {
      const key = arr[i].toLowerCase();
      sections[key] = (sections[key] || "") + arr[i + 1].trim();
    }
    return sections;
  };
  const parseFindCSS_ = find2 => {
    find2 = find2.slice(find2.indexOf("\n") + 1);
    let idx = find2.indexOf("\n") + 1, endFH = find2.indexOf("\n", idx);
    return {
      c: find2.slice(0, idx - 1).replace("  ", "\n"),
      s: find2.slice(idx, endFH).replace("  ", "\n"),
      i: find2.slice(endFH + 1)
    };
  };
  const DEFAULT_ACCENT = "#e11d48";
  const DEFAULT_HINT_BG = "#e11d48";
  const DEFAULT_HINT_FG = "#ffffff";
  const DEFAULT_FIND_HL = "#ff9632";
  const safeCssColor_ = (raw, fallback) => {
    const s = (raw || "").trim();
    if (!s || s.length > 32) {
      return fallback;
    }
    if (s.indexOf(";") >= 0 || s.indexOf("{") >= 0 || s.indexOf("}") >= 0 || s.indexOf("<") >= 0) {
      return fallback;
    }
    const ch = s.charAt(0);
    if (ch !== "#" && s.indexOf("rgb") !== 0 && s.indexOf("hsl") !== 0) {
      return fallback;
    }
    return s;
  };
  /**
     * Build UI CSS from Look color settings. Empty when all values are author defaults
     * so we do not fight vimium-c.css unless the user changed something.
     */  const lookOverrideCSS_ = () => {
    const c = store_1.settingsCache_;
    const accent = safeCssColor_(c.accentColor, DEFAULT_ACCENT);
    const hintBg = safeCssColor_(c.hintBg, DEFAULT_HINT_BG);
    const hintFg = safeCssColor_(c.hintFg, DEFAULT_HINT_FG);
    const find = safeCssColor_(c.findHighlightColor, DEFAULT_FIND_HL);
    const ui = [];
    if (hintBg !== DEFAULT_HINT_BG || hintFg !== DEFAULT_HINT_FG) {
      ui.push(`.LH{background:${hintBg}!important;color:${hintFg}!important;border-color:${hintBg}!important}`);
      ui.push(`.IH{border-color:${hintBg}!important}`);
      ui.push(`.IHS{border-color:${hintBg}!important}`);
      ui.push(`.D>.LH{background:${hintBg}!important;color:${hintFg}!important}`);
    }
    if (accent !== DEFAULT_ACCENT) {
      ui.push(`.HUD:after{border-color:${accent}!important}`);
      ui.push(`.Flash{box-shadow:0 0 0 2px ${accent}}`);
      ui.push(`.Frame{border-color:${accent}}`);
      ui.push(`.Sel{box-shadow:0 0 0 2px ${accent}}`);
      ui.push(`.One{border-color:${accent}}`);
    }
    return {
      ui: ui.join("\n"),
      findSel: find !== DEFAULT_FIND_HL ? `::selection{background:${find}!important}` : ""
    };
  };
  const remergeLook_ = () => {
    exports.mergeCSS(store_1.settingsCache_.userDefinedCss, "userDefinedCss");
  };
  const mergeCSS = (css2Str, action) => {
    let css = store_1.storageCache_.get("innerCSS"), idx = css.indexOf("\n");
    css = idx > 0 ? css.slice(0, idx) : css;
    const css2 = parseSections_(css2Str);
    const look = lookOverrideCSS_();
    look.ui && (css2.ui = (look.ui + "\n" + (css2.ui || "")).trim());
    look.findSel && !css2["find:selection"] && (css2["find:selection"] = look.findSel);
    let newInnerCSS = css2.ui ? css + "\n" + css2.ui : css;
    let findh = css2["find:host"], findSel = css2["find:selection"];
    let find2 = css2.find, omni2 = css2.omni;
    const F = "findCSS", O = "omniCSS";
    css = store_1.storageCache_.get(F);
    idx = css.indexOf("\n");
    css = css.slice(0, idx + 1 + +css.slice(0, idx));
    let endFSel = css.indexOf("\n", idx + 1), offsetFSel = css.slice(0, endFSel).indexOf("  ");
    findSel = findSel ? "  " + findSel.replace(/\n/g, " ") : "";
    if (offsetFSel > 0 ? css.slice(offsetFSel, endFSel) !== findSel : findSel) {
      offsetFSel = offsetFSel > 0 ? offsetFSel : endFSel;
      css = css.slice(idx + 1, offsetFSel) + findSel + css.slice(endFSel);
      endFSel = offsetFSel - (idx + 1) + findSel.length;
      idx = -1;
    }
    let endFH = css.indexOf("\n", endFSel + 1), offsetFH = css.slice(0, endFH).indexOf("  ", endFSel);
    findh = findh ? "  " + findh.replace(/\n/g, " ") : "";
    if (offsetFH > 0 ? css.slice(offsetFH, endFH) !== findh : findh) {
      css = css.slice(idx + 1, offsetFH > 0 ? offsetFH : endFH) + findh + css.slice(endFH);
      idx = -1;
    }
    idx < 0 && (css = css.length + "\n" + css);
    find2 = find2 ? css + "\n" + find2 : css;
    css = (store_1.storageCache_.get(O) || "").split("\n", 1)[0];
    omni2 = omni2 ? css + "\n" + omni2 : css;
    if (action === -1 /* MergeAction.virtual */) {
      return {
        ui: newInnerCSS.slice(StyleCacheId_.length),
        find: parseFindCSS_(find2),
        omni: omni2
      };
    }
    settings_1.setInLocal_("innerCSS", newInnerCSS);
    settings_1.setInLocal_(F, find2);
    settings_1.setInLocal_(O, omni2 || null);
    exports.reloadCSS_(0 /* MergeAction.readFromCache */ , newInnerCSS);
    if (action !== 0 /* MergeAction.readFromCache */ && action !== 1 /* MergeAction.rebuildWhenInit */) {
      utils_1.nextConfUpdate(0);
      ports_1.asyncIterFrames_(16384 /* Frames.Flags.CssUpdated */ , frames => {
        for (const port of frames.ports_) {
          const flags = port.s.flags_;
          if (flags & 8 /* Frames.Flags.hasCSS */) {
            port.postMessage({
              N: 11 /* kBgReq.showHUD */ ,
              H: store_1.innerCSS_,
              f: flags & 32 /* Frames.Flags.hasFindCSS */ ? browser_1.getFindCSS_cr_(port.s) : void 0
            });
            port.postMessage({
              N: 6 /* kBgReq.settingsUpdate */ ,
              d: {},
              v: store_1.contentConfVer_
            });
          }
        }
      });
      settings_1.broadcastOmniConf_({
        c: store_1.omniPayload_.c
      });
    }
  };
  exports.mergeCSS = mergeCSS;
  const matchMedia_ = media => ({
    media,
    matches: false
  });
  exports.MediaWatcher_ = {
    watchers_: [ 2 /* MediaNS.Watcher.NotWatching */ , 2 /* MediaNS.Watcher.NotWatching */ ],
    get_(key) {
      let watcher = exports.MediaWatcher_.watchers_[key];
      return typeof watcher === "object" ? watcher.matches : null;
    },
    listen_(key, listenType) {
      const doListen = listenType === 2;
      let watchers = exports.MediaWatcher_.watchers_, cur = watchers[key], name = key ? "prefers-color-scheme" : "prefers-reduced-motion";
      if (doListen && cur === 2 /* MediaNS.Watcher.NotWatching */) {
        const query = matchMedia_(`(${name}: ${key ? "dark" : "reduce"})`);
        watchers[key] = query;
        _mediaTimer || exports.MediaWatcher_.resume_();
      } else if (!doListen && typeof cur === "object") {
        watchers[key] = 2 /* MediaNS.Watcher.NotWatching */;
        if (_mediaTimer > 0 && watchers.every(i => typeof i !== "object")) {
          clearInterval(_mediaTimer);
          _mediaTimer = 0;
        }
      }
    },
    update_(key, embed, rawMatched) {
      let watcher = exports.MediaWatcher_.watchers_[key];
      const finalMatched = typeof watcher === "object" ? watcher.matches : rawMatched != null ? rawMatched : (key ? store_1.settingsCache_.autoDarkMode : store_1.settingsCache_.autoReduceMotion) === 1;
      exports.setMediaState_(key, finalMatched, embed ? 0 : 1);
    },
    RefreshAll_() {
      if (_mediaTimer > 0 && performance.now() - store_1.lastVisitTabTime_ > 27e4) {
        clearInterval(_mediaTimer);
        _mediaTimer = 0;
      }
      {
        const args = exports.MediaWatcher_.watchers_.map(i => typeof i === "object" ? i.media : "");
        args.join("") && store_1.runOnTee_(10 /* kTeeTask.updateMedia */ , args, null).then(exports.MediaWatcher_._onAsyncResults_mv3);
        return;
      }
    },
    resume_() {
      if (_mediaTimer) {
        return;
      }
      _mediaTimer = -2;
      setTimeout(() => {
        exports.MediaWatcher_.RefreshAll_();
        _mediaTimer = setInterval(exports.MediaWatcher_.RefreshAll_, 6e4 /* GlobalConsts.MediaWatchInterval */);
      }, 0);
    },
    _onAsyncResults_mv3(rawRet) {
      const ret = rawRet;
      for (let i = 0; i < exports.MediaWatcher_.watchers_.length; i++) {
        const watcher = exports.MediaWatcher_.watchers_[i];
        if (typeof watcher === "object" && watcher.matches !== ret[i]) {
          watcher.matches = ret[i];
          exports.MediaWatcher_.update_(i);
        }
      }
    },
    _onChange: 0
  };
  const setMediaState_ = (key, matched, broadcast, omni_port) => {
    var _a;
    const payloadKey = key ? "d" : "m";
    const newPayloadVal = settings_1.updatePayload_(payloadKey, matched);
    let styles = store_1.omniPayload_.t;
    {
      const toggled = key ? " dark " : " less-motion ";
      const extSt = styles && ` ${styles} `, exists = extSt.includes(toggled);
      styles = matched ? exists ? styles : styles + toggled : extSt.replace(toggled, " ");
      styles = styles.trim().replace(utils_1.spacesRe_, " ");
    }
    if (broadcast === 9) {
      for (const content_port of ((_a = ports_1.getFrames_(omni_port)) === null || _a === void 0 ? void 0 : _a.ports_) || []) {
        content_port.postMessage({
          N: 6 /* kBgReq.settingsUpdate */ ,
          d: {
            [payloadKey]: newPayloadVal
          },
          v: store_1.contentConfVer_
        });
      }
      omni_port.postMessage({
        N: 47 /* kBgReq.omni_updateOptions */ ,
        d: {
          t: styles
        },
        v: store_1.omniConfVer_
      });
      return;
    }
    if (store_1.contentPayload_[payloadKey] !== newPayloadVal || broadcast === 2) {
      store_1.contentPayload_[payloadKey] = newPayloadVal;
      broadcast && settings_1.broadcast_({
        N: 6 /* kBgReq.settingsUpdate */ ,
        d: [ payloadKey ]
      });
    }
    if (styles !== store_1.omniPayload_.t || broadcast === 2) {
      store_1.omniPayload_.t = styles;
      broadcast && settings_1.broadcastOmniConf_({
        t: styles
      });
    }
    // Persist dark UI so wiki / side panel / options pages follow gn (toggleVomnibarStyle dark)
        if (key === 1 /* MediaNS.kName.PrefersColorScheme */ && broadcast) {
      try {
        browser_1.browser_.storage.local.set({
          vpUiDark: matched ? 1 : 0
        });
      } catch (_b) {}
    }
  };
  exports.setMediaState_ = setMediaState_;
  store_1.updateHooks_.autoDarkMode = store_1.updateHooks_.autoReduceMotion = (value, keyName) => {
    const key = keyName.length > 12 ? 0 /* MediaNS.kName.PrefersReduceMotion */ : 1 /* MediaNS.kName.PrefersColorScheme */;
    value = typeof value === "boolean" ? value ? 2 : 0 : value;
    // Options autoDarkMode is the durable source of truth — clear gn override when user changes Options
        if (keyName === "autoDarkMode") {
      try {
        value === 2 ? browser_1.browser_.storage.local.remove("vpUiDark") : browser_1.browser_.storage.local.set({
          vpUiDark: value > 0 ? 1 : 0
        });
      } catch (_a) {}
    }
    exports.MediaWatcher_.listen_(key, value);
    exports.MediaWatcher_.update_(key, 0, value === 2 ? null : value > 0);
  };
  browser_1.set_getFindCSS_cr_(() => {
    const css = store_1.findCSS_;
    return css;
  });
  settings_1.ready_.then(() => {
    StyleCacheId_ = store_1.CONST_.VerCode_ + "," + store_1.CurCVer_ + ";";
    store_1.set_innerCSS_(store_1.storageCache_.get("innerCSS") || "");
    if (store_1.innerCSS_ && !store_1.innerCSS_.startsWith(StyleCacheId_)) {
      store_1.storageCache_.set("vomnibarPage_f", "");
      exports.reloadCSS_(1 /* MergeAction.rebuildWhenInit */);
    } else {
      exports.reloadCSS_(0 /* MergeAction.readFromCache */ , store_1.innerCSS_);
      store_1.installation_ && store_1.installation_.then(details => details && exports.reloadCSS_(1 /* MergeAction.rebuildWhenInit */));
    }
    store_1.updateHooks_.userDefinedCss = exports.mergeCSS;
    store_1.updateHooks_.accentColor = remergeLook_;
    store_1.updateHooks_.hintBg = remergeLook_;
    store_1.updateHooks_.hintFg = remergeLook_;
    store_1.updateHooks_.findHighlightColor = remergeLook_;
  });
});
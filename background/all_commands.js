"use strict";
__filename = "background/all_commands.js";
define([ "require", "exports", "./utils", "./store", "./browser", "./normalize_urls", "./parse_urls", "./settings", "./ports", "./ui_css", "./i18n", "./key_mappings", "./run_commands", "./run_keys", "./clipboard", "./open_urls", "./frame_commands", "./filter_tabs", "./tab_commands", "./tools" ], function(require, exports, BgUtils_, store_1, browser_1, normalize_urls_1, parse_urls_1, settings_, ports_1, ui_css_1, i18n_1, key_mappings_1, run_commands_1, run_keys_1, clipboard_1, open_urls_1, frame_commands_1, filter_tabs_1, tab_commands_1, tools_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  store_1.set_cmdInfo_([ 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 2 /* Info.CurShownTabsIfRepeat */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 2 /* Info.CurShownTabsIfRepeat */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 2 /* Info.CurShownTabsIfRepeat */ , 2 /* Info.CurShownTabsIfRepeat */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 2 /* Info.CurShownTabsIfRepeat */ , 1 /* Info.ActiveTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 1 /* Info.ActiveTab */ , 1 /* Info.ActiveTab */ , 1 /* Info.ActiveTab */ , 1 /* Info.ActiveTab */ , 1 /* Info.ActiveTab */ , 1 /* Info.ActiveTab */ , 1 /* Info.ActiveTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ , 0 /* Info.NoTab */ ]);
  const _AsBgC = command => {
    if (command == null) {
      throw new ReferenceError("Refer a command before it gets inited");
    }
    return function() {
      return command.apply(this, arguments);
    };
  };
  store_1.set_bgC_([ 
  /* kBgCmd.blank: */ () => {
    let wait = store_1.get_cOptions().for || store_1.get_cOptions().wait;
    const useThen = store_1.get_cOptions().isError ? 0 : 1;
    if (wait === "ready") {
      // run in callback, to avoid extra 67ms
      run_commands_1.runNextOnTabLoaded({}, null, () => {
        run_commands_1.runNextCmdBy(useThen, store_1.get_cOptions(), 1);
      });
      return;
    }
    wait = wait ? Math.abs(wait === "count" || wait === "number" ? store_1.cRepeat : wait | 0) : run_commands_1.hasFallbackOptions(store_1.get_cOptions()) ? Math.abs(store_1.cRepeat) : 0;
    if (wait) {
      wait = Math.max(34, wait);
      let block = store_1.get_cOptions().block;
      block = block != null ? !!block : wait > 17 && wait <= 1e3;
      block && store_1.cPort && store_1.cPort.postMessage({
        N: 14 /* kBgReq.suppressForAWhile */ ,
        t: wait + 50
      });
    }
    run_commands_1.runNextCmdBy(store_1.cRepeat > 0 ? useThen : 1 - useThen, store_1.get_cOptions(), wait);
  }, 
  //#region need cport
  /* kBgCmd.confirm: */ () => {
    const ifThen = (store_1.get_cOptions().$then || "") + "", ifElse = (store_1.get_cOptions().$else || "") + "", repeat = store_1.cRepeat;
    if (!ifThen && !ifElse) {
      ports_1.showHUD('"confirm" requires "$then" or "$else"');
      return;
    }
    let question = store_1.get_cOptions().question || store_1.get_cOptions().ask || store_1.get_cOptions().text || store_1.get_cOptions().value;
    const comp = question ? null : [ ifThen, ifElse ].map(i => i.split("#", 1)[0].split("+").slice(-1)[0]);
    const minRepeat = Math.abs((store_1.get_cOptions().minRepeat || 0) | 0);
    const ctx = [ store_1.get_cOptions().$f, store_1.get_cOptions().$retry ];
    (Math.abs(repeat) < minRepeat ? Promise.resolve() : run_commands_1.confirm_([ comp ? comp[0] === comp[1] ? ifThen : comp[0].replace(/^([$%][a-zA-Z]\+?)+(?=\S)/, "") : [ question + "" ] ], repeat)).then(cancelled => {
      (cancelled ? ifElse : ifThen) && setTimeout(() => {
        store_1.set_cRepeat(repeat);
        store_1.runOneMapping_(cancelled ? ifElse : ifThen, store_1.cPort, {
          c: ctx[0],
          r: ctx[1],
          u: 0,
          w: 0
        }, cancelled ? 1 : repeat);
      }, 0);
    });
  }, 
  /* kBgCmd.goNext: */ () => {
    const rawRel = store_1.get_cOptions().rel, absolute = !!store_1.get_cOptions().absolute;
    const rel = rawRel ? (rawRel + "").toLowerCase() : "next";
    const isNext = store_1.get_cOptions().isNext != null ? !!store_1.get_cOptions().isNext : !rel.includes("prev") && !rel.includes("before");
    const sed = clipboard_1.parseSedOptions_(store_1.get_cOptions());
    if (!clipboard_1.doesNeedToSed(8192 /* SedContext.goNext */ , sed) && !absolute) {
      frame_commands_1.framesGoNext(isNext, rel);
      return;
    }
    Promise.resolve(ports_1.getPortUrl_(store_1.cPort && ports_1.getCurFrames_().top_)).then(tabUrl => {
      const count = isNext ? store_1.cRepeat : -store_1.cRepeat;
      const exOut = {}, template = tabUrl && store_1.substitute_(tabUrl, 8192 /* SedContext.goNext */ , sed);
      const [hasPlaceholder, next] = template ? open_urls_1.goToNextUrl(template, count, absolute) : [ false, tabUrl ];
      if (hasPlaceholder && next) {
        let url = exOut.keyword_ ? normalize_urls_1.createSearchUrl_(next.trim().split(BgUtils_.spacesRe_), exOut.keyword_, 3 /* Urls.WorkType.EvenAffectStatus */) : next;
        store_1.set_cRepeat(count);
        store_1.get_cOptions().reuse == null && run_commands_1.overrideOption("reuse", 0 /* ReuseType.current */);
        run_commands_1.overrideCmdOptions({
          url_f: url,
          goNext: false
        });
        open_urls_1.openUrl();
      } else {
        absolute ? run_commands_1.runNextCmd(0) : frame_commands_1.framesGoNext(isNext, rel);
      }
    });
  }, 
  /* kBgCmd.insertMode: */ () => {
    var _a, _b;
    let _key = store_1.get_cOptions().key, key = _key && typeof _key === "string" ? key_mappings_1.stripKey_(_key).trim() : "";
    key = key.length > 1 || key.length === 1 && !/[0-9a-z]/i.test(key) && key === key.toUpperCase() && key === key.toLowerCase() ? key : "";
 // refuse letters in other languages
        const rawHideHUD = (_b = (_a = store_1.get_cOptions().hideHUD) !== null && _a !== void 0 ? _a : store_1.get_cOptions().hideHud) !== null && _b !== void 0 ? _b : store_1.settingsCache_.hideHud, hideHUD = rawHideHUD === "auto" ? !key : rawHideHUD;
    Promise.resolve(i18n_1.trans_("globalInsertMode", [ key && ": " + (key.length === 1 ? `" ${key} "` : `<${key}>`) ])).then(msg => {
      run_commands_1.sendFgCmd(7 /* kFgCmd.insertMode */ , !hideHUD, Object.assign({
        h: hideHUD ? null : msg,
        k: key || null,
        i: !!store_1.get_cOptions().insert,
        p: !!store_1.get_cOptions().passExitKey,
        r: +!!store_1.get_cOptions().reset,
        bubbles: !!store_1.get_cOptions().bubbles,
        u: !!store_1.get_cOptions().unhover
      }, run_commands_1.parseFallbackOptions(store_1.get_cOptions()) || {}));
      hideHUD && hideHUD !== "force" && hideHUD !== "always" && ports_1.showHUD(msg, 1 /* kTip.raw */);
    });
  }, 
  /* kBgCmd.nextFrame: */ _AsBgC(frame_commands_1.nextFrame), 
  /* kBgCmd.parentFrame: */ _AsBgC(frame_commands_1.parentFrame), 
  /* kBgCmd.performFind: */ _AsBgC(frame_commands_1.performFind), 
  /* kBgCmd.toggle: */ resolve => {
    const key = (store_1.get_cOptions().key || "") + "", key2 = key === "darkMode" ? "d" : key === "reduceMotion" ? "m" : settings_.valuesToLoad_[key], old = key2 ? store_1.contentPayload_[key2] : 0, keyRepr = i18n_1.trans_("quoteA", [ key ]);
    let value = store_1.get_cOptions().value, isBool = typeof value === "boolean";
    let msg = null, msgArg2 = "";
    if (key2) {
      if (typeof old === "boolean") {
        isBool || (value = null);
      } else if (isBool || value === void 0) {
        msg = isBool ? "notBool" : "needVal";
      } else if (typeof value !== typeof old) {
        msgArg2 = JSON.stringify(old);
        msg = "unlikeVal";
        msgArg2 = msgArg2.length > 10 ? msgArg2.slice(0, 9) + "\u2026" : msgArg2;
      }
    } else {
      msg = key in settings_.defaults_ ? "notFgOpt" : "unknownA";
    }
    Promise.resolve(keyRepr).then(keyReprStr => {
      if (msg) {
        ports_1.showHUD(i18n_1.trans_(msg, [ keyReprStr, msgArg2 ]));
      } else {
        value = settings_.updatePayload_(key2, value);
        if (key2 === "c" || key2 === "n") {
          let str2 = "";
          for (const ch of value.replace(/\s/g, "")) {
            str2.includes(ch) || (str2 += ch);
          }
          value = str2;
        }
        const frames = ports_1.getCurFrames_(), cur = frames.cur_;
        for (const port of frames.ports_) {
          let isCur = port === cur;
          run_commands_1.portSendFgCmd(port, 8 /* kFgCmd.toggle */ , isCur, {
            k: key2,
            n: isCur ? keyReprStr : "",
            v: value
          }, 1);
        }
        resolve(1);
      }
    });
  }, 
  /* kBgCmd.showHelp: */ () => {
    store_1.cPort.s.frameId_ !== 0 || store_1.cPort.s.flags_ & 262144 /* Frames.Flags.hadHelpDialog */ ? run_commands_1.sendFgCmd(17 /* kFgCmd.showHelpDialog */ , true, store_1.get_cOptions()) : frame_commands_1.initHelp({
      a: store_1.get_cOptions()
    }, store_1.cPort);
  }, 
  /* kBgCmd.dispatchEventCmd: */ () => {
    const opts2 = run_commands_1.copyCmdOptions(BgUtils_.safeObj_(), store_1.get_cOptions());
    if (!opts2.esc) {
      const key = opts2.key;
      let type = (opts2.type || (key ? "keydown" : "")) + "", rawClass = opts2.class, delay = opts2.delay;
      let {xy, direct, directOptions} = opts2;
      rawClass = rawClass && rawClass[0] === "$" ? rawClass.slice(1) : (rawClass && rawClass[0].toUpperCase() + rawClass.slice(1).replace(/event$/i, "") || (type.startsWith("mouse") || type.includes("click") ? "Mouse" : "Keyboard")) + "Event";
      xy = /^(Mouse|Pointer|Wheel)/.test(rawClass) && xy == null ? [ .5, .5 ] : xy;
      xy = opts2.xy = BgUtils_.normalizeXY_(xy);
      if (xy && !xy.n) {
        xy.n = store_1.cRepeat;
        store_1.set_cRepeat(1);
      }
      if (opts2.click) {
        type = "click";
        opts2.c = 1;
      } else if (store_1.cRepeat < 0) {
        for (const replace of "down up;enter leave;start end;over out".split(";")) {
          const [a, b] = replace.split(" ");
          type = type.replace(a, b);
        }
      }
      if (!type) {
        ports_1.showHUD('Require a "type" parameter');
        run_commands_1.runNextCmd(0);
        return;
      }
      const rawInit = opts2.init;
      const dict = rawInit && typeof rawInit === "object" ? rawInit : opts2;
      const destDict = {};
      delay = delay && +delay >= 0 ? Math.max(0 | +delay, 1) : null;
      for (const i of [ "bubbles", "cancelable", "composed" ]) {
        const v = dict !== opts2 && i in dict ? dict[i] : opts2[i];
        destDict[i] = v !== false && (v != null || type !== "mouseenter" && type !== "mouseleave");
      }
      const skipped = {
        e: 1,
        c: 1,
        t: 1,
        class: 1,
        type: 1,
        key: 1,
        return: 1,
        delay: 1,
        esc: 1,
        click: 1,
        init: 1,
        xy: 1,
        match: 1,
        direct: 1,
        directOptions: 1,
        clickable: 1,
        exclude: 1,
        evenIf: 1,
        scroll: 1,
        typeFilter: 1,
        textFilter: 1,
        clickableOnHost: 1,
        excludeOnHost: 1,
        closedShadow: 1,
        trust: 1,
        trusted: 1,
        isTrusted: 1,
        superKey: 1,
        target: 1,
        targetOptions: 1
      };
      for (const key of dict === opts2 ? "alt ctrl meta shift super".split(" ") : []) {
        if (key in opts2 && !(key + "Key" in opts2)) {
          opts2[key + "Key"] = opts2[key];
          delete opts2[key];
        }
      }
      if (opts2.superKey) {
        store_1.os_ ? destDict.ctrlKey = true : destDict.metaKey = true;
        delete opts2.superKey;
      }
      for (const [key, val] of Object.entries(dict)) {
        if (key && (dict !== opts2 || key[0] !== "$") && !skipped.hasOwnProperty(key)) {
          destDict[dict === opts2 ? key.startsWith("o.") ? key.slice(2) : key : key.startsWith("$") ? key.slice(1) : key] = val;
          dict === opts2 && delete opts2[key];
        }
      }
      let nonWordArr = null;
      if (key && (typeof key === "object" || typeof key === "string")) {
        typeof key === "string" && (nonWordArr = /[^\w]/.exec(key.slice(1)));
        const info = typeof key === "object" ? key : nonWordArr ? key.split(nonWordArr[0]) : [ key ];
        if (info[0] && (info.length == 1 || !info[1] || +info[1] >= 0)) {
          nonWordArr && !info[0] && (info[0] = key[0], info[1] || info.splice(1, 1));
          const evKey = info[0], isAlpha = /^[a-z]$/i.test(evKey), isNum = !isAlpha && evKey >= "0" && evKey <= "9" && evKey.length === 1, lower = evKey.toLowerCase(), keyCode = info[1] && 0 | +info[1] ? 0 | +info[1] : isAlpha ? lower.charCodeAt(0) - (type !== "keypress" || evKey !== lower ? 32 /* kKeyCode.A */ : 0) : isNum ? evKey.charCodeAt(0) - 0 /* kKeyCode.N0 */ : evKey === "Space" ? 32 /* kKeyCode.space */ : 0;
          destDict.key = evKey === "Space" ? " " : evKey === "Comma" ? "," : evKey === "Slash" ? "/" : evKey === "Minus" ? "-" : evKey[0] === "$" && evKey.length > 1 ? evKey.slice(1) : evKey;
          keyCode && dict.keyCode == null && (destDict.keyCode = keyCode);
          keyCode && dict.which == null && (destDict.which = keyCode);
          (info.length >= 3 && info[2] || dict.code == null) && (destDict.code = info[2] || (isAlpha ? "Key" + evKey.toUpperCase() : isNum ? "Digit" + evKey : evKey));
        }
      }
      opts2.type = type;
      opts2.class = rawClass;
      opts2.init = destDict;
      opts2.delay = delay;
      opts2.direct = direct && typeof direct === "string" ? direct : "element,hover,scroll,focus";
      directOptions && !directOptions.search && (directOptions.search = "doc");
      opts2.directOptions = directOptions || {
        search: "doc"
      };
      opts2.e = `Can't create "${rawClass}#${type}"`;
      opts2.t = type.startsWith("key") && !(!opts2.trust && !opts2.trusted && (opts2.isTrusted || dict.isTrusted) !== "force");
    }
    run_commands_1.portSendFgCmd(store_1.cPort, 16 /* kFgCmd.dispatchEventCmd */ , false, opts2, store_1.cRepeat);
  }, 
  /* kBgCmd.showVomnibar: */ () => {
    frame_commands_1.showVomnibar();
  }, 
  /* kBgCmd.marksActivate: */ _AsBgC(frame_commands_1.marksActivate_), 
  /* kBgCmd.visualMode: */ _AsBgC(frame_commands_1.enterVisualMode), 
  //#endregion
  /* kBgCmd.addBookmark: */ resolve => {
    const id = store_1.get_cOptions().id;
    const path = id != null && id + "" || store_1.get_cOptions().folder || store_1.get_cOptions().path;
    const position = ((store_1.get_cOptions().position || "") + "").toLowerCase();
    const wantAll = !!store_1.get_cOptions().all;
    if (!path || typeof path !== "string") {
      ports_1.showHUD('Need "folder" to refer a bookmark folder.');
      resolve(0);
      return;
    }
    store_1.findBookmark_(path, id != null && !!(id + "")).then(folder => {
      if (!folder) {
        resolve(0);
        complainNoBookmark(folder === false && 'Need valid "folder"');
        return;
      }
      const isLeaf = folder.u != null, pid = isLeaf ? folder.pid_ : folder.id_;
      let pos = position === "begin" ? 0 : position === "end" ? -1 : position === "before" ? isLeaf ? folder.ind_ : 0 : isLeaf && position === "after" ? folder.ind_ + 1 : -1;
      (!wantAll && store_1.cRepeat * store_1.cRepeat < 2 ? browser_1.getCurTab : browser_1.getCurShownTabs_)(function doAddBookmarks(tabs) {
        if (!tabs || !tabs.length) {
          resolve(0);
          return browser_1.runtimeError_();
        }
        const curInd = browser_1.selectIndexFrom(tabs), activeTab = tabs[curInd];
        let [start, end] = wantAll ? [ 0, tabs.length ] : filter_tabs_1.getTabRange(curInd, tabs.length);
        const filter = store_1.get_cOptions().filter, allTabs = tabs;
        tabs = tabs.slice(start, end);
        if (filter) {
          tabs = filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter);
          if (!tabs.length) {
            resolve(0);
            return;
          }
        }
        const count = tabs.length;
        if (count > 20 && run_commands_1.needConfirm_()) {
          run_commands_1.confirm_("addBookmark", count).then(doAddBookmarks.bind(0, allTabs));
          return;
        }
        pos = pos >= 0 ? pos : store_1.bookmarkCache_.bookmarks_.length;
        for (const tab of tabs) {
          browser_1.browser_.bookmarks.create({
            parentId: pid,
            title: tab.title,
            url: browser_1.getTabUrl(tab),
            index: pos++
          }, browser_1.runtimeError_);
        }
        ports_1.showHUD(`Added ${count} bookmark${count > 1 ? "s" : ""}.`);
        resolve(1);
      });
    });
  }, 
  /* kBgCmd.autoOpenFallback: */ resolve => {
    if (store_1.get_cOptions().copied === false) {
      resolve(0);
      return;
    }
    run_commands_1.overrideCmdOptions({
      copied: store_1.get_cOptions().copied || true
    });
    open_urls_1.openUrl();
  }, 
  /* kBgCmd.captureTab: */ _AsBgC(frame_commands_1.captureTab), 
  /* kBgCmd.clearCS: */ resolve => {
    resolve(tools_1.ContentSettings_.clearCS_(store_1.get_cOptions(), store_1.cPort));
  }, 
  /* kBgCmd.clearFindHistory: */ resolve => {
    const incognito = store_1.cPort ? store_1.cPort.s.incognito_ : store_1.curIncognito_ === 2 /* IncognitoType.true */;
    tools_1.FindModeHistory_.removeAll_(incognito);
    ports_1.showHUDEx(store_1.cPort, "fhCleared", 0, [ incognito ? [ "incog" ] : "" ]);
    resolve(1);
  }, 
  /* kBgCmd.clearMarks: */ resolve => {
    const p = store_1.cPort && frame_commands_1.findContentPort_(store_1.cPort, store_1.get_cOptions().type, !!store_1.get_cOptions().local);
    Promise.resolve(p).then(port2 => {
      const removed = store_1.get_cOptions().local ? store_1.get_cOptions().all ? tools_1.Marks_.clear_("#") : void ports_1.requireURL_({
        H: 21 /* kFgReq.marks */ ,
        U: 0,
        c: 2 /* kMarkAction.clear */ ,
        f: run_commands_1.parseFallbackOptions(store_1.get_cOptions())
      }, true, 1, port2) : tools_1.Marks_.clear_();
      typeof removed === "number" && resolve(removed > 0 ? 1 : 0);
    });
  }, 
  /* kBgCmd.copyWindowInfo: */ _AsBgC(tab_commands_1.copyWindowInfo), 
  /* kBgCmd.createTab: */ function createTab(tabs, _, dedup) {
    let tab, pure = store_1.get_cOptions().$pure;
    pure == null && run_commands_1.overrideOption("$pure", pure = !Object.keys(store_1.get_cOptions()).some(i => i !== "opener" && i !== "position" && i !== "evenIncognito" && i[0] !== "$"));
    if (pure) {
      if (!(tab = tabs && tabs.length > 0 ? tabs[0] : null) && store_1.curTabId_ >= 0 && !browser_1.runtimeError_() && dedup !== "dedup") {
        browser_1.Q_(browser_1.tabsGet, store_1.curTabId_).then(newTab => {
          createTab(newTab && [ newTab ], 0, "dedup");
        });
      } else {
        const opener = store_1.get_cOptions().opener === true;
        browser_1.openMultiTabs(tab ? {
          active: true,
          windowId: tab.windowId,
          openerTabId: opener ? tab.id : void 0,
          index: open_urls_1.newTabIndex(tab, store_1.get_cOptions().position, opener, true)
        } : {
          active: true
        }, store_1.cRepeat, store_1.get_cOptions().evenIncognito, [ null ], true, tab, tab2 => {
          tab2 && browser_1.selectWndIfNeed(tab2);
          run_commands_1.getRunNextCmdBy(3 /* kRunOn.tabPromise */)(tab2);
        });
      }
    } else {
      open_urls_1.openUrl(tabs);
    }
  }, 
  /* kBgCmd.discardTab: */ (curOrTabs, oriResolve) => {
    filter_tabs_1.onShownTabsIfRepeat_(true, 1, function onTabs(tabs, [start, current, end], resolve, force1) {
      force1 && ([start, end] = filter_tabs_1.getTabRange(current, tabs.length, 0, 1));
      const filter = store_1.get_cOptions().filter, allTabs = tabs;
      tabs = tabs.slice(start, end);
      const activeTab = browser_1.selectFrom(tabs);
      tabs = filter ? filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter) : tabs;
      const count = tabs.includes(activeTab) ? tabs.length - 1 : tabs.length;
      if (!count) {
        resolve(0);
        return;
      }
      if (count > 20 && run_commands_1.needConfirm_()) {
        run_commands_1.confirm_("discardTab", count).then(onTabs.bind(null, allTabs, [ start, current, end ], resolve));
        return;
      }
      const near = tabs[filter_tabs_1.getNearArrIndex(tabs, activeTab.index + (store_1.cRepeat > 0 ? 1 : -1), store_1.cRepeat > 0)];
      let changed = [], aliveExist = !near.discarded;
      aliveExist && (count < 2 || near.autoDiscardable !== false) && changed.push(browser_1.Q_(browser_1.Tabs_.discard, near.id));
      for (const tab of tabs) {
        if (tab !== activeTab && tab !== near && !tab.discarded) {
          aliveExist = true;
          tab.autoDiscardable !== false && changed.push(browser_1.Q_(browser_1.Tabs_.discard, tab.id));
        }
      }
      if (changed.length) {
        Promise.all(changed).then(arr => {
          const done = arr.filter(i => i !== void 0), succeed = done.length > 0;
          ports_1.showHUD(succeed ? `Discarded ${done.length} tab(s).` : i18n_1.trans_("discardFail"));
          resolve(succeed);
        });
      } else {
        ports_1.showHUD(aliveExist ? i18n_1.trans_("discardFail") : "Discarded.");
        resolve(0);
      }
    }, curOrTabs, oriResolve);
  }, 
  /* kBgCmd.duplicateTab: */ resolve => {
    const tabId = store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_;
    if (tabId < 0) {
      ports_1.complainLimits(i18n_1.trans_("dupTab"));
      resolve(0);
      return;
    }
    const notActive = store_1.get_cOptions().active === false;
    browser_1.Q_(browser_1.Tabs_.duplicate, tabId).then(result => {
      if (!result) {
        resolve(0);
        return;
      }
      notActive && browser_1.selectTab(tabId, browser_1.runtimeError_);
      notActive ? resolve(1) : run_commands_1.runNextOnTabLoaded(store_1.get_cOptions(), result);
      if (store_1.cRepeat < 2) {
        return;
      }
      const fallback = tab => {
        browser_1.openMultiTabs({
          url: browser_1.getTabUrl(tab),
          active: false,
          windowId: tab.windowId,
          pinned: tab.pinned,
          index: tab.index + 2,
          openerTabId: tab.id
        }, store_1.cRepeat - 1, true, [ null ], true, tab, null);
      };
      browser_1.tabsGet(tabId, fallback);
      return;
    });
    notActive && browser_1.selectTab(tabId, browser_1.runtimeError_);
  }, 
  /* kBgCmd.goBackFallback: */ tabs => {
    tabs.length && frame_commands_1.framesGoBack({
      s: store_1.cRepeat,
      o: store_1.get_cOptions()
    }, null, tabs[0]);
  }, 
  /* kBgCmd.goToTab: */ resolve => {
    const absolute = !!store_1.get_cOptions().absolute;
    const filter = store_1.get_cOptions().filter;
    const doesWrap = store_1.get_cOptions().wrap !== false;
    const blur = frame_commands_1.getBlurOption_();
    const goToTab = tabs => {
      const count = store_1.cRepeat;
      const cur = browser_1.selectFrom(tabs);
      const allLen = tabs.length;
      if (filter) {
        tabs = filter_tabs_1.filterTabsByCond_(cur, tabs, filter);
        if (!tabs.length) {
          resolve(0);
          return;
        }
      }
      let len = tabs.length;
      const baseInd = filter_tabs_1.getNearArrIndex(tabs, cur.index, count < 0);
      let index = absolute ? count > 0 ? Math.min(len, count) - 1 : Math.max(0, len + count) : Math.abs(count) > allLen * 2 ? count > 0 ? len - 1 : 0 : baseInd + count;
      index = doesWrap ? index >= 0 ? index % len : len + (index % len || -len) : index >= len ? len - 1 : index < 0 ? 0 : index;
      if (tabs[0].pinned && store_1.get_cOptions().noPinned && !cur.pinned && (count < 0 || absolute)) {
        let start = 1;
        while (start < len && tabs[start].pinned) {
          start++;
        }
        len -= start;
        if (len < 1) {
          resolve(0);
          return;
        }
        if (absolute || Math.abs(count) > allLen * 2 || !doesWrap) {
          index = absolute ? Math.max(start, index) : index || start;
        } else {
          index = baseInd - start + count;
          index = index >= 0 ? index % len : len + (index % len || -len);
          index += start;
        }
      }
      const toSelect = tabs[index], doesGo = !toSelect.active;
      doesGo ? browser_1.selectTab(toSelect.id, blur ? frame_commands_1.blurInsertOnTabChange : run_commands_1.getRunNextCmdBy(1 /* kRunOn.tabCb */)) : resolve(doesGo);
    };
    const reqireAllTabs = curs => {
      const evenHidden = false;
      filter_tabs_1.onShownTabsIfRepeat_(true, 1, goToTab, curs || [], resolve, evenHidden || null);
    };
    absolute ? store_1.cRepeat !== 1 || filter ? reqireAllTabs() : browser_1.Q_(browser_1.Tabs_.query, {
      windowId: store_1.curWndId_,
      index: 0
    }).then(tabs => {
      tabs && tabs[0] && browser_1.isNotHidden_(tabs[0]) ? goToTab(tabs) : reqireAllTabs();
    }) : Math.abs(store_1.cRepeat) === 1 ? browser_1.Q_(browser_1.getCurTab).then(reqireAllTabs) : reqireAllTabs();
  }, 
  /* kBgCmd.goUp: */ () => {
    var _a;
    store_1.get_cOptions().type !== "frame" && store_1.cPort && store_1.cPort.s.frameId_ && store_1.set_cPort(((_a = ports_1.getCurFrames_()) === null || _a === void 0 ? void 0 : _a.top_) || store_1.cPort);
    const arg = {
      H: 5 /* kFgReq.parseUpperUrl */ ,
      U: 0,
      p: store_1.cRepeat,
      t: store_1.get_cOptions().trailingSlash,
      r: store_1.get_cOptions().trailing_slash,
      s: clipboard_1.parseSedOptions_(store_1.get_cOptions()),
      e: store_1.get_cOptions().reloadOnRoot !== false
    };
    const p = ports_1.requireURL_(arg);
    Promise.resolve(p || "").then(() => {
      typeof arg.e === "object" && run_commands_1.getRunNextCmdBy(2 /* kRunOn.otherPromise */)(arg.e.p != null || void 0);
    });
  }, 
  /* kBgCmd.joinTabs: */ _AsBgC(tab_commands_1.joinTabs), 
  /* kBgCmd.mainFrame: */ _AsBgC(frame_commands_1.mainFrame), 
  /* kBgCmd.moveTab: */ (curOrTabs, resolve) => {
    const known = browser_1.selectIndexFrom(curOrTabs);
    if (curOrTabs.length > 0 && (store_1.cRepeat < 0 ? (store_1.cRepeat < -1 ? known : curOrTabs[known].index) === 0 : store_1.cRepeat > 1 && known === curOrTabs.length - 1)) {
      resolve(0);
      return;
    }
    const _rawGroup = store_1.get_cOptions().group;
    const useGroup = _rawGroup !== "ignore" && _rawGroup !== false;
    filter_tabs_1.onShownTabsIfRepeat_(true, 1, tabs => {
      const curIndex = browser_1.selectIndexFrom(tabs), tab = tabs[curIndex], pinned = tab.pinned;
      let index = Math.max(0, Math.min(tabs.length - 1, curIndex + store_1.cRepeat));
      while (pinned !== tabs[index].pinned) {
        index -= store_1.cRepeat > 0 ? 1 : -1;
      }
      if (index !== curIndex && useGroup) {
        let curGroup = browser_1.getGroupId(tab), newGroup = browser_1.getGroupId(tabs[index]);
        if (newGroup !== curGroup && (Math.abs(store_1.cRepeat) === 1 || curGroup !== browser_1.getGroupId(tabs[store_1.cRepeat > 0 ? index < tabs.length - 1 ? index + 1 : index : index && index - 1]))) {
          if (curGroup !== null && (curIndex > 0 && browser_1.getGroupId(tabs[curIndex - 1]) === curGroup || curIndex + 1 < tabs.length && browser_1.getGroupId(tabs[curIndex + 1]) === curGroup)) {
            index = curIndex;
            newGroup = curGroup;
          }
          while (index += store_1.cRepeat > 0 ? 1 : -1, 0 <= index && index < tabs.length && browser_1.getGroupId(tabs[index]) === newGroup) {}
          index -= store_1.cRepeat > 0 ? 1 : -1;
        }
      }
      index === curIndex && tab.active ? resolve(0) : browser_1.Tabs_.move((tab.active ? tab : curOrTabs[0]).id, {
        index: tabs[index].index
      }, browser_1.R_(resolve));
    }, curOrTabs, resolve, useGroup ? theOther => browser_1.getGroupId(curOrTabs[0]) === browser_1.getGroupId(theOther) : null);
  }, 
  /* kBgCmd.moveTabToNewWindow: */ _AsBgC(tab_commands_1.moveTabToNewWindow), 
  /* kBgCmd.moveTabToNextWindow: */ _AsBgC(tab_commands_1.moveTabToNextWindow), 
  /* kBgCmd.openUrl: */ () => {
    open_urls_1.openUrl();
  }, 
  /* kBgCmd.reloadTab: */ (tabs, resolve) => {
    filter_tabs_1.onShownTabsIfRepeat_(!store_1.get_cOptions().single, 0, tab_commands_1.reloadTab, tabs, resolve);
  }, 
  /* kBgCmd.removeRightTab: */ (curTabs, resolve) => {
    filter_tabs_1.onShownTabsIfRepeat_(false, 1, (tabs, [dest], r) => {
      browser_1.removeTabsOrFailSoon_(tabs[dest].id, r);
    }, curTabs, resolve);
  }, 
  /* kBgCmd.removeTab: */ _AsBgC(tab_commands_1.removeTab), 
  /* kBgCmd.removeTabsR: */ resolve => {
    /** `direction` is treated as limited; limited by pinned */
    const rawOthers = store_1.get_cOptions().others;
    const direction = (rawOthers != null ? rawOthers : store_1.get_cOptions().other) ? 0 : store_1.cRepeat;
    const across = direction === 0 && store_1.get_cOptions().acrossWindows;
    across ? browser_1.Tabs_.query({}, onRemoveTabsR) : filter_tabs_1.getTabsIfRepeat_(direction, onRemoveTabsR);
    function onRemoveTabsR(oriTabs) {
      let tabs = oriTabs;
      if (!tabs || tabs.length === 0) {
        return browser_1.runtimeError_();
      }
      let acrossI = across ? tabs.findIndex(i => i.id === store_1.curTabId_) : -1, i = acrossI >= 0 ? acrossI : browser_1.selectIndexFrom(tabs), noPinned = store_1.get_cOptions().noPinned;
      const filter = store_1.get_cOptions().filter;
      const activeTab = tabs[i];
      if (direction > 0) {
        ++i;
        tabs = tabs.slice(i, i + direction);
      } else {
        noPinned = noPinned !== null && noPinned !== void 0 ? noPinned : i > 0 && tabs[0].pinned && !tabs[i - 1].pinned;
        direction < 0 ? tabs = tabs.slice(Math.max(i + direction, 0), i) : (tabs = tabs.slice(0)).splice(i, 1);
      }
      noPinned && (tabs = tabs.filter(tab => !tab.pinned));
      filter && (tabs = filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter));
      const mayConfirm = store_1.get_cOptions().mayConfirm;
      if (mayConfirm && tabs.length > (typeof mayConfirm === "number" ? Math.max(mayConfirm, 5) : 20) && run_commands_1.needConfirm_()) {
        run_commands_1.confirm_("closeSomeOtherTabs", tabs.length).then(onRemoveTabsR.bind(null, oriTabs));
        return;
      }
      if (tabs.length > 0) {
        direction < 0 && (tabs = tabs.reverse());
        browser_1.removeTabsOrFailSoon_(tabs.map(tab => tab.id), resolve);
      } else {
        resolve(0);
      }
    }
  }, 
  /* kBgCmd.reopenTab: */ (tabs, resolve) => {
    if (tabs.length <= 0) {
      resolve(0);
      return;
    }
    const tab = tabs[0], group = store_1.get_cOptions().group !== false;
    tab_commands_1.reopenTab_(tab, void 0, void 0, group);
  }, 
  /* kBgCmd.restoreTab: */ resolve => {
    const sessions = browser_1.browserSessions_();
    if (!sessions) {
      resolve(0);
      return ports_1.complainNoSession();
    }
    const onlyOne = !!store_1.get_cOptions().one, limit = +sessions.MAX_SESSION_RESULTS || 25;
    let count = Math.abs(store_1.cRepeat);
    if (count > limit) {
      if (onlyOne) {
        resolve(0);
        ports_1.showHUD(i18n_1.trans_("indexOOR"));
        return;
      }
      count = limit;
    }
    if (!onlyOne && count < 2 && (store_1.cPort ? store_1.cPort.s.incognito_ : store_1.curIncognito_ === 2 /* IncognitoType.true */) && !store_1.get_cOptions().incognito) {
      resolve(0);
      return ports_1.showHUD(i18n_1.trans_("notRestoreIfIncog"));
    }
    const activateNew = store_1.get_cOptions().active !== false;
    let onlyCurrentWnd = store_1.get_cOptions().currentWindow === true;
    const curTabId = store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_, curWndId = store_1.curWndId_;
    const cb = restored => {
      if (restored === void 0) {
        resolve(0);
        return;
      }
      tab_commands_1.onSessionRestored_(curWndId, restored, activateNew ? null : curTabId).then(newTab => {
        activateNew && newTab ? run_commands_1.runNextOnTabLoaded(store_1.get_cOptions(), newTab) : resolve(1);
      });
    };
    (async () => {
      const expected = Math.max(count * 1.2 | 0, 2);
      let list, hasExtra = false;
      const filter = onlyCurrentWnd ? i => !!i.tab && i.tab.windowId > 0 && i.tab.windowId === curWndId : null;
      if (onlyCurrentWnd && count <= Math.min(limit, 25)) {
        list = await browser_1.Qs_(sessions.getRecentlyClosed, {
          maxResults: count
        });
 // lgtm [js/superfluous-trailing-arguments]
                if (list.some(item => !!item.tab && !(item.tab.windowId > 0))) {
          run_commands_1.overrideOption("currentWindow", false);
          onlyCurrentWnd = false;
        }
        hasExtra = list.length > count;
 // e.g. on Chrome
                list = filter ? list.filter(filter) : list;
        if (!hasExtra && list.length < count && expected <= Math.min(limit, 25)) {
          list = await browser_1.Qs_(sessions.getRecentlyClosed, {
            maxResults: expected
          });
 // lgtm [js/superfluous-trailing-arguments]
                    list = filter ? list.filter(filter) : list;
        }
      }
      if (!list || !hasExtra && list.length < count) {
        list = await browser_1.Qs_(sessions.getRecentlyClosed, count <= 25 && !onlyCurrentWnd ? {
          maxResults: count
        } : {});
 // lgtm [js/superfluous-trailing-arguments]
                list = filter ? list.filter(filter) : list;
      }
      if (list.length < (onlyOne ? count : 1)) {
        resolve(0);
        return ports_1.showHUD(i18n_1.trans_("indexOOR"));
      }
      count === 1 ? browser_1.Q_(sessions.restore, onlyCurrentWnd ? list[0].tab.sessionId : null).then(cb) : Promise.all(list.slice(onlyOne ? count - 1 : 0, count).map(item => browser_1.Q_(sessions.restore, (item.tab || item.window).sessionId))).then(res => {
        cb(onlyOne ? res[0] : null);
      });
      activateNew || browser_1.selectTab(curTabId, browser_1.runtimeError_);
    })();
  }, 
  /* kBgCmd.runKey: */ () => {
    store_1.get_cOptions().$seq == null ? run_keys_1.runKeyWithCond() : run_keys_1.runKeyInSeq(store_1.get_cOptions().$seq, store_1.cRepeat, null);
  }, 
  /* kBgCmd.searchInAnother: */ tabs => {
    let keyword = (store_1.get_cOptions().keyword || "") + "";
    const query = parse_urls_1.parseSearchUrl_({
      u: browser_1.getTabUrl(tabs[0])
    });
    if (!query || !keyword) {
      run_commands_1.runNextCmd(0) || ports_1.showHUD(i18n_1.trans_(keyword ? "noQueryFound" : "noKw"));
      return;
    }
    let exOut = {}, sed = clipboard_1.parseSedOptions_(store_1.get_cOptions());
    query.u = store_1.substitute_(query.u, 0 /* SedContext.NONE */ , sed, exOut);
    exOut.keyword_ != null && (keyword = exOut.keyword_);
    let url_f = normalize_urls_1.createSearchUrl_(query.u.split(" "), keyword, 2 /* Urls.WorkType.ActAnyway */);
    let reuse = store_1.get_cOptions().reuse;
    run_commands_1.overrideCmdOptions({
      url_f,
      reuse: reuse != null ? reuse : 0 /* ReuseType.current */ ,
      opener: true,
      keyword: ""
    });
    open_urls_1.openUrl(tabs);
  }, 
  /* kBgCmd.sendToExtension: */ resolve => {
    let targetID = store_1.get_cOptions().id, data = store_1.get_cOptions().data;
    if (!targetID || typeof targetID !== "string" || data === void 0) {
      ports_1.showHUD('Require a string "id" and message "data"');
      resolve(0);
      return;
    }
    const now = Date.now();
    const onErr = err => {
      err = err && err.message || err + "";
      console.log("Can not send message to the extension %o:", targetID, err);
      ports_1.showHUD("Error: " + err);
      resolve(0);
    };
    try {
      browser_1.browser_.runtime.sendMessage(targetID, store_1.get_cOptions().raw ? data : {
        handler: "message",
        from: "Vim+",
        count: store_1.cRepeat,
        keyCode: store_1.cKey,
        data
      }, cb => {
        let err = browser_1.runtimeError_();
        err ? onErr(err) : typeof cb === "string" && Math.abs(Date.now() - now) < 1e3 && ports_1.showHUD(cb);
        err || resolve(cb !== false);
        return err;
      });
    } catch (ex) {
      // targetID's format is invalid
      onErr(ex);
    }
  }, 
  /* kBgCmd.showHUD: */ resolve => {
    let text = store_1.get_cOptions().text;
    const isNum = typeof text === "number", silent = !!store_1.get_cOptions().silent;
    const isError = store_1.get_cOptions().isError;
    if (!text && !isNum && !silent && isError == null && store_1.get_cOptions().$f) {
      const fallbackContext = store_1.get_cOptions().$f;
      text = fallbackContext && fallbackContext.t ? i18n_1.extTrans_(`${fallbackContext.t}`) : "";
      if (!text) {
        resolve(false);
        return;
      }
    }
    silent || ports_1.showHUD(text || isNum ? text instanceof Promise ? text : text + "" : i18n_1.trans_("needText"));
    resolve(isError != null ? !!isError : !!text || isNum);
  }, 
  /* kBgCmd.toggleCS: */ (tabs, resolve) => {
    tools_1.ContentSettings_.toggleCS_(store_1.get_cOptions(), store_1.cRepeat, tabs, resolve);
  }, 
  /* kBgCmd.toggleMuteTab: */ _AsBgC(tab_commands_1.toggleMuteTab), 
  /* kBgCmd.togglePinTab: */ (curs, resolve) => {
    filter_tabs_1.onShownTabsIfRepeat_(true, 0, tab_commands_1.togglePinTab, curs, resolve);
  }, 
  /* kBgCmd.toggleTabUrl: */ _AsBgC(tab_commands_1.toggleTabUrl), 
  /* kBgCmd.toggleVomnibarStyle: */ tabs => {
    const tabId = tabs ? tabs[0].id : store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_;
    const toggled = ((store_1.get_cOptions().style || "") + "").trim() || "dark", current = !!store_1.get_cOptions().current;
    let enable = store_1.get_cOptions().enable;
    if (enable == null) {
      const port = store_1.framesForOmni_.find(i => i.s.tabId_ === tabId);
      if (port) {
        port.postMessage({
          N: 46 /* kBgReq.omni_toggleStyle */ ,
          t: toggled,
          b: !current
        });
        return;
      }
    }
    let styles = store_1.omniPayload_.t;
    const extSt = styles && ` ${styles} `, oldEnabled = extSt.includes(` ${toggled} `);
    enable = enable != null ? !!enable : !oldEnabled;
    if (enable !== oldEnabled || store_1.get_cOptions().forced) {
      if (toggled === "dark") {
        ui_css_1.setMediaState_(1 /* MediaNS.kName.PrefersColorScheme */ , enable, 2);
      } else {
        styles = enable === oldEnabled ? styles : enable ? styles + toggled : extSt.replace(toggled, " ");
        styles = styles.trim().replace(BgUtils_.spacesRe_, " ");
        store_1.omniPayload_.t = styles;
        settings_.broadcastOmniConf_({
          t: styles
        });
      }
    }
    run_commands_1.runNextCmdBy(enable ? 1 : 0, store_1.get_cOptions(), 100);
  }, 
  /* kBgCmd.toggleZoom: */ _AsBgC(frame_commands_1.toggleZoom), 
  /* kBgCmd.visitPreviousTab: */ resolve => {
    const acrossWindows = !!store_1.get_cOptions().acrossWindows;
    const onlyActive = !!store_1.get_cOptions().onlyActive;
    const filter = store_1.get_cOptions().filter;
    const blur = frame_commands_1.getBlurOption_();
    const defaultCondition = {};
    const cb = tabs => {
      if (tabs.length < 2) {
        onlyActive && ports_1.showHUD("Only found one browser window");
        resolve(0);
        return browser_1.runtimeError_();
      }
      const curTabId = store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_, curInd = tabs.findIndex(i => i.id === curTabId);
      const activeTab = curInd >= 0 ? tabs[curInd] : null;
      curInd >= 0 && tabs.splice(curInd, 1);
      if (filter) {
        tabs = filter_tabs_1.filterTabsByCond_(activeTab, tabs, filter);
        if (!tabs.length) {
          resolve(0);
          return;
        }
      }
      const tabs2 = tabs.filter(i => store_1.recencyForTab_.has(i.id)).sort(tools_1.TabRecency_.rCompare_);
      tabs = onlyActive && tabs2.length === 0 ? tabs.sort((a, b) => b.id - a.id) : tabs2;
      const tab = tabs[store_1.cRepeat > 0 ? Math.min(store_1.cRepeat, tabs.length) - 1 : Math.max(0, tabs.length + store_1.cRepeat)];
      tab ? onlyActive ? browser_1.Windows_.update(tab.windowId, {
        focused: true
      }, blur ? () => frame_commands_1.blurInsertOnTabChange(tab) : browser_1.R_(resolve)) : doActivate(tab.id) : resolve(0);
    };
    const doActivate = tabId => {
      browser_1.selectTab(tabId, tab => (tab && browser_1.selectWndIfNeed(tab), blur ? frame_commands_1.blurInsertOnTabChange(tab) : browser_1.R_(resolve)()));
    };
    if (store_1.cRepeat === 1 && !onlyActive && store_1.curTabId_ !== -1 /* GlobalConsts.TabIdNone */) {
      let tabId = filter_tabs_1.tryLastActiveTab_();
      if (tabId >= 0) {
        Promise.all([ browser_1.Q_(browser_1.tabsGet, tabId), filter_tabs_1.getNecessaryCurTabInfo(filter) ]).then(([tab, activeTab]) => {
          tab && (acrossWindows || tab.windowId === store_1.curWndId_) && browser_1.isNotHidden_(tab) && (!filter || filter_tabs_1.filterTabsByCond_(activeTab, [ tab ], filter).length > 0) ? doActivate(tab.id) : acrossWindows ? browser_1.Tabs_.query(defaultCondition, cb) : browser_1.getCurShownTabs_(cb);
        });
        return;
      }
    }
    acrossWindows || onlyActive ? browser_1.Tabs_.query(onlyActive ? {
      active: true
    } : defaultCondition, cb) : browser_1.getCurShownTabs_(cb);
  }, 
  /* kBgCmd.closeDownloadBar: */ resolve => {
    const newWindow = store_1.get_cOptions().newWindow;
    if (newWindow === true) {
      store_1.bgC_[29 /* kBgCmd.moveTabToNewWindow */ ](resolve);
      return;
    }
    browser_1.Q_(browser_1.browser_.permissions.contains, {
      permissions: [ "downloads.shelf", "downloads" ]
    }).then(permitted => {
      if (permitted) {
        const toggleShelf = browser_1.browser_.downloads.setShelfEnabled;
        let err;
        try {
          toggleShelf(false);
          setTimeout(() => {
            toggleShelf(true);
            resolve(1);
          }, 256);
        } catch (e) {
          err = (e && e.message || e) + "";
        }
        ports_1.showHUD(err ? "Can not close the shelf: " + err : i18n_1.trans_("downloadBarClosed"));
        err && resolve(0);
      } else if (newWindow === false && store_1.cPort) {
        ports_1.showHUD("No permissions to close download bar");
        resolve(0);
      } else {
        store_1.bgC_[29 /* kBgCmd.moveTabToNewWindow */ ](resolve);
      }
    });
  }, 
  /* kBgCmd.reset: */ () => {
    const ref = ports_1.getCurFrames_();
    const unhover = !!store_1.get_cOptions().unhover, suppressKey = store_1.get_cOptions().suppress;
    for (const frame of ref ? ref.ports_ : []) {
      let obj = {
        r: 1,
        u: unhover
      };
      if (frame === ref.cur_) {
        const fallback = run_commands_1.parseFallbackOptions(store_1.get_cOptions());
        fallback && Object.assign(obj, fallback);
      }
      run_commands_1.portSendFgCmd(frame, 7 /* kFgCmd.insertMode */ , false, obj, 1);
    }
    (run_commands_1.hasFallbackOptions(store_1.get_cOptions()) ? suppressKey === true : suppressKey !== false) && ref && ref.cur_.postMessage({
      N: 14 /* kBgReq.suppressForAWhile */ ,
      t: 150
    });
  }, 
  /* kBgCmd.openBookmark: */ resolve => {
    const rawCache = store_1.get_cOptions().$cache;
    let p;
    if (rawCache != null) {
      const id = store_1.bookmarkCache_.stamp_ === rawCache[1] ? rawCache[0] : "", cached = id && (store_1.bookmarkCache_.bookmarks_.find(i => i.id_ === id) || store_1.bookmarkCache_.dirs_.find(i => i.id_ === id));
      cached ? p = Promise.resolve(cached) : run_commands_1.overrideOption("$cache", null);
    }
    const hasValidCache = !!p, count = store_1.cRepeat;
    let dynamicResult = false;
    if (!p) {
      let id = store_1.get_cOptions().id;
      let path = store_1.get_cOptions().path;
      let title = id != null && id + "" || path || store_1.get_cOptions().title;
      if (!title || typeof title !== "string") {
        ports_1.showHUD("Invalid bookmark " + (id != null ? "id" : path ? "path" : "title"));
        resolve(0);
        return;
      }
      const result = run_commands_1.fillOptionWithMask(title, store_1.get_cOptions().mask, "name", [ "path", "title", "mask", "name", "value" ], count);
      if (!result.ok) {
        ports_1.showHUD((result.result ? "Too many potential names" : "No name") + " to find bookmarks");
        return;
      }
      dynamicResult = result.useCount;
      p = store_1.findBookmark_(result.result, id != null && !!(id + ""));
    }
    p.then(node => {
      if (node) {
        hasValidCache || dynamicResult || run_commands_1.overrideOption("$cache", [ node.id_, store_1.bookmarkCache_.stamp_ ]);
        const isLeaf = node.u != null;
        run_commands_1.overrideCmdOptions(isLeaf ? {
          url: node.jsUrl_ || node.u
        } : {
          urls: store_1.bookmarkCache_.bookmarks_.filter(i => i.pid_ === node.id_).map(i => i.jsUrl_ || i.u)
        }, true);
        store_1.set_cRepeat(dynamicResult || !isLeaf ? 1 : count);
        open_urls_1.openUrl();
      } else {
        resolve(0);
        complainNoBookmark(node === false && 'Need valid "title" or "title"');
      }
    });
  }, _AsBgC(tab_commands_1.toggleWindow), 
  /* kBgCmd.openSidePanel: */ _AsBgC(tab_commands_1.openSidePanel), 
  /* kBgCmd.toggleTabGroup: */ _AsBgC(tab_commands_1.toggleTabGroup), 
  /* kBgCmd.collapseTabGroup: */ _AsBgC(tab_commands_1.collapseTabGroup), 
  /* kBgCmd.renameTabGroup: */ _AsBgC(tab_commands_1.renameTabGroup), 
  /* kBgCmd.moveTabToGroup: */ _AsBgC(tab_commands_1.moveTabToGroup), 
  /* kBgCmd.addToReadingList: */ _AsBgC(tab_commands_1.addToReadingList), 
  /* kBgCmd.toggleBookmark: */ _AsBgC(tab_commands_1.toggleBookmark), 
  /* kBgCmd.cycleWindows: */ _AsBgC(tab_commands_1.cycleWindows), 
  /* kBgCmd.showLastDownload: */ _AsBgC(tab_commands_1.showLastDownload), 
  /* kBgCmd.dockWindow: */ _AsBgC(tab_commands_1.dockWindow) ]);
  const complainNoBookmark = text => {
    if (store_1.bookmarkCache_.status_ == 3 /* CompletersNS.BookmarkStatus.revoked */) {
      ports_1.showHUDEx(store_1.cPort, "bookmarksRevoked", 1, []);
      setTimeout(() => {
        open_urls_1.focusOrLaunch_({
          u: store_1.CONST_.OptionsPage_ + "#optionalPermissions"
        });
      }, 800);
    } else {
      ports_1.showHUD(text || "The bookmark node is not found");
    }
  };
});
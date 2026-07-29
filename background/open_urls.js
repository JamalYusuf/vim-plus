"use strict";
__filename = "background/open_urls.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./parse_urls", "./ports", "./exclusions", "./i18n", "./key_mappings", "./run_commands", "./tools", "./clipboard", "./filter_tabs" ], (require, exports, store_1, BgUtils_, browser_1, normalize_urls_1, parse_urls_1, ports_1, exclusions_1, i18n_1, key_mappings_1, run_commands_1, tools_1, clipboard_1, filter_tabs_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.focusOrLaunch_ = exports.openUrlReq = exports.openUrl = exports.goToNextUrl = exports.openUrlWithActions = exports.openShowPage = exports.openJSUrl = exports.parseReuse = exports.checkHarmfulUrl_ = exports.parseOpenPageUrlOptions = exports.preferLastWnd = exports.newTabIndex = void 0;
  BgUtils_ = __importStar(BgUtils_);
  const ReuseValues = {
    current: 0 /* ReuseType.current */ ,
    reuse: 1 /* ReuseType.reuse */ ,
    newwnd: 2 /* ReuseType.newWnd */ ,
    frame: 3 /* ReuseType.frame */ ,
    newtab: -1 /* ReuseType.newFg */ ,
    newbg: -2 /* ReuseType.newBg */ ,
    lastwndfg: -5 /* ReuseType.lastWndFg */ ,
    lastwnd: -5 /* ReuseType.lastWndFg */ ,
    lastwndbg: -6 /* ReuseType.lastWndBg */ ,
    iflastwnd: -7 /* ReuseType.ifLastWnd */ ,
    reuseincurwnd: -3 /* ReuseType.reuseInCurWnd */ ,
    lastwndbgbg: -8 /* ReuseType.lastWndBgInactive */ ,
    lastwndbginactive: -8
 /* ReuseType.lastWndBgInactive */  };
  /** if not opener, then return `tab.index + 1` by default; otherwise a default position is `undefined` */  const newTabIndex = (tab, pos, opener, doesGroup) => pos === "before" || pos === "left" || pos === "prev" || pos === "previous" ? tab.index : pos === "after" || pos === "next" || pos === "right" ? tab.index + 1 : pos === "default" ? void 0 : doesGroup !== false && browser_1.getGroupId(tab) != null ? pos === "start" || pos === "begin" ? tab.index : pos === "end" ? void 0 : tab.index + 1 : pos === "start" || pos === "begin" ? 0 : pos === "end" ? opener ? 3e4 : void 0
  /** pos is undefined, or "default" */ : tab.index + 1;
  exports.newTabIndex = newTabIndex;
  const preferLastWnd = wnds => wnds.find(i => i.id === store_1.lastWndId_) || wnds[wnds.length - 1];
  exports.preferLastWnd = preferLastWnd;
  exports.parseOpenPageUrlOptions = (opts, decoded) => ({
    d: (decoded = opts.decoded, decoded != null ? decoded : opts.decode),
    g: opts.group,
    i: opts.incognito,
    k: opts.keyword,
    m: opts.replace,
    o: opts.opener,
    p: opts.position,
    r: opts.reuse,
    s: clipboard_1.parseSedOptions_(opts),
    t: opts.testUrl,
    w: opts.window
  });
  const normalizeIncognito = incognito => typeof incognito === "boolean" ? incognito : incognito ? incognito === "force" || (incognito === "reverse" ? store_1.curIncognito_ !== 2 /* IncognitoType.true */ : incognito === "same" || incognito === "keep" ? store_1.curIncognito_ === 2 /* IncognitoType.true */ : null) : null;
  const normalizeWndType = wndType => wndType === "popup" || wndType === "normal" ? wndType : void 0;
  const checkHarmfulUrl_ = (url, port) => {
    url = url.slice(0, 128).split("?")[0].replace(/\\/g, "/");
    let bsod = store_1.os_ > 1 /* kOS.MAX_NOT_WIN */ && /\/globalroot\/device\/condrv|\bdevice\/condrv\/kernelconnect/.test(url);
    if (bsod) {
      store_1.set_cPort(port || store_1.cPort);
      ports_1.showHUD(i18n_1.trans_("harmfulURL"));
    }
    return bsod;
  };
  exports.checkHarmfulUrl_ = checkHarmfulUrl_;
  const onEvalUrl_ = (workType, options, tabs, arr) => {
    BgUtils_.resetRe_();
    const applyOptions = urls => {
      run_commands_1.replaceCmdOptions(options);
      run_commands_1.overrideCmdOptions({
        urls,
        url: null,
        url_f: null,
        copied: null,
        keyword: null
      }, true);
    };
    switch (arr[1]) {
     // on Chrome 109.0.5414.87 and macOS 13.1 (22C65), `switch(BgUtils_.resetRe_(), arr[1])` crashes
      case 1 /* Urls.kEval.copy */ :
      ports_1.showHUD(arr[0], 15 /* kTip.noTextCopied */);
      run_commands_1.runNextCmdBy(1, options);
      break;

     case 5 /* Urls.kEval.paste */ :
     case 7 /* Urls.kEval.plainUrl */ :
      applyOptions(null);
      arr[1] === 7 /* Urls.kEval.plainUrl */ || options.$p ? workType = 0 /* Urls.WorkType.Default */ : // `.$p` may be computed from clipboard text and then unstable
      run_commands_1.overrideOption("$p", 1);
      exports.openUrlWithActions(normalize_urls_1.convertToUrl_(arr[0]), workType, false, tabs);
      break;

     case 4 /* Urls.kEval.status */ :
      workType >= 3 /* Urls.WorkType.EvenAffectStatus */ && arr[0] && run_commands_1.runNextCmdBy(1, options);
      break;

     case 9 /* Urls.kEval.browserSearch */ :
      run_commands_1.runNextCmdBy(1, options);
      break;

     case 3 /* Urls.kEval.ERROR */ :
      ports_1.showHUD(arr[0], 1 /* kTip.raw */);
      run_commands_1.runNextCmdBy(0, options);
      break;

     case 6 /* Urls.kEval.run */ :
      const cmd = arr[0];
      const curTab = store_1.curTabId_;
      if (cmd[0] === "openUrls") {
        const urls = cmd.slice(1);
        const urls2 = [];
        for (let url of urls) {
          typeof url === "string" || url[1] !== 5 /* Urls.kEval.paste */ && url[1] !== 7 /* Urls.kEval.plainUrl */ || (url = normalize_urls_1.convertToUrl_(arr[0], null, workType));
          if (typeof url === "string") {
            urls2.push(url);
            continue;
          }
          Promise.resolve(url).then(arr2 => {
            arr2[1] === 6 /* Urls.kEval.run */ && arr2[0][0] === "openUrls" || onEvalUrl_(workType, options, tabs, arr2);
          });
        }
        urls2.length > 0 && (tabs && tabs.length > 0 ? (applyOptions(urls2), openUrls(tabs)) : browser_1.getCurTab(tabs => {
          applyOptions(urls2);
          openUrls(tabs);
        }));
        return;
      }
      setTimeout(() => {
        const frames = store_1.framesForTab_.get(curTab), port = frames ? frames.cur_ : null;
        const opts = BgUtils_.safer_({
          keys: [ cmd[1] ]
        });
        store_1.set_cEnv(null);
        cmd[0] === "run1" ? store_1.runOneMapping_(cmd[1], port, {
          c: options.$f,
          r: options.$retry,
          u: 0,
          w: 0
        }) : run_commands_1.executeCommand(key_mappings_1.makeCommand_("runKey", opts), 1, 0 /* kKeyCode.None */ , port, 0, null);
      }, 0);
      break;
    }
  };
  const runNextIf = (succeed, options, result) => {
    succeed ? run_commands_1.runNextOnTabLoaded(options, result) : run_commands_1.runNextCmdBy(0, options);
  };
  const safeUpdate = (options, reuse, url, secondTimes, tabs1) => {
    const callback = tab => {
      runNextIf(tab, options, tab);
      return browser_1.runtimeError_();
    };
    if (tabs1) {
      if (tabs1.length > 0 && tabs1[0].incognito && browser_1.isRefusingIncognito_(url)) {
        browser_1.tabsCreate({
          url
        }, callback);
        return;
      }
    } else if (browser_1.isRefusingIncognito_(url) && secondTimes !== true) {
      browser_1.getCurTab(safeUpdate.bind(null, options, reuse, url, true));
      return;
    }
    if (reuse === 3 /* ReuseType.frame */ && store_1.cPort && store_1.cPort.s.frameId_) {
      const fakeTab = {
        id: store_1.cPort.s.tabId_
      };
      run_commands_1.sendFgCmd(18 /* kFgCmd.framesGoBack */ , false, {
        r: 1,
        u: url
      });
      setTimeout(() => runNextIf(true, options, fakeTab), 100);
      return;
    }
    tabs1 ? browser_1.tabsUpdate(tabs1[0].id, {
      url
    }, callback) : browser_1.tabsUpdate({
      url
    }, callback);
  };
  const makeWindowFrom = (url, focused, incognito, options, exOpts, wnd) => {
    browser_1.makeWindow({
      url,
      focused,
      incognito,
      type: typeof url === "string" || url.length === 1 ? normalizeWndType(options.window) : void 0,
      left: exOpts.left,
      top: exOpts.top,
      width: exOpts.width,
      height: exOpts.height
    }, exOpts.state != null ? exOpts.state : wnd && wnd.state !== "minimized" ? wnd.state : "", wnd2 => {
      runNextIf(wnd2, options, wnd2 && wnd2.tabs[0]);
    });
  };
  const openUrlInIncognito = (urls, reuse, options, tab, wnds) => {
    const active = reuse !== -2 /* ReuseType.newBg */;
    const curWndId = tab ? tab.windowId : store_1.curWndId_;
    const curWnd = wnds.find(wnd => wnd.id === curWndId), inCurWnd = curWnd != null && curWnd.incognito;
    if (!options.window && reuse !== 2 /* ReuseType.newWnd */ && (inCurWnd || (wnds = wnds.filter(w => w.incognito && w.type === "normal")).length > 0)) {
      const args = {
        url: urls[0],
        active,
        windowId: inCurWnd ? curWndId : exports.preferLastWnd(wnds).id
      };
      if (inCurWnd) {
        const opener = options.opener === true;
        args.index = exports.newTabIndex(tab, options.position, opener, options.group);
        opener && (args.openerTabId = tab.id);
      }
      browser_1.openMultiTabs(args, store_1.cRepeat, true, urls, inCurWnd && options.group, tab, tab2 => {
        !inCurWnd && active && browser_1.selectWnd(tab2);
        runNextIf(tab2, options, tab2);
      });
    } else {
      makeWindowFrom(urls, true, true, options, options, curWnd);
    }
  };
  const parseReuse = reuse => reuse == null ? -1 /* ReuseType.Default */ : typeof reuse !== "string" || /^-?\d+$/.test(reuse) ? typeof reuse === "boolean" ? reuse ? 1 /* ReuseType.reuse */ : -1 /* ReuseType.Default */ : isNaN(reuse = +reuse && 0 | +reuse) || reuse > 3 /* ReuseType.MAX */ || reuse < -8 /* ReuseType.MIN */ ? -1 /* ReuseType.Default */ : reuse : (reuse = reuse.toLowerCase().replace("window", "wnd").replace(/-/g, ""), 
  reuse in ReuseValues ? ReuseValues[reuse] : -1 /* ReuseType.Default */);
  exports.parseReuse = parseReuse;
  const fillUrlMasks = (url, tabs, url_mask) => {
    const tabUrl = tabs && tabs.length > 0 ? browser_1.getTabUrl(tabs[0]) : "";
    const masks = [ url_mask !== true ? url_mask === false ? "" : url_mask : (/[%$]s/i.exec(url) || [ "${url_mask}" ])[0], store_1.get_cOptions().host_mask || store_1.get_cOptions().host_mark, store_1.get_cOptions().tabid_mask || store_1.get_cOptions().tabId_mask || store_1.get_cOptions().tabid_mark || store_1.get_cOptions().tabId_mark, store_1.get_cOptions().title_mask || store_1.get_cOptions().title_mark, store_1.get_cOptions().id_mask || store_1.get_cOptions().id_mark || store_1.get_cOptions().id_marker ];
    const matches = [];
    for (let i = 0; i < masks.length; i++) {
      const mask = masks[i] != null ? masks[i] + "" : "", ind = mask ? url.indexOf(mask) : -1;
      if (ind >= 0) {
        let end = ind + mask.length;
        for (const j of matches) {
          if (ind < j[1] && end >= j[0]) {
            continue;
          }
        }
        matches.push([ ind, end, i === 0 ? /^[%$]S|^\$\{S:/.test(mask) ? tabUrl : BgUtils_.encodeAsciiComponent_(tabUrl) : i === 1 ? BgUtils_.encodeAsciiComponent_(new URL(tabUrl).host) : i === 2 ? tabUrl && "" + tabs[0].id : i === 3 ? tabUrl && "" + BgUtils_.encodeAsciiComponent_(tabs[0].title) : browser_1.browser_.runtime.id ]);
      }
    }
    if (matches.length) {
      let s = "", lastEnd = 0;
      matches.sort((a, b) => a[0] - b[0]);
      for (const match of matches) {
        s = s + url.slice(lastEnd, match[0]) + match[2];
        lastEnd = match[1];
      }
      url = s + url.slice(lastEnd);
    }
    return url;
  };
  const openUrlInAnotherWindow = (urls, reuse, isCurWndIncognito, options) => {
    const incognito = normalizeIncognito(options.incognito);
    let p;
    p = (reuse > -4 /* ReuseType.OFFSET_LAST_WINDOW */ ? new Promise(resolve => {
      browser_1.getCurWnd(false, wnd => (resolve(wnd || null), browser_1.runtimeError_()));
    }) : filter_tabs_1.findLastVisibleWindow_(normalizeWndType(options.window), true, incognito, store_1.curWndId_)).then(wnd => wnd && new Promise(resolve => {
      browser_1.Tabs_.query({
        active: true,
        windowId: wnd.id
      }, tabs => {
        wnd.tabs = tabs;
        resolve(wnd);
        return browser_1.runtimeError_();
      });
    }));
    p.then(wnd => {
      const isWndLast = !!wnd && !wnd.focused && wnd.id !== store_1.curWndId_;
 // in case a F12 window is focused
            const fallbackInCur = reuse === -7 /* ReuseType.ifLastWnd */ && !isWndLast;
      if (!wnd || !isWndLast && (reuse !== -7 /* ReuseType.ifLastWnd */ || incognito != null && wnd.incognito !== !!incognito)) {
        if (reuse === -7 /* ReuseType.ifLastWnd */ && run_commands_1.runNextCmdBy(0, options)) {
          return;
        }
        makeWindowFrom(urls, reuse > -8 /* ReuseType.lastWndBgInactive */ , incognito != null ? !!incognito : isCurWndIncognito, options, options, wnd);
        return;
      }
      const curTab = wnd.tabs && wnd.tabs.length > 0 ? browser_1.selectFrom(wnd.tabs) : null;
      browser_1.openMultiTabs({
        url: urls[0],
        active: reuse > -6 /* ReuseType.lastWndBg */ || fallbackInCur,
        windowId: wnd.id,
        pinned: !!options.pinned,
        index: curTab ? exports.newTabIndex(curTab, options.position, false, options.group) : void 0
      }, store_1.cRepeat, !!options.incognito && typeof options.incognito === "string", urls, options.group, curTab, newTab => {
        reuse > -6 /* ReuseType.lastWndBg */ ? isWndLast && browser_1.selectWnd(newTab) : newTab && reuse > -8 /* ReuseType.lastWndBgInactive */ && !fallbackInCur && browser_1.selectTab(newTab.id);
        runNextIf(newTab, options, reuse > -6 /* ReuseType.lastWndBg */ && reuse !== -2 /* ReuseType.newBg */ && newTab);
      });
    });
  };
  const openUrlInNewTab = (urls, reuse, options, tabs) => {
    const tab = tabs && tabs[0], tabIncognito = !!tab && tab.incognito, isCurWndIncognito = tabIncognito || store_1.curIncognito_ === 2 /* IncognitoType.true */ , active = reuse !== -2 /* ReuseType.newBg */ && reuse !== -8 /* ReuseType.lastWndBgInactive */;
    let window = reuse === 2 /* ReuseType.newWnd */ || reuse < -3 || !!options.window;
    let incognito = normalizeIncognito(options.incognito);
    const useForcedIncognito = incognito != null && typeof options.incognito === "string";
    if (!useForcedIncognito && urls.some(browser_1.isRefusingIncognito_)) {
      window = isCurWndIncognito || window;
    } else if (isCurWndIncognito) {
      window = incognito === false || window;
    } else if (incognito && reuse > -4 /* ReuseType.OFFSET_LAST_WINDOW */) {
      browser_1.Windows_.getAll( openUrlInIncognito.bind(null, urls, reuse, options, tab));
      return;
    }
    if (window) {
       openUrlInAnotherWindow(urls, reuse, isCurWndIncognito, options);
      return;
    }
    let openerTabId = options.opener && tab ? tab.id : void 0;
    const args = {
      url: urls[0],
      active,
      windowId: tab ? tab.windowId : void 0,
      openerTabId,
      pinned: !!options.pinned,
      index: tab ? exports.newTabIndex(tab, options.position, openerTabId != null, options.group) : void 0
    };
    browser_1.openMultiTabs(args, store_1.cRepeat, useForcedIncognito, urls, options.group, tab, tab2 => {
      active && tab2 && browser_1.selectWndIfNeed(tab2);
      runNextIf(tab2, options, active && tab2);
    });
  };
  const replaceOrOpenInNewTab = (url, reuse, replace, options, reuseOptions, curTabs) => {
    const matcher = replace ? typeof replace === "string" ? exclusions_1.createSimpleUrlMatcher_(replace) : typeof replace === "object" && replace.t && replace.v ? replace : null : null;
    const allWindows = reuse === 2 /* ReuseType.newWnd */ || reuse === 1 /* ReuseType.reuse */;
    const mayReuse = reuse === 1 /* ReuseType.reuse */ || reuse === -3 /* ReuseType.reuseInCurWnd */;
    const reuseO2 = mayReuse && reuseOptions.q || {};
    const rawWndType = mayReuse ? reuseO2.w : options.window;
    const wndType = normalizeWndType(rawWndType);
    const incognito = normalizeIncognito(mayReuse ? reuseO2.i : options.incognito);
    // here it's by intent to make .group default to false
        const useGroup = (mayReuse ? reuseO2.g : options.group) === true;
    store_1.set_cRepeat(1);
    if (mayReuse) {
      reuseO2.m = null;
      reuseO2.g = useGroup;
    } else {
      run_commands_1.overrideOption("group", useGroup, options);
      options.replace != null && run_commands_1.overrideOption("replace", matcher, options);
    }
    let p;
    p = reuse < -3 && matcher ? filter_tabs_1.findLastVisibleWindow_(wndType, reuse === -7 /* ReuseType.ifLastWnd */ , incognito, store_1.curWndId_).then(wnd => !wnd || wnd instanceof Array ? null : wnd) : Promise.resolve(!allWindows && store_1.curWndId_ >= 0 ? {
      id: store_1.curWndId_
    } : null);
    Promise.all([ p, !useGroup || curTabs ? null : new Promise(resolve => {
      browser_1.getCurTab(curTabs2 => {
        curTabs = curTabs2 || [];
        resolve();
      });
    }) ]).then(([preferredWnd, _]) => matcher && (preferredWnd || allWindows) ? new Promise(r => {
      browser_1.Tabs_.query(preferredWnd ? {
        windowId: preferredWnd.id
      } : {
        windowType: wndType || void 0
      }, tabs => {
        const refused = incognito != null ? !incognito : reuse > -4 /* ReuseType.OFFSET_LAST_WINDOW */ ? store_1.curIncognito_ !== 2 /* IncognitoType.true */ : -2;
        let matched = (tabs || []).filter(tab => exclusions_1.matchSimply_(matcher, tab.url) && tab.incognito !== refused);
        if (useGroup && matched.length > 0 && curTabs.length > 0) {
          const curGroup = browser_1.getGroupId(curTabs[0]);
          tabs && (matched = matched.filter(tab => browser_1.getGroupId(tab) === curGroup));
        }
        matched.sort((a, b) => {
          const cachedB = store_1.recencyForTab_.get(b.id), cachedA = store_1.recencyForTab_.get(a.id);
          return cachedA ? cachedB ? cachedB - cachedA : 1 : cachedB ? -1 : b.id - a.id;
        });
        if (reuse === 1 /* ReuseType.reuse */) {
          const inCurWnd = matched.filter(tab => tab.windowId === store_1.curWndId_);
          matched = inCurWnd.length > 0 ? inCurWnd : matched;
        }
        r(matched.length ? matched[0] : null);
        return browser_1.runtimeError_();
      });
    }) : null).then(matchedTab => {
      if (matchedTab == null || matchedTab.id === store_1.curTabId_ && !mayReuse) {
        mayReuse ? exports.focusOrLaunch_(reuseOptions) : !run_commands_1.runNextCmdBy(0, options) && (curTabs ? openUrlInNewTab([ url ], reuse, options, curTabs) : browser_1.getCurTab(openUrlInNewTab.bind(null, [ url ], reuse, options)));
      } else if (store_1.shownHash_ && matchedTab.url.startsWith(store_1.CONST_.ShowPage_)) {
        updateShownPage(mayReuse ? reuseOptions.f || {} : options, matchedTab);
      } else {
        const active = reuse !== -2 /* ReuseType.newBg */ && reuse !== -8 /* ReuseType.lastWndBgInactive */;
        const activeWnd = matchedTab.windowId !== store_1.curWndId_ && reuse > -6 /* ReuseType.lastWndBg */;
        browser_1.tabsUpdate(matchedTab.id, {
          url
        }, newTab => {
          if (newTab) {
            active && (browser_1.selectTab(newTab.id), newTab.active = true);
            activeWnd && browser_1.selectWnd(newTab);
          }
          runNextIf(newTab, mayReuse ? reuseOptions.f || {} : options, reuse !== -2 /* ReuseType.newBg */ && reuse > -6 /* ReuseType.lastWndBg */ && newTab);
          return browser_1.runtimeError_();
        });
      }
    });
  };
  const openJSUrl = (url, options, onBrowserFail, reuse) => {
    var _a;
    if (/^(void|\(void\))? ?(0|\(0\))?;?$/.test(url.slice(11).trim())) {
      run_commands_1.runNextCmdBy(1, options);
      return;
    }
    if (!onBrowserFail && store_1.cPort) {
      reuse === 0 /* ReuseType.current */ && store_1.set_cPort(((_a = ports_1.getCurFrames_()) === null || _a === void 0 ? void 0 : _a.top_) || store_1.cPort);
      if (ports_1.safePost(store_1.cPort, {
        N: 5 /* kBgReq.eval */ ,
        u: url,
        f: run_commands_1.parseFallbackOptions(options)
      })) {
        return;
      }
      if (reuse !== -1 /* ReuseType.Default */) {
        run_commands_1.runNextCmdBy(0, options);
        return;
      }
      store_1.set_cPort(null);
    }
    const callback1 = opt => {
      if (opt !== -1 && !browser_1.runtimeError_()) {
        run_commands_1.runNextOnTabLoaded(options, null);
        return;
      }
      BgUtils_.DecodeURLPart_(url.slice(11));
      Promise.resolve().then(result => {
        result === void 0 && onBrowserFail && onBrowserFail();
        runNextIf(!!result, options, null);
      });
      return browser_1.runtimeError_();
    };
    // e.g.: use Chrome omnibox at once on starting
        callback1(-1);
  };
  exports.openJSUrl = openJSUrl;
  const openShowPage = (url, reuse, options, _tab) => {
    const prefix = store_1.CONST_.ShowPage_;
    if (url.length < prefix.length + 3 || !url.startsWith(prefix)) {
      return false;
    }
    if (_tab === void 0) {
      browser_1.getCurTab(tabs => {
        const reuse2 = tabs && tabs.length > 0 || reuse === -2 /* ReuseType.newBg */ ? reuse : -1 /* ReuseType.newFg */;
        exports.openShowPage(url, reuse2, options, tabs && tabs[0] || null);
        return browser_1.runtimeError_();
      });
      return true;
    }
    url = url.slice(prefix.length);
    const incognito = _tab ? _tab.incognito : store_1.curIncognito_ === 2 /* IncognitoType.true */;
    url.startsWith("#!image ") && incognito && (url = "#!image incognito=1&" + url.slice(8).trim());
    const arr = [ url, null, 0 ];
    store_1.set_shownHash_(arr[1] = () => {
      clearTimeout(arr[2]);
      store_1.set_shownHash_(null);
      return arr[0];
    });
    arr[2] = setTimeout(() => {
      arr[0] = "#!url vimium://error (vimium://show: sorry, the info has expired.)";
      arr[2] = setTimeout(() => {
        store_1.shownHash_ === arr[1] && store_1.set_shownHash_(null);
        arr[0] = "", arr[1] = null;
      }, 2e3);
    }, 1200);
    store_1.set_cRepeat(1);
    if (reuse === 0 /* ReuseType.current */ || reuse === 3 /* ReuseType.frame */ || incognito && (reuse === -2 /* ReuseType.newBg */ || reuse === -1 /* ReuseType.newFg */)) {
      incognito ? browser_1.tabsCreate({
        url: prefix,
        active: reuse !== -2
 /* ReuseType.newBg */      }, newTab => {
        runNextIf(newTab, options, newTab);
      }) : updateShownPage(options, _tab);
    } else {
      options.incognito = false;
      reuse === 1 /* ReuseType.reuse */ || reuse === -3 /* ReuseType.reuseInCurWnd */ ? replaceOrOpenInNewTab(url, reuse, options.replace, null, {
        u: prefix,
        a: options.parent,
        p: options.prefix,
        q: exports.parseOpenPageUrlOptions(options),
        f: run_commands_1.parseFallbackOptions(options)
      }, _tab ? [ _tab ] : void 0) : openUrlInNewTab([ prefix ], reuse, options, _tab ? [ _tab ] : void 0);
    }
    return true;
  };
  exports.openShowPage = openShowPage;
  const updateShownPage = (options, tab) => {
    const prefix = store_1.CONST_.ShowPage_;
    browser_1.tabsUpdate(tab.id, {
      url: prefix,
      active: true
    });
    BgUtils_.nextTick_(() => {
      run_commands_1.runNextOnTabLoaded(options, null);
    });
  };
  // use Urls.WorkType.Default
    const openUrls = tabs => {
    const options = store_1.get_cOptions();
    let urls = options.urls;
    if (options.$fmt !== 2) {
      if (options.$fmt !== 1) {
        for (let i = 0; i < urls.length; i++) {
          urls[i] = normalize_urls_1.convertToUrl_(urls[i] + "");
        }
      }
      run_commands_1.overrideCmdOptions({}, true);
      run_commands_1.overrideOption("urls", urls);
      run_commands_1.overrideOption("$fmt", 2);
    }
    for (const url of urls) {
      if (exports.checkHarmfulUrl_(url)) {
        return browser_1.runtimeError_();
      }
    }
    const rawReuse = exports.parseReuse(options.reuse);
    const reuse = rawReuse === 1 /* ReuseType.reuse */ || rawReuse === 0 /* ReuseType.current */ || rawReuse === 3 /* ReuseType.frame */ || rawReuse === -3 /* ReuseType.reuseInCurWnd */ ? -1 /* ReuseType.newFg */ : rawReuse;
    store_1.set_cOptions(null);
    openUrlInNewTab(urls, reuse, options, tabs);
  };
  const openUrlWithActions = (url, workType, sed, tabs) => {
    var _a, _b;
    if (typeof url !== "string") {} else if (url || workType !== 9 /* Urls.WorkType.FakeType */) {
      const fill = run_commands_1.fillOptionWithMask(url, store_1.get_cOptions().mask, "value", [ "url", "url_mask", "url_mark", "value" ], store_1.cRepeat), exOut = {};
      if (fill.ok) {
        url = fill.result;
        fill.useCount && store_1.set_cRepeat(1);
      }
      let url_mask = store_1.get_cOptions().url_mask, umark = store_1.get_cOptions().url_mark;
      url_mask == null && umark == null || (url =  fillUrlMasks(url, tabs, url_mask != null ? url_mask : umark));
      if (sed) {
        const postSed = clipboard_1.parseSedOptions_(store_1.get_cOptions());
        url = store_1.substitute_(url, 0 /* SedContext.NONE */ , postSed, exOut);
      }
      if (workType !== 9 /* Urls.WorkType.FakeType */) {
        const keyword = (_a = exOut.keyword_) !== null && _a !== void 0 ? _a : (store_1.get_cOptions().keyword || "") + "";
        const testUrl = (_b = store_1.get_cOptions().testUrl) !== null && _b !== void 0 ? _b : !keyword;
        const isSpecialKW = !!exOut.keyword_ || !!exOut.actAnyway_ || !!keyword && keyword !== "~";
        url = testUrl ? normalize_urls_1.convertToUrl_(url, keyword, workType) : normalize_urls_1.createSearchUrl_(url.trim().split(BgUtils_.spacesRe_), keyword, isSpecialKW ? -2 /* Urls.WorkType.KeepAll */ : workType);
        url = testUrl || !isSpecialKW ? url : normalize_urls_1.convertToUrl_(url, null, normalize_urls_1.hasUsedKeyword_ && url.startsWith("vimium:") ? 3 /* Urls.WorkType.EvenAffectStatus */ : workType);
      }
      const goNext = store_1.get_cOptions().goNext;
      if (goNext && url && typeof url === "string") {
        const exOut2 = {};
        url = store_1.substitute_(url, 8192 /* SedContext.goNext */ , null, exOut2);
        url = exports.goToNextUrl(url, store_1.cRepeat, goNext === "absolute")[1];
        exOut.keyword_ && (url = normalize_urls_1.createSearchUrl_(url.trim().split(BgUtils_.spacesRe_), exOut.keyword_, 3 /* Urls.WorkType.EvenAffectStatus */));
      }
      url = typeof url === "string" ? normalize_urls_1.reformatURL_(url) : url;
    } else {
      url = store_1.newTabUrl_f;
    }
    let options = store_1.get_cOptions(), reuse = exports.parseReuse(options.reuse);
    const incog = reuse === 0 /* ReuseType.current */ || reuse === 3 /* ReuseType.frame */ ? normalizeIncognito(options.incognito) : null;
    store_1.set_cOptions(null);
    BgUtils_.resetRe_();
    incog != null && incog !== (store_1.curIncognito_ === 2 /* IncognitoType.true */) && (reuse = -1 /* ReuseType.newFg */);
    typeof url !== "string" ? Promise.resolve(url).then(onEvalUrl_.bind(0, workType, options, tabs)) :  !exports.openShowPage(url, reuse, options) && (BgUtils_.isJSUrl_(url) ?  exports.openJSUrl(url, options, null, reuse) : exports.checkHarmfulUrl_(url) ? run_commands_1.runNextCmdBy(0, options) : reuse === 1 /* ReuseType.reuse */ || reuse === -3 /* ReuseType.reuseInCurWnd */ ? replaceOrOpenInNewTab(url, reuse, options.replace, null, {
      u: url,
      a: options.parent,
      p: options.prefix,
      q: exports.parseOpenPageUrlOptions(options),
      f: run_commands_1.parseFallbackOptions(options)
    }, tabs) : reuse === 0 /* ReuseType.current */ || reuse === 3 /* ReuseType.frame */ ?  safeUpdate(options, reuse, url) : options.replace ? replaceOrOpenInNewTab(url, reuse, options.replace, options, null, tabs) : tabs ? openUrlInNewTab([ url ], reuse, options, tabs) : browser_1.getCurTab(openUrlInNewTab.bind(null, [ url ], reuse, options)));
  };
  exports.openUrlWithActions = openUrlWithActions;
  const openCopiedUrl = (copied, exOut, tabs, url) => {
    if (url === null) {
      ports_1.complainLimits(i18n_1.trans_("readClipboard"));
      run_commands_1.runNextCmd(0);
      return;
    }
    if (!(url = url.trim())) {
      ports_1.showHUD(i18n_1.trans_("noCopied"));
      run_commands_1.runNextCmd(0);
      return;
    }
    exOut.keyword_ != null && run_commands_1.overrideCmdOptions({
      keyword: exOut.keyword_
    });
    copied = typeof copied === "string" ? copied : "";
    const searchLines = copied.includes("any");
    let urls;
    if ((copied.includes("urls") || searchLines) && (urls = url.split(/[\r\n]+/g)).length > 1) {
      const urls2 = [], rawKeyword = searchLines && store_1.get_cOptions().keyword;
      const keyword = rawKeyword ? rawKeyword + "" : null;
      let has_err = false;
      for (let i of urls) {
        i = i.trim();
        if (i) {
          i = normalize_urls_1.convertToUrl_(i, keyword, 0 /* Urls.WorkType.Default */);
          if (!(searchLines || normalize_urls_1.lastUrlType_ <= 2 /* Urls.Type.MaxOfInputIsPlainUrl */)) {
            urls2.length = 0;
            has_err = true;
            break;
          }
          urls2.push(i);
        }
      }
      if (urls2.length > 1) {
        store_1.set_cOptions(run_commands_1.copyCmdOptions(BgUtils_.safeObj_(), store_1.get_cOptions()));
        store_1.get_cOptions().urls = urls2;
        store_1.get_cOptions().$fmt = 1;
        tabs && tabs.length > 0 ? openUrls(tabs) : browser_1.getCurTab(openUrls);
        return;
      }
      if (has_err && copied.includes("auto")) {
        url = url.replace(/[\r\n]+/g, " ");
      } else if (has_err) {
        run_commands_1.runNextCmd(0) || ports_1.showHUD("The copied lines are not URLs");
        return;
      }
    }
    if (normalize_urls_1.quotedStringRe_.test(url)) {
      url = url.slice(1, -1);
    } else {
      const _rawTest = store_1.get_cOptions().testUrl;
      (_rawTest != null ? _rawTest : !store_1.get_cOptions().keyword) && (url = parse_urls_1.findUrlInText_(url, _rawTest));
    }
    let start = url.indexOf("://") + 3;
    if (start > 3 && BgUtils_.protocolRe_.test(url)) {
      url = /^ttps?:/i.test(url) ? "h" + url : url;
      // an origin with "/"
            let arr;
      const end = url.indexOf("/", start) + 1 || url.length, host = url.slice(start, end), type = host.startsWith("0.0.0.0") ? 7 : host.includes(":::") && (arr = /^(\[?::\]?):\d{2,5}$/.exec(host)) ? arr[1].length : 0;
      url = type ? url.slice(0, start) + (type > 6 ? "127.0.0.1" : "[::1]") + url.slice(start + type) : url;
    }
    exports.openUrlWithActions(url, 2 /* Urls.WorkType.ActAnyway */ , false, tabs);
  };
  const goToNextUrl = (url, count, abs) => {
    const normalizeInt = (n, fb) => typeof n !== "number" || isNaN(n) ? fb : n;
    let matched = false;
    let re = /\$\{([\da-zA-Z_-]+)(?:[,\/#@](-?\d*)(?::(-?\d*)(:-?\d*)?)?(?:[,\/#@]([^}]+))?)?\}|\$\$/g;
    url = url.replace(re, (s, n, min, end, step, exArgs) => {
      if (s === "$$") {
        return "$";
      }
      matched = true;
      let radix = 10, min_len = 1, reverse = false, outRadix = 0;
      for (const [key, val] of exArgs ? exArgs.split("&").map(i => i.split("=")) : []) {
        if (key === "min_len" || key === "len") {
          min_len = +val || 1;
        } else if (key === "radix") {
          radix = val;
          radix = radix >= 2 && radix <= 36 ? radix : 10;
        } else if (key.startsWith("out") && key.endsWith("radix")) {
          outRadix = val;
          outRadix = outRadix >= 2 && outRadix <= 36 ? outRadix : outRadix && 10;
        } else {
          key === "reverse" && (reverse = val === "1" || val.toLowerCase() === "true");
        }
      }
      let cur = normalizeInt(n && parseInt(n, radix), 1);
      let stepi = step && parseInt(step.slice(1)) || 0;
      const isNeg = stepi < 0 || !stepi && (step || "0")[0] === "-";
      let mini = normalizeInt(min && parseInt(min), isNeg ? -1 : 1);
      let endi = normalizeInt(end && parseInt(end), 1 / 0 * (isNeg ? -1 : 1));
      stepi = (endi >= mini ? 1 : -1) * (Math.abs(stepi) || 1);
      count *= reverse ? -stepi : stepi;
      cur = abs && count ? stepi > 0 ? count > 0 ? mini + count - 1 : (isFinite(endi) ? endi : 1e4) + count : count < 0 ? mini + count + 1 : (isFinite(endi) ? endi : -1e4) + count : cur + count;
      cur = endi >= mini ? Math.max(mini, Math.min(cur, endi - 1)) : Math.max(endi + 1, Math.min(cur, mini));
      let y = cur.toString(outRadix || radix);
      y = y.length < min_len ? "0".repeat(min_len - y.length) + y : y;
      return y;
    });
    return [ matched, url ];
  };
  exports.goToNextUrl = goToNextUrl;
  const openUrl = tabs => {
    if (store_1.get_cOptions().urls) {
      store_1.get_cOptions().urls instanceof Array && (tabs && tabs.length > 0 ? openUrls(tabs) : browser_1.getCurTab(openUrls));
      return;
    }
    if ((store_1.get_cOptions().url_mask != null || store_1.get_cOptions().url_mark != null) && !tabs) {
      return browser_1.runtimeError_() || void browser_1.getCurTab(exports.openUrl);
    }
    let rawUrl = store_1.get_cOptions().url;
    if (store_1.get_cOptions().copied) {
      let copied = store_1.get_cOptions().copied;
      let copiedName = typeof copied !== "string" ? null : copied.includes("<") ? copied.split("<")[1] : copied.includes(">") ? copied.split(">")[0] : null;
      let url, exOut = {};
      if (copiedName) {
        copied = copied.includes("<") ? copied.split("<")[0] : copied.split(">")[1];
        url = store_1.innerClipboard_.get(copiedName) || "";
        url = store_1.substitute_(url, 32768 /* SedContext.paste */ , clipboard_1.parseSedOptions_(store_1.get_cOptions()), exOut);
      } else {
        url = store_1.paste_(clipboard_1.parseSedOptions_(store_1.get_cOptions()), 0, exOut);
      }
      url instanceof Promise ? url.then( openCopiedUrl.bind(null, copied, exOut, tabs)) : openCopiedUrl(copied, exOut, tabs, url);
    } else if (rawUrl || store_1.get_cOptions().sed) {
      exports.openUrlWithActions(rawUrl != null ? rawUrl + "" : "", 3 /* Urls.WorkType.EvenAffectStatus */ , true, tabs);
    } else {
      let url_f = store_1.get_cOptions().url_f;
      exports.openUrlWithActions(url_f || "", 9 /* Urls.WorkType.FakeType */ , false, tabs);
    }
  };
  exports.openUrl = openUrl;
  const openUrlReq = (request, port) => {
    var _a, _b;
    BgUtils_.safer_(request);
    let isWeb = port != null && ports_1.isNotVomnibarPage(port, true);
    store_1.set_cPort(isWeb ? port : ports_1.findCPort(port) || store_1.cPort);
    let url = request.u || "";
    // { url_f: string, ... } | { copied: true, ... }
        const opts = request.n && run_commands_1.parseFallbackOptions(request.n) || {};
    const o2 = request.o || request.n && exports.parseOpenPageUrlOptions(request.n) || {};
    const rawKeyword = (o2.k || "") + "", testUrl = (_a = o2.t) !== null && _a !== void 0 ? _a : !rawKeyword;
    const sed = o2.s;
    const hintMode = request.m || 0 /* HintMode.DEFAULT */;
    const mode1 = hintMode < 64 /* HintMode.min_disable_queue */ ? hintMode & -17 /* HintMode.queue */ : hintMode;
    const formatted = request.f != null ? request.f : mode1 === 45 /* HintMode.OPEN_INCOGNITO_LINK */ || mode1 === 46 /* HintMode.OPEN_LINK */;
    opts.group = !isWeb || o2.g;
    opts.incognito = normalizeIncognito(o2.i) != null ? o2.i : mode1 === 45 /* HintMode.OPEN_INCOGNITO_LINK */ || null;
    opts.replace = o2.m;
    opts.position = o2.p;
    const reuse = o2.r != null ? o2.r : hintMode ? request.t === "window" ? 2 /* ReuseType.newWnd */ : (hintMode & 16 /* HintMode.queue */ ? -2 /* ReuseType.newBg */ : -1 /* ReuseType.newFg */) + (request.t === "last-window" ? -4 /* ReuseType.OFFSET_LAST_WINDOW */ : 0) : request.r;
    opts.reuse = reuse;
    opts.window = o2.w;
    if (url || !isWeb) {
      url[0] === ":" && !isWeb && /^:[bhtwWBHdso]\s/.test(url) && (url = request.u = url.slice(2).trim());
      const originalUrl = url, exOut = {}, context = isWeb ? formatted ? 1048576 /* SedContext.pageURL */ : 524288 /* SedContext.pageText */ : testUrl ? 16384 /* SedContext.omni */ : 0 /* SedContext.NONE */;
      url = testUrl ? parse_urls_1.findUrlEndingWithPunctuation_(url, formatted) : url;
      url = store_1.substitute_(url, context, sed, exOut);
      let keyword = (_b = exOut.keyword_) !== null && _b !== void 0 ? _b : rawKeyword;
      let beforeConversion = url.trim();
      normalize_urls_1.resetLastUrlType_();
      if (formatted && !keyword) {
        url = url !== originalUrl ? normalize_urls_1.convertToUrl_(beforeConversion, null, -1 /* Urls.WorkType.ConvertKnown */) : beforeConversion;
      } else if (testUrl || !isWeb && !keyword) {
        beforeConversion = testUrl ? parse_urls_1.findUrlInText_(beforeConversion, testUrl) : beforeConversion;
        url = normalize_urls_1.convertToUrl_(beforeConversion, keyword, isWeb ? -1 /* Urls.WorkType.ConvertKnown */ : 3 /* Urls.WorkType.EvenAffectStatus */);
      } else {
        url = normalize_urls_1.createSearchUrl_(beforeConversion.split(BgUtils_.spacesRe_), keyword, keyword && keyword !== "~" ? -1 /* Urls.WorkType.ConvertKnown */ : 0 /* Urls.WorkType.Default */);
        url = normalize_urls_1.hasUsedKeyword_ ? normalize_urls_1.convertToUrl_(beforeConversion = url, keyword = "", url.startsWith("vimium:") ? 3 /* Urls.WorkType.EvenAffectStatus */ : 0 /* Urls.WorkType.Default */) : url;
      }
      if (normalize_urls_1.lastUrlType_ === 4 /* Urls.Type.Search */ && !keyword && store_1.settingsCache_.preferBrowserSearch) {
        url = `vimium://b-search-at/${reuse}/${beforeConversion}`;
        url = normalize_urls_1.convertToUrl_(url, null, 2 /* Urls.WorkType.ActAnyway */);
      }
      normalize_urls_1.lastUrlType_ !== 2 /* Urls.Type.NoScheme */ && normalize_urls_1.lastUrlType_ !== 1 /* Urls.Type.NoProtocolName */ || request.h == null ? normalize_urls_1.lastUrlType_ === 3 /* Urls.Type.PlainVimium */ && url.startsWith("vimium:") && !originalUrl.startsWith("vimium://") && (url = normalize_urls_1.convertToUrl_(url, null, normalize_urls_1.hasUsedKeyword_ || url.startsWith("vimium://run") ? 3 /* Urls.WorkType.EvenAffectStatus */ : 0 /* Urls.WorkType.Default */)) : url = (request.h ? "https" : "http") + url.slice(url[4] === "s" ? 5 : 4);
      opts.opener = isWeb ? o2.o !== false : store_1.vomnibarBgOptions_.actions.includes("opener");
      opts.url_f = url;
    } else {
      if (!request.c) {
        store_1.set_cPort(port || ports_1.findCPort(null));
        run_commands_1.runNextCmdBy(0, opts) || ports_1.showHUD("", 14 /* kTip.noUrlCopied */);
        return;
      }
      opts.copied = request.c, opts.keyword = rawKeyword, opts.testUrl = o2.t;
      opts.sed = sed;
    }
    store_1.set_cRepeat(1);
    run_commands_1.replaceCmdOptions(opts);
    exports.openUrl();
  };
  exports.openUrlReq = openUrlReq;
  //#region focusOrLaunch
  /** safe when cPort is null */  const focusOrLaunch_ = (request, port) => {
    const onMatchedTabs = tabs => {
      var _a;
      const incongito = (_a = normalizeIncognito(opts2.i)) !== null && _a !== void 0 ? _a : store_1.curIncognito_ === 2 /* IncognitoType.true */ && null;
      tabs = tabs || [];
      incongito !== null && (tabs = tabs.filter(tab => tab.incognito === incongito));
      if (opts2.g && curTabs.length > 0) {
        const curGroup = browser_1.getGroupId(curTabs[0]);
        tabs = tabs.filter(tab => browser_1.getGroupId(tab) === curGroup);
      }
      if (tabs.length > 0) {
        const tabs2 = tabs.filter(tab2 => tab2.windowId === store_1.curWndId_);
        updateMatchedTab(tabs2.length > 0 ? tabs2 : tabs);
        return;
      }
      const notInCurWnd = store_1.curIncognito_ === 2 /* IncognitoType.true */ && browser_1.isRefusingIncognito_(request.u);
      // if `request.s`, then `typeof request` is `MarksNS.MarkToGo`
            if (request.f && run_commands_1.runNextCmdBy(0, request.f)) {} else if (curTabs.length <= 0 || opts2.w || reuse === 2 /* ReuseType.newWnd */) {
        browser_1.makeWindow({
          url: request.u,
          type: normalizeWndType(opts2.w),
          incognito: !notInCurWnd && store_1.curIncognito_ === 2
 /* IncognitoType.true */        }, "", wnd => {
          callback(wnd && wnd.tabs && wnd.tabs.length > 0 ? wnd.tabs[0] : null);
        });
      } else if (notInCurWnd) {
        browser_1.openMultiTabs({
          url: request.u,
          active: true
        }, 1, null, [ null ], opts2.g, null, callback);
      } else if (reuse === 0 /* ReuseType.current */ || reuse === 3 /* ReuseType.frame */) {
        safeUpdate({}, reuse, request.u);
        if (reuse === 3 /* ReuseType.frame */ && port && port.s.frameId_) {
          run_commands_1.sendFgCmd(18 /* kFgCmd.framesGoBack */ , false, {
            r: 1,
            u: request.u
          });
          callback(curTabs[0]);
        } else {
          browser_1.tabsUpdate(curTabs[0].id, {
            url: request.u
          }, callback);
        }
      } else {
        browser_1.openMultiTabs({
          url: request.u,
          index: exports.newTabIndex(curTabs[0], opts2.p, false, true),
          openerTabId: opts2.o && curTabs[0] ? curTabs[0].id : void 0,
          windowId: curTabs[0].windowId,
          active: true
        }, 1, null, [ null ], opts2.g, curTabs[0], callback);
      }
      return browser_1.runtimeError_();
    };
    const updateMatchedTab = tabs2 => {
      const url = request.u;
      const prefix = !!request.p, matchDifferent = prefix ? 1 : request.a ? -1 : 0;
      matchDifferent && tabs2.sort((a, b) => (a.url.length - b.url.length) * matchDifferent);
      let tab = browser_1.selectFrom(tabs2);
      matchDifferent && tab.url.length > tabs2[0].url.length === prefix && (tab = tabs2[0]);
      if (!url.startsWith(store_1.CONST_.OptionsPage_) || store_1.framesForTab_.get(tab.id) || request.s) {
        if (store_1.shownHash_ && tab.url.startsWith(store_1.CONST_.ShowPage_)) {
          updateShownPage(request.f || {}, tab);
          browser_1.selectWndIfNeed(tab);
        } else {
          const cur = store_1.IsEdg_ ? tab.url.replace(/^edge:/, "chrome:") : tab.url;
          const wanted = store_1.IsEdg_ ? url.replace(/^edge:/i, "chrome:") : url;
          finallyMatched = prefix ? cur.startsWith(wanted) : request.a ? wanted.startsWith(cur) : wanted === cur;
          browser_1.tabsUpdate(tab.id, {
            url: finallyMatched ? void 0 : url,
            active: true
          }, callback);
          browser_1.selectWndIfNeed(tab);
        }
      } else {
        browser_1.tabsCreate({
          url
        }, callback);
        browser_1.Tabs_.remove(tab.id);
      }
    };
    const callback = tab => {
      if (!tab) {
        request.f && run_commands_1.runNextCmdBy(0, request.f);
        return browser_1.runtimeError_();
      }
      run_commands_1.runNextOnTabLoaded(request.f || {}, tab, request.s && (() => {
        tools_1.Marks_.scrollTab_(request, tab.id, 0 /* kKeyCode.None */ , finallyMatched);
      }));
    };
    let curTabs;
    let finallyMatched = false;
    // * do not limit windowId or windowType
        let toTest = normalize_urls_1.reformatURL_(request.u.split("#", 1)[0]);
    if (exports.checkHarmfulUrl_(toTest, port)) {
      return;
    }
    const opts2 = request.q || (request.q = {});
    (opts2.g == null || toTest.startsWith(store_1.CONST_.OptionsPage_)) && (opts2.g = false);
    const reuse = opts2.r != null ? exports.parseReuse(opts2.r) : 1 /* ReuseType.reuse */;
    if (opts2.m) {
      replaceOrOpenInNewTab(request.u, reuse !== 3 /* ReuseType.frame */ && reuse !== 0 /* ReuseType.current */ ? reuse : 1 /* ReuseType.reuse */ , opts2.m, null, request);
      return;
    }
    browser_1.Q_(browser_1.getCurTab).then(async curTabs1 => {
      curTabs = curTabs1;
      const allTests = [], wndId = reuse === -3 /* ReuseType.reuseInCurWnd */ && store_1.curWndId_ >= 0 ? store_1.curWndId_ : void 0;
      let toTest2 = toTest, windowType = normalizeWndType(opts2.w) || "normal";
      if (BgUtils_.protocolRe_.test(toTest)) {
        let i = toTest.indexOf("/") + 2, j = toTest.indexOf("/", i + 1), host = toTest.slice(i, j > 0 ? j : void 0);
        if (request.a) {
          toTest = toTest.slice(0, j > 0 ? j + 1 : void 0);
          toTest2 = toTest = toTest.endsWith("/") ? toTest : toTest + "/";
        }
        host && host.includes("@") && (toTest2 = toTest = toTest.slice(0, i) + host.split("@")[1] + toTest.slice(j));
      }
      const matchDifferent = !(!request.p && !request.a);
      !toTest.startsWith("file:") && !toTest.startsWith("ftp") || toTest.includes(".", toTest.lastIndexOf("/") + 1) || allTests.push(toTest2 + (matchDifferent ? "/*" : "/"));
      allTests.push(matchDifferent ? toTest2 + "*" : toTest2);
      // if no .replace, then only search in normal windows by intent
      for (let cond of allTests) {
        let matched = await browser_1.Q_(browser_1.Tabs_.query, {
          url: cond,
          windowType,
          windowId: wndId
        });
        if (matched && request.a) {
          store_1.IsEdg_ && (toTest = toTest.replace(/^chrome:/i, "edge:"));
          matched = matched.filter(i => toTest.startsWith(i.url.split(/[#?]/, 1)[0]));
        }
        if (matched && matched.length > 0) {
          return onMatchedTabs(matched);
        }
      }
      onMatchedTabs([]);
    });
  };
  exports.focusOrLaunch_ = focusOrLaunch_;
});
//#endregion
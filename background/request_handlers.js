"use strict";
__filename = "background/request_handlers.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./parse_urls", "./settings", "./ports", "./exclusions", "./ui_css", "./i18n", "./key_mappings", "./run_commands", "./run_keys", "./tools", "./open_urls", "./frame_commands", "./tab_commands", "./side_panel" ], function(require, exports, store_1, BgUtils_, browser_1, normalize_urls_1, parse_urls_1, settings_, ports_1, exclusions_1, ui_css_1, i18n_1, key_mappings_1, run_commands_1, run_keys_1, tools_1, open_urls_1, frame_commands_1, tab_commands_1, side_panel_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  let _pageHandlers;
  const _AsReqH = handler => {
    if (handler == null) {
      throw new ReferenceError("Refer a request handler before it gets inited");
    }
    return (req, port) => {
      handler(req, port);
    };
  };
  store_1.set_reqH_([ 
  /** kFgReq.fromInjectedPages: */ (request, port) => {
    const name = request.handler;
    if (!name || typeof name !== "string") {
      return;
    }
    if (name === "focus" /* kFgReq.focus */) {
      if (!(port.s.flags_ & 4 /* Frames.Flags.userActed */)) {
        port.s.flags_ |= 4 /* Frames.Flags.userActed */;
        port.postMessage({
          N: 8
 /* kBgReq.exitGrab */        });
      }
      store_1.reqH_[12 /* kFgReq.exitGrab */ ]({}, port);
    } else if (name === "command" /* kFgReq.command */) {
      run_commands_1.executeExternalCmd(request, null, port);
    } else if (name === "tip" /* kFgReq.tip */) {
      store_1.set_cPort(ports_1.indexFrame(port.s.tabId_, 0) || port);
      ports_1.showHUD(request.tip || "Error: Lack .tip");
    }
  }, 
  /** kFgReq.blank: */ () => 0, 
  /** kFgReq.setSetting: */ (request, port) => {
    const k = request.k, allowed = settings_.frontUpdateAllowed_;
    if (!(k >= 0 && k < allowed.length)) {
      store_1.set_cPort(port);
      return ports_1.complainLimits(i18n_1.trans_("notModify", [ k ]));
    }
    const key = allowed[k], p = store_1.restoreSettings_;
    if (store_1.settingsCache_[key] === request.v) {
      return;
    }
    p ? p.then(() => {
      settings_.set_(key, request.v);
    }) : settings_.set_(key, request.v);
    {
      // just a type assertion
      let obj = {
        key
      };
      console.log("updated from content scripts:", obj);
    }
  }, 
  /** kFgReq.findQuery: */ (request, port) => {
    const isObj = typeof request === "object", query = isObj ? request.q : "", index = isObj ? 1 : request;
    return tools_1.FindModeHistory_.query_(port.s.incognito_, query, index);
  }, 
  /** kFgReq.parseSearchUrl: */ (request, port) => {
    let search = parse_urls_1.parseSearchUrl_(request);
    if (request.i == null) {
      return search;
    }
    port.postMessage({
      N: 44 /* kBgReq.omni_parsed */ ,
      i: request.i,
      s: search
    });
  }, 
  /** kFgReq.parseUpperUrl: */ (request, port) => {
    const oldUrl = request.u, alwaysExec = request.e;
    const result = parse_urls_1.parseUpperUrl_(request);
    BgUtils_.resetRe_();
    request.e = result;
    if (result.p == null) {
      store_1.set_cPort(port);
      ports_1.showHUD(result.u);
    } else if (alwaysExec || oldUrl !== result.u) {
      !port || result.u.slice(0, 7).toLowerCase() === "file://" && oldUrl.slice(0, 7).toLowerCase() !== "file://" ? browser_1.tabsUpdate({
        url: result.u
      }) : run_commands_1.sendFgCmd(18 /* kFgCmd.framesGoBack */ , false, {
        r: 1,
        u: result.u
      });
    } else {
      store_1.set_cPort(port);
      ports_1.showHUD("Here is just root");
      request.e = {
        p: null,
        u: "(just root)"
      };
    }
  }, 
  /** kFgReq.searchAs: */ (request, port) => {
    let query, search = parse_urls_1.parseSearchUrl_(request);
    if (!search || !search.k) {
      store_1.set_cPort(port);
      ports_1.showHUD(i18n_1.trans_("noEngineFound"));
      request.n && run_commands_1.runNextCmdBy(0, request.n);
      return;
    }
    let o2 = request.o || open_urls_1.parseOpenPageUrlOptions(request.n), exOut = {};
    query = request.t.trim() && store_1.substitute_(request.t.trim(), 524288 /* SedContext.pageText */ , o2.s, exOut).trim() || (request.c ? store_1.paste_(o2.s, 0, exOut = {}) : "");
    Promise.resolve(query).then(query2 => {
      var _a;
      let err = query2 === null ? "It's not allowed to read clipboard" : (query2 = query2.trim()) ? "" : i18n_1.trans_("noSelOrCopied");
      if (err) {
        store_1.set_cPort(port);
        ports_1.showHUD(err);
        request.n && run_commands_1.runNextCmdBy(0, request.n);
        return;
      }
      o2.k = (_a = exOut.keyword_) !== null && _a !== void 0 ? _a : o2.k == null ? search.k : o2.k;
 // not change .testUrl, in case a user specifies it
            store_1.reqH_[8 /* kFgReq.openUrl */ ]({
        u: query2,
        o: o2,
        r: 0 /* ReuseType.current */ ,
        n: run_commands_1.parseFallbackOptions(request.n) || {}
      }, port);
    });
  }, 
  /** kFgReq.gotoSession: */ (request, port) => {
    const id = request.s, active = request.a !== 0, forceInCurWnd = request.a === 2, curWndId = store_1.curWndId_;
    store_1.set_cPort(ports_1.findCPort(port));
 // no port if on browser:// tab and called from omnibox
        if (typeof id === "number") {
      browser_1.selectTab(id, tab => {
        browser_1.runtimeError_() ? ports_1.showHUD(i18n_1.trans_("noTabItem")) : browser_1.selectWnd(tab);
        return browser_1.runtimeError_();
      });
      return;
    }
    if (!browser_1.browserSessions_()) {
      ports_1.complainNoSession();
      return;
    }
    const curTabId = port && port.s.tabId_ >= 0 ? port.s.tabId_ : store_1.curTabId_ >= 0 ? store_1.curTabId_ : null;
    const activeId = active ? null : curTabId;
    browser_1.browserSessions_().restore(id[1], res => {
      const err = browser_1.runtimeError_();
      err ? ports_1.showHUD(i18n_1.trans_("noSessionItem")) : tab_commands_1.onSessionRestored_(curWndId, res, activeId).then(newTab => {
        forceInCurWnd && curTabId && newTab && newTab.windowId !== curWndId && browser_1.tabsGet(curTabId, tab => {
          browser_1.Tabs_.move(newTab.id, {
            windowId: curWndId,
            index: tab ? tab.index + 1 : -1
          }, browser_1.runtimeError_);
          browser_1.tabsUpdate(newTab.id, {
            active: true
          });
        });
      });
      return err;
    });
    activeId && browser_1.selectTab(activeId, browser_1.runtimeError_);
  }, 
  /** kFgReq.openUrl: */ _AsReqH(open_urls_1.openUrlReq), 
  /** kFgReq.onFrameFocused: */ (_0, port) => {
    let status, tabId = port.s.tabId_, ref = store_1.framesForTab_.get(tabId);
    if (!ref) {
      store_1.needIcon_ && store_1.setIcon_(tabId, port.s.status_);
      return;
    }
    let last = ref.cur_;
    if (port === last) {
      return;
    }
    ref.cur_ = port;
    store_1.needIcon_ && (status = port.s.status_) !== last.s.status_ && store_1.setIcon_(tabId, status);
  }, 
  /** kFgReq.checkIfEnabled: */ (request, from_content) => {
    let port = from_content;
    if (!port) {
      port = ports_1.indexFrame(request.tabId, request.frameId);
      if (!port) {
        const ref = store_1.framesForTab_.get(request.tabId);
        ref && ref.flags_ & 512 /* Frames.Flags.ResReleased */ && (ref.flags_ |= 4096 /* Frames.Flags.UrlUpdated */);
        return;
      }
    }
    const {s: sender} = port, oldUrl = sender.url_, ref = store_1.framesForTab_.get(sender.tabId_);
    const url = sender.url_ = from_content ? request.u : request.url;
    if (ref && ref.lock_) {
      return;
    }
    const pattern = exclusions_1.exclusionListening_ ? exclusions_1.getExcluded_(url, sender) : null, status = pattern === null ? 0 /* Frames.Status.enabled */ : pattern ? 1 /* Frames.Status.partial */ : 2 /* Frames.Status.disabled */;
    if (sender.status_ !== status) {
      sender.status_ = status;
      store_1.needIcon_ && ref.cur_ === port && store_1.setIcon_(sender.tabId_, status);
    } else if (!pattern || pattern === exclusions_1.getExcluded_(oldUrl, sender)) {
      return;
    }
    port.postMessage({
      N: 1 /* kBgReq.reset */ ,
      p: pattern,
      f: 0
    });
  }, 
  /** kFgReq.nextFrame: */ (request, port) => {
    const type = request.t || 0 /* Frames.NextType.Default */;
    store_1.set_cPort(port);
    store_1.set_cRepeat(type || store_1.cRepeat > 0 ? 1 : -1);
    store_1.set_cKey(request.k);
    run_commands_1.replaceCmdOptions(request.f || {});
    let ref;
    type !== 2 /* Frames.NextType.current */ ? type === 1 /* Frames.NextType.parent */ ? frame_commands_1.parentFrame() : frame_commands_1.nextFrame() : (ref = ports_1.getFrames_(port)) ? frame_commands_1.focusFrame(ref.cur_, ref.ports_.length <= 2, request.o ? 1 /* FrameMaskType.onOmniHide */ : 2 /* FrameMaskType.NoMask */) : ports_1.safePost(port, {
      N: 45 /* kBgReq.omni_returnFocus */ ,
      l: store_1.cKey
    });
  }, 
  /** kFgReq.exitGrab: */ (_, port) => {
    const ref = ports_1.getFrames_(port);
    if (!ref) {
      return;
    }
    port.s.flags_ |= 4 /* Frames.Flags.userActed */;
    ref.flags_ |= 4 /* Frames.Flags.userActed */;
    if (ref.ports_.length < 2) {
      return;
    }
    const msg = {
      N: 8
 /* kBgReq.exitGrab */    };
    for (const p of ref.ports_) {
      const flags = p.s.flags_;
      p.s.flags_ |= 4 /* Frames.Flags.userActed */;
      flags & 4 /* Frames.Flags.userActed */ || p.postMessage(msg);
    }
  }, 
  /** kFgReq.execInChild: */ (request, port, msgId) => {
    const tabId = port.s.tabId_, ref = ports_1.getFrames_(port), url = request.u;
    if (!ref || ref.ports_.length < 2) {
      return false;
    }
    const childOrigin = url.startsWith("http") ? new URL(url).origin : null;
    let iport, iport2;
    for (const i of ref.ports_) {
      if (i !== ref.top_ && i !== port) {
        if (i.s.url_ === url && !(iport = iport ? 0 : i)) {
          break;
        }
        childOrigin && iport2 !== 0 && i.s.url_.startsWith("http") && new URL(i.s.url_).origin === childOrigin && (iport2 = iport2 ? 0 : i);
      }
    }
    iport = iport !== null && iport !== void 0 ? iport : iport2;
    if (iport && iport !== port) {
      store_1.set_cKey(request.k);
      focusAndExecute(request, port, iport, 1, 1);
      return true;
    }
    if (browser_1.browserWebNav_()) {
      browser_1.browserWebNav_().getAllFrames({
        tabId: port.s.tabId_
      }, frames => {
        let childId = 0, self = port.s.frameId_;
        for (const i1 of frames) {
          if (i1.parentFrameId === self) {
            if (childId) {
              childId = 0;
              break;
            }
            childId = i1.frameId;
          }
        }
        const port2 = childId && ports_1.indexFrame(tabId, childId);
        if (port2) {
          store_1.set_cKey(request.k);
          focusAndExecute(request, port, port2, 1, 1);
        }
      });
      return !!msgId && port;
    }
    return false;
  }, 
  /** kFgReq.initHelp: */ _AsReqH(frame_commands_1.initHelp), 
  /** kFgReq.css: */ (_0, port) => {
    const ref = ports_1.getFrames_(port);
    ref.flags_ |= 4 /* Frames.Flags.userActed */;
    port.s.flags_ |= 12 /* Frames.Flags.userActed */;
    port.postMessage({
      N: 11 /* kBgReq.showHUD */ ,
      H: store_1.innerCSS_
    });
  }, 
  /** kFgReq.vomnibar: */ (request, port) => {
    var _a;
    const {i: inner} = request;
    store_1.set_cKey(0 /* kKeyCode.None */);
 // it's only from LinkHints' task / Vomnibar reloading, so no Key to suppress
        if (request.u != null) {
      const {m, t} = request, isLinkJob = m >= 42 /* HintMode.min_link_job */ && m <= 64 /* HintMode.max_link_job */;
      let url = request.u, exOut = {};
      url = isLinkJob ? parse_urls_1.findUrlEndingWithPunctuation_(url, true) : url;
      url = store_1.substitute_(url, isLinkJob ? 1048576 /* SedContext.pageURL */ : 524288 /* SedContext.pageText */ , request.o && request.o.s, exOut);
      run_commands_1.replaceCmdOptions({
        url,
        newtab: t != null ? !!t : !isLinkJob,
        keyword: (_a = exOut.keyword_) !== null && _a !== void 0 ? _a : request.o.k
      });
      replaceForwardedOptions(request.f);
      store_1.set_cRepeat(1);
    } else {
      if (request.r !== 9) {
        return;
      }
      if (store_1.get_cOptions() == null || store_1.get_cOptions().k !== "omni") {
        if (inner) {
          return;
        }
        store_1.set_cOptions(BgUtils_.safeObj_());
        store_1.set_cRepeat(1);
      } else if (inner && store_1.get_cOptions().v === store_1.CONST_.VomnibarPageInner_) {
        return;
      }
    }
    store_1.set_cPort(port);
    frame_commands_1.showVomnibar(!!inner);
  }, 
  /** kFgReq.omni: */ (request, port) => {
    if (ports_1.isNotVomnibarPage(port, false)) {
      return;
    }
    store_1.Completion_.filter_(request.q, request, 
     onCompletions.bind(port, request.i | 0));
  }, 
  /** kFgReq.copy: */ (request, port) => {
    var _a;
    if (request.i != null) {
      const richText = (request.r || "") + "";
      const i0 = request.i, title = richText.includes("name") ? request.u : "";
      Promise.all([ /^data:/i.test(i0) ? Promise.resolve(i0) : BgUtils_.fetchOnlineResources_(i0 || request.u), null ]).then(([res, curTab]) => {
        const isStr = typeof res === "string", dataUrl = isStr ? res : res ? res[1] : "";
        store_1.set_cPort(port);
        let prefixLen = dataUrl.indexOf(",") + 1, contentType = dataUrl.slice(5, Math.max(5, prefixLen)).toLowerCase();
        const mime = contentType.split(";")[0];
        if (!res || mime.startsWith("text/")) {
          res ? ports_1.showHUD("", 74 /* kTip.notImg */) : ports_1.showHUD(i18n_1.trans_(res === 0 ? "downloadTimeout" : "downloadFail"));
          return;
        }
        let head = dataUrl.slice(prefixLen, prefixLen + 24);
        head = contentType.includes("base64") ? BgUtils_.DecodeURLPart_(head, "atob") : head.slice(0, 16);
        const tag = head.startsWith("\x89PNG") ? "PNG" : head.startsWith("\xff\xd8\xff") ? "JPEG" : /^GIF8[79]a/.test(head) ? "GIF" : /^ftypavi[fs]/.test(head.slice(4)) ? "AVIF" : /^\xff\xd8\xff(\xdb|\xe0|\xee|\xe1[^][^]Exif\0\0)/.test(head) ? "JPEG" : head.slice(8, 12) === "WEBP" ? "WebP" : (mime.split("/")[1] || "").toUpperCase() || mime;
        const text = title && /^(http|ftp|file)/i.test(title) ? title : "";
        const wantSafe = richText.includes("safe") && tag !== "GIF" || richText.includes("force");
        frame_commands_1.handleImageUrl(dataUrl, isStr ? null : res[0], wantSafe && tag !== "PNG" ? 9 /* kTeeTask.DrawAndCopy */ : 1 /* kTeeTask.CopyImage */ , ok => {
          ports_1.showHUD(i18n_1.trans_(ok ? "imgCopied" : "failCopyingImg", [ ok === 1 ? "HTML" : wantSafe ? "PNG" : tag ]));
        }, title, text, null, false);
        BgUtils_.resetRe_();
      });
      return;
    }
    const oriOptions = request.n;
    const opts2 = request.o || oriOptions && open_urls_1.parseOpenPageUrlOptions(oriOptions) || {};
    const isInOpenAndCopy = !!(oriOptions && oriOptions.copy && oriOptions.o);
    const rawStr = request.s;
    const mode1 = rawStr != null && request.m || 0 /* HintMode.DEFAULT */;
    const sed = isInOpenAndCopy ? null : opts2.s, keyword = isInOpenAndCopy ? null : opts2.k;
    const correctUrl = mode1 >= 42 /* HintMode.min_link_job */ && mode1 <= 64 /* HintMode.max_link_job */ && (!sed || sed.r !== false);
    if (!rawStr && oriOptions && !(oriOptions.type === "frame" || request.u && !port.s.frameId_ && "tab-url tab".includes(oriOptions.type || ""))) {
      const type = oriOptions.type;
      const opts = run_commands_1.concatOptions(oriOptions, BgUtils_.safer_({
        url: null,
        type: type === "tab" && oriOptions.url || type === "tab-url" ? null : type === "tab-title" ? "title" : type
      }));
      const topPort = ports_1.getFrames_(port).top_;
      port = !topPort || topPort.s.flags_ & 512 /* Frames.Flags.ResReleased */ ? port : topPort;
      store_1.set_cEnv(null);
      run_commands_1.executeCommand(key_mappings_1.makeCommand_("copyCurrentUrl", opts), 1, store_1.cKey, port, 1, oriOptions.$f && {
        c: oriOptions.$f,
        r: oriOptions.$retry,
        u: 0,
        w: 0
      });
      return;
    }
    let str = request.u || rawStr || "";
    const decode = !rawStr && (request.d ? opts2.d !== false : !!opts2.d);
    const rawTrim = (_a = request.t) !== null && _a !== void 0 ? _a : oriOptions === null || oriOptions === void 0 ? void 0 : oriOptions.trim;
    if (rawTrim) {
      const trim = rawTrim === "start" || rawTrim === "left" ? i => i.trimLeft() : rawTrim === "end" || rawTrim === "right" ? i => i.trimRight() : i => i.trim();
      if (typeof str === "string") {
        str = trim(str);
      } else {
        for (let i = str.length; 0 <= --i; ) {
          str[i] = trim(str[i] + "");
        }
      }
    }
    if (decode) {
      if (typeof str !== "string") {
        for (let i = str.length; 0 <= --i; ) {
          correctUrl && (str[i] = parse_urls_1.findUrlEndingWithPunctuation_(str[i] + ""));
          str[i] = BgUtils_.decodeUrlForCopy_(str[i] + "");
        }
      } else {
        correctUrl && (str = parse_urls_1.findUrlEndingWithPunctuation_(str));
        str = BgUtils_.decodeUrlForCopy_(str);
      }
    } else {
      typeof str === "string" && (str = str.length < 4 && !str.trim() && (str[0] === " " || "\n\n\n".includes(str)) ? "" : str);
    }
    let hasStr = !!str, str2 = str && store_1.copy_(str, request.j, sed, keyword, rawTrim === false);
    str2 = rawStr && typeof rawStr === "object" ? `[${rawStr.length}] ` + rawStr.slice(-1)[0] : str2;
    Promise.resolve(str2).then(str3 => {
      const encodeHex = s => {
        s = JSON.stringify(s).slice(1, -1);
        return s.trim() ? s : s < "\xff" ? "\\x" + (s.charCodeAt(0) + 256).toString(16).slice(1) : BgUtils_.encodeUnicode_(s);
      };
      store_1.set_cPort(port);
      oriOptions && run_commands_1.runNextCmdBy(hasStr ? 1 : 0, oriOptions) || ports_1.showHUD(decode ? str3.replace(/%[0-7][\dA-Fa-f]/g, decodeURIComponent) : str3.replace(str3.trim() ? /[^\S ]/g : /[^]/g, encodeHex), request.u ? 14 /* kTip.noUrlCopied */ : 15 /* kTip.noTextCopied */);
    });
  }, 
  /** kFgReq.key: */ (request, port) => {
    const sender = port != null ? port.s : null;
    if (sender !== null && !(sender.flags_ & 4 /* Frames.Flags.userActed */)) {
      sender.flags_ |= 4 /* Frames.Flags.userActed */;
      const ref = ports_1.getFrames_(port);
      ref && (ref.flags_ |= 4 /* Frames.Flags.userActed */);
    }
    let key = request.k, count = 1, arr = /^\d+|^-\d*/.exec(key);
    if (arr != null) {
      let prefix = arr[0];
      key = key.slice(prefix.length);
      count = prefix !== "-" ? parseInt(prefix, 10) || 1 : -1;
    } else {
      key.length > 6 && key.startsWith(`<c-v-${key[5]}>`) && (key = key[5] + key.slice(7));
    }
    let registryEntry = store_1.keyToCommandMap_.get(key);
    if (!registryEntry) {
      arr = key.match(key_mappings_1.keyRe_);
      key = arr[arr.length - 1];
      count = 1;
      registryEntry = store_1.keyToCommandMap_.get(key);
    }
    BgUtils_.resetRe_();
    if (registryEntry) {
      registryEntry.alias_ === 38 /* kBgCmd.runKey */ && registryEntry.background_ && store_1.inlineRunKey_(registryEntry);
      // Side panel needs a Chrome user gesture — open synchronously (no import/await hop).
            if (registryEntry.alias_ === 53 /* kBgCmd.openSidePanel */ && registryEntry.background_ && port) {
        const tabId = port.s.tabId_;
        const ok = side_panel_1.openSidePanelImmediate_(tabId >= 0 ? tabId : void 0, store_1.curWndId_ >= 0 ? store_1.curWndId_ : void 0);
        ok || side_panel_1.openSidePanelBestEffort_(null).then(opened => {
          opened || side_panel_1.explainSidePanelGesture_();
        });
        return;
      }
      request.e && store_1.set_cEnv({
        element: BgUtils_.normalizeElDesc_(request.e)
      });
      run_commands_1.executeCommand(registryEntry, count, request.l, port, 0, null);
    }
  }, 
  /** kFgReq.nextKey: */ _AsReqH(run_commands_1.waitAndRunKeyReq), 
  /** kFgReq.marks: */ (request, urlPort) => {
    if (request.c === 2 /* kMarkAction.clear */) {
      const removed = tools_1.Marks_.clear_(request.u);
      request.f && run_commands_1.runNextCmdBy(removed > 0 ? 1 : 0, request.f);
      return;
    }
    const forced = !!request.f;
    const exOpts = request.c.o;
    forced || store_1.set_cPort(urlPort);
    const p = !forced && frame_commands_1.findContentPort_(urlPort, exOpts.type, request.l) || urlPort;
    Promise.resolve(p).then(upperPort => {
      if (!forced && (upperPort !== urlPort || !request.u)) {
        const req2 = request;
        req2.U = (exOpts.extUrl ? 1 : 0) | (request.c.a ? 2 : 0);
        req2.f = true;
        ports_1.requireURL_(req2, true, 1, upperPort);
        return;
      }
      if (request.c.a === 1 /* kMarkAction.create */) {
        tools_1.Marks_.set_(request, urlPort.s.incognito_, urlPort.s.tabId_);
        ports_1.showHUDEx(urlPort, "mNormalMarkTask", 1, [ [ "mCreate" ], [ request.l ? "Local" : "Global" ], request.n ]);
        run_commands_1.runNextCmdBy(1, exOpts);
      } else {
        tools_1.Marks_.goToMark_(exOpts, request, urlPort, request.l && forced ? request.k : 0);
      }
    });
  }, 
  /** kFgReq.focusOrLaunch: */ _AsReqH(open_urls_1.focusOrLaunch_), 
  /** kFgReq.beforeCmd: */ _AsReqH(run_commands_1.onBeforeConfirm), 
  /** kFgReq.cmd: */ _AsReqH(run_commands_1.onConfirmResponse), 
  /** kFgReq.removeSug: */ (req, port) => {
    var _a;
    if (req.t === "e") {
      ports_1.showHUD(i18n_1.trans_("cannotDelSug"));
      return;
    }
    const {t: rawType, s: sId, u: url} = req;
    const type = rawType === "history" && sId != null ? "session" : rawType;
    const name = type === "tab" ? type : type + " item";
    const cb = succeed => {
      Promise.resolve(i18n_1.trans_("sugs")).then(sugs => {
        ports_1.showHUD(i18n_1.trans_(succeed ? "delSug" : "notDelSug", [ sugs && i18n_1.transPart_(sugs, type[0]) || name ]));
      });
    };
    store_1.set_cPort(ports_1.findCPort(port));
    if (type === "tab" && store_1.curTabId_ === sId) {
      ports_1.showHUD(i18n_1.trans_("notRemoveCur"));
    } else if (type !== "session") {
      store_1.Completion_.removeSug_(type === "tab" ? sId : url, type, cb);
    } else if ((_a = browser_1.browserSessions_()) === null || _a === void 0 ? void 0 : _a.forgetClosedTab) {
      const sessionId = sId;
      browser_1.browserSessions_().forgetClosedTab(sessionId[0], sessionId[1]).then(() => 1, store_1.blank_).then(cb);
    }
  }, 
  /** kFgReq.openImage: */ _AsReqH(frame_commands_1.openImgReq), 
  /** kFgReq.evalJSFallback" */ (req, port) => {
    store_1.set_cPort(null);
    open_urls_1.openJSUrl(req.u, {}, () => {
      store_1.set_cPort(port);
      ports_1.showHUD(i18n_1.trans_("jsFail"));
    });
  }, 
  /** kFgReq.gotoMainFrame: */ (req, port) => {
    var _a;
    if (req.c === 2 /* kFgCmd.linkHints */ || req.c === 4 /* kFgCmd.scroll */) {
      ports_1.getParentFrame(port.s.tabId_, port.s.frameId_, 1).then(port2 => {
        var _a;
        focusAndExecute(req, port, port2 || ((_a = ports_1.getFrames_(port)) === null || _a === void 0 ? void 0 : _a.top_) || null, req.f);
      });
      return;
    }
    // Now that content scripts always auto-reconnect, it's not needed to find a parent frame.
        focusAndExecute(req, port, ((_a = ports_1.getFrames_(port)) === null || _a === void 0 ? void 0 : _a.top_) || null, req.f);
  }, 
  /** kFgReq.omniToggleMedia: */ (req, omni_port) => {
    if (req.t) {
      run_commands_1.overrideCmdOptions({
        enable: req.v,
        forced: true
      });
      store_1.bgC_[46 /* kBgCmd.toggleVomnibarStyle */ ](null, store_1.blank_);
    } else {
      ui_css_1.setMediaState_(1 /* MediaNS.kName.PrefersColorScheme */ , req.v, req.b ? 2 : 9, omni_port);
    }
  }, 
  /** kFgReq.findFromVisual: */ (req, port) => {
    run_commands_1.replaceCmdOptions({
      active: true,
      returnToViewport: true,
      extend: !!(req.c & 1),
      direction: req.c >= 56 /* VisualAction.EmbeddedFindModeToPrev */ ? "before" : null
    });
    store_1.set_cPort(port), store_1.set_cRepeat(1);
    frame_commands_1.performFind();
  }, 
  /** kFgReq.framesGoBack: */ _AsReqH(frame_commands_1.framesGoBack), 
  /** kFgReq.i18n: */ () => {
    i18n_1.loadContentI18n_ && i18n_1.loadContentI18n_();
    return i18n_1.contentI18n_;
  }, 
  /** kFgReq.cssLearnt: */ (_req, port) => {
    port.s.flags_ |= 8 /* Frames.Flags.hasCSS */;
  }, 
  /** kFgReq.visualMode: */ (request, port) => {
    const isCaret = !!request.c;
    run_commands_1.replaceCmdOptions({
      mode: isCaret ? "caret" : "",
      start: true
    });
    replaceForwardedOptions(request.f);
    store_1.set_cPort(port), store_1.set_cRepeat(1);
    frame_commands_1.enterVisualMode();
  }, 
  /** kFgReq.respondForRunAs: */ request => {
    if (performance.now() - request.r.n < 500) {
      const info = request.r.c;
      info.element = BgUtils_.normalizeElDesc_(request.e);
      run_keys_1.runKeyWithCond(info);
    }
  }, 
  /** kFgReq.downloadLink: */ (req, port) => {
    var _a;
    const o2 = req.o || {}, exOut = {};
    let url = store_1.substitute_(parse_urls_1.findUrlEndingWithPunctuation_(req.u, true), 1048576 /* SedContext.pageURL */ , o2.s, exOut);
    const keyword = (_a = exOut.keyword_) !== null && _a !== void 0 ? _a : o2.k;
    url = url !== req.u || keyword ? normalize_urls_1.convertToUrl_(url, keyword, 0 /* Urls.WorkType.Default */) : url;
    store_1.set_cPort(port);
    ports_1.showHUD(url, 78 /* kTip.downloaded */);
    browser_1.downloadFile(url, req.f, req.r || "").then(req.m < 44 /* HintMode.DOWNLOAD_LINK */ ? succeed => {
      succeed || store_1.reqH_[26 /* kFgReq.openImage */ ]({
        m: 37 /* HintMode.OPEN_IMAGE */ ,
        f: req.f,
        u: url
      }, port);
    } : void 0);
  }, 
  /** kFgReq.wait: */ (req, port, msgId) => {
    if (req === 0) {
      return 9 /* TimerType.fake */;
    }
    setTimeout(() => {
      ports_1.sendResponse(port, msgId, 9 /* TimerType.fake */);
    }, req);
    return port;
  }, 
  /** kFgReq.optionToggled: */ ({k: key, v: val}) => {
    const notBool = val !== !!val;
    ports_1.showHUD(i18n_1.trans_(notBool ? "useVal" : val ? "turnOn" : "turnOff", [ key, notBool ? JSON.stringify(val) : "" ]));
  }, 
  /** kFgReq.keyFromOmni: */ (req, port) => {
    store_1.reqH_[19 /* kFgReq.key */ ](req, ports_1.findCPort(port));
  }, 
  /** kFgReq.pages: */ (req, port, msgId) => {
    if (port.s !== false && !port.s.url_.startsWith(store_1.Origin2_)) {
      return false;
    }
    onPagesReq(req.q, req.i, port).then(res => {
      port.postMessage(msgId ? {
        N: 4 /* kBgReq.msg */ ,
        m: msgId,
        r: res
      } : res);
    });
    return port;
  }, 
  /** kFgReq.showUrl: */ (req, port) => {
    let text = req.u, n = text.indexOf("://");
    text = n > 0 ? text.slice(text.indexOf("/", n + 4) + 1) : text;
    text = text.length > 40 ? text.slice(0, 39) + "\u2026" : text;
    store_1.set_cPort(port);
    ports_1.showHUD(text, 78 /* kTip.downloaded */);
  }, 
  /** kFgReq.omniCopy: */ (req, port) => {
    const title = req.t, url = BgUtils_.decodeUrlForCopy_(req.u);
    let join = title && url ? (store_1.vomnibarBgOptions_.actions.find(i => i.startsWith("itemJoin=")) || "").slice(9) : "";
    join = join ? join.includes("\\") ? BgUtils_.tryParse(join[0] === '"' ? join : `"${join}"`) : BgUtils_.DecodeURLPart_(join) : "\n";
    store_1.reqH_[18 /* kFgReq.copy */ ]({
      s: title && url ? title + join + url : url || title,
      d: false,
      m: 0
 /* HintMode.DEFAULT */    }, ports_1.findCPort(port));
  }, 
  /** kFgReq.omniCopy: */ (req, port) => {
    store_1.set_cPort(ports_1.findCPort(port));
    ports_1.showHUD(req.t, 15 /* kTip.noTextCopied */);
  }, 
  /** kFgReq.didLocalMarkTask: */ (req, port) => {
    ports_1.showHUDEx(port, "mLocalMarkTask", 1, [ [ req.n ? "mCreate" : "mJumpTo" ], req.i > 1 ? req.i : [ "mLastMark" ] ]);
    store_1.set_cPort(port);
    run_commands_1.runNextCmdBy(1, req.c.o);
  }, 
  /** kFgReq.recheckTee: */ () => {
    const taskOnce = store_1.replaceTeeTask_(null, null);
    if (taskOnce) {
      clearTimeout(taskOnce.i);
      taskOnce.r && taskOnce.r(false);
    }
    return !taskOnce;
  }, 
  /** kFgReq.afterTee: */ (req, port) => {
    const otherPort = req > 0 && ports_1.indexFrame(port.s.tabId_, req);
    if (otherPort) {
      frame_commands_1.focusFrame(otherPort, false, 2 /* FrameMaskType.NoMask */ , 1);
      return 2 /* FrameMaskType.NoMask */;
    }
    req <= 0 && store_1.reqH_[45 /* kFgReq.recheckTee */ ]();
    return req ? 4 /* FrameMaskType.NormalNext */ : 2 /* FrameMaskType.NoMask */;
  }, 
  /** kFgReq._deleted1: */ () => {}, 
  /** kFgReq.syncStatus: */ (req, port) => {
    const [locked, isPassKeysReversed, passKeys] = req.s;
    const newPassKeys = passKeys && (isPassKeysReversed ? "^ " : "") + passKeys.join(" ");
    const resetMsg = {
      N: 1 /* kBgReq.reset */ ,
      p: newPassKeys,
      f: locked
    };
    port.postMessage(resetMsg);
    const ref = ports_1.getFrames_(port);
    const status = locked === 3 /* Frames.Flags.lockedAndDisabled */ ? 2 /* Frames.Status.disabled */ : 0 /* Frames.Status.enabled */;
    if (!ref || ref.lock_ && ref.lock_.status_ === status && ref.lock_.passKeys_ === newPassKeys) {
      return;
    }
    ref.lock_ = {
      status_: status,
      passKeys_: newPassKeys
    };
    store_1.needIcon_ && ref.cur_.s.status_ !== status && store_1.setIcon_(port.s.tabId_, status);
    for (const port of ref.ports_) {
      port.s.status_ = status;
      port.s.flags_ & 512 /* Frames.Flags.ResReleased */ || port.postMessage(resetMsg);
    }
  }, 
  /** kFgReq.focusCurTab: */ (_req, port) => {
    let tabId = port.s.tabId_, tick = 0, timer = setInterval(() => {
      const ref = store_1.framesForTab_.get(tabId);
      if (tabId !== store_1.curTabId_ && ref) {
        clearInterval(timer);
        (ref.ports_.includes(port) || port.s.flags_ & 512 /* Frames.Flags.ResReleased */) && browser_1.selectTab(tabId, browser_1.selectWndIfNeed);
      } else {
        (++tick >= 12 || !ref) && clearInterval(timer);
      }
    }, 17);
  } ]);
  const onCompletions = function(favIcon0, list, autoSelect, matchType, sugTypes, total, realMode, queryComponents) {
    let favIcon = favIcon0 === 2 ? 2 : 0;
    ports_1.safePost(this, {
      N: 43 /* kBgReq.omni_omni */ ,
      a: autoSelect,
      c: queryComponents,
      i: favIcon,
      l: list,
      m: matchType,
      r: realMode,
      s: sugTypes,
      t: total
    });
    BgUtils_.resetRe_();
  };
  store_1.set_focusAndExecuteOn_((targetPort, cmd, options, count, focusAndShowFrameBorder) => {
    targetPort.postMessage({
      N: 7 /* kBgReq.focusFrame */ ,
      H: focusAndShowFrameBorder || cmd !== 4 /* kFgCmd.scroll */ ? ports_1.ensureInnerCSS(targetPort.s) : null,
      m: focusAndShowFrameBorder ? 5 /* FrameMaskType.ForcedSelf */ : 0 /* FrameMaskType.NoMaskAndNoFocus */ ,
      k: focusAndShowFrameBorder ? store_1.cKey : 0 /* kKeyCode.None */ ,
      f: {},
      c: cmd,
      n: count || 0,
      a: options
    });
  });
  const focusAndExecute = (req, port, targetPort, focusAndShowFrameBorder, ignoreStatus) => {
    if (targetPort && (ignoreStatus || targetPort.s.status_ !== 2 /* Frames.Status.disabled */)) {
      store_1.focusAndExecuteOn_(targetPort, req.c, req.a, req.n, focusAndShowFrameBorder);
    } else {
      req.a.$forced = 1;
      run_commands_1.portSendFgCmd(port, req.c, false, req.a, req.n || 0);
    }
  };
  const replaceForwardedOptions = toForward => {
    if (!toForward) {
      return;
    }
    typeof toForward === "string" && (toForward = run_keys_1.parseEmbeddedOptions(toForward));
    toForward && typeof toForward === "object" && Object.assign(store_1.get_cOptions(), BgUtils_.safer_(toForward));
  };
  const onPagesReq = (req, id, port) => {
    _pageHandlers || (_pageHandlers = settings_.ready_.then(() => browser_1.import2("/background/page_handlers.js")));
    return _pageHandlers.then(module => Promise.all(req.map(i => module.onReq(i, port)))).then(answers => ({
      i: id,
      a: answers.map(i => i !== void 0 ? i : null)
    }));
  };
});
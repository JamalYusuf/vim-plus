"use strict";
__filename = "background/frame_commands.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./ports", "./exclusions", "./i18n", "./key_mappings", "./run_commands", "./open_urls", "./tools" ], (require, exports, store_1, BgUtils_, browser_1, normalize_urls_1, ports_1, exclusions_1, i18n_1, key_mappings_1, run_commands_1, open_urls_1, tools_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.blurInsertOnTabChange = exports.getBlurOption_ = exports.focusFrame = exports.framesGoNext = exports.toggleZoom = exports.mainFrame = exports.framesGoBack = exports.openImgReq = exports.captureTab = exports.handleImageUrl = exports.enterVisualMode = exports.marksActivate_ = exports.findContentPort_ = exports.showVomnibar = exports.initHelp = exports.performFind = exports.parentFrame = exports.nextFrame = void 0;
  BgUtils_ = __importStar(BgUtils_);
  const DEBUG_OFFSCREEN = false;
  let _lastOffscreenWndId = 0;
  let _offscreenFailed = false;
  let _offscreenLoading = false;
  store_1.set_runOnTee_((task, serializable) => {
    var _a;
    if (task === 3 /* kTeeTask.Paste */ && serializable >= 0) {
      return navigator.permissions.query({
        name: "clipboard-read"
      }).catch(store_1.blank_).then(res => !!res && res.state !== "denied" && store_1.runOnTee_(3 /* kTeeTask.Paste */ , -1 - serializable, null));
    }
    const useOffscreen = !_offscreenFailed && task !== 1 /* kTeeTask.CopyImage */ && task !== 9 /* kTeeTask.DrawAndCopy */;
    const frames = useOffscreen ? null : store_1.framesForTab_.get(store_1.curTabId_) || store_1.cPort && ports_1.getCurFrames_();
    let port = useOffscreen ? null : frames ? frames.cur_ : store_1.cPort;
    !frames || !frames.top_ || port === frames.top_ || frames.top_.s.flags_ & 512 || BgUtils_.protocolRe_.test(frames.top_.s.url_) && !(port.s.flags_ & 512 /* Frames.Flags.ResReleased */) && port.s.url_.startsWith((((_a = BgUtils_.safeParseURL_(frames.top_.s.url_)) === null || _a === void 0 ? void 0 : _a.origin) || "") + "/") || (port = frames.top_);
    const id = setTimeout(() => {
      const latest = store_1.replaceTeeTask_(id, null);
      latest && latest.r && latest.r(false);
    }, 4e4);
    const deferred = BgUtils_.deferPromise_();
    store_1.replaceTeeTask_(null, {
      i: id,
      t: task,
      s: serializable,
      d: null,
      r: deferred.resolve_
    });
    if (useOffscreen) {
      if (store_1.offscreenPort_) {
        try {
          DEBUG_OFFSCREEN ? browser_1.Windows_.update(_lastOffscreenWndId, {
            focused: true
          }, () => {
            ports_1.postTeeTask_(store_1.offscreenPort_, store_1.teeTask_);
          }) : ports_1.postTeeTask_(store_1.offscreenPort_, store_1.teeTask_);
        } catch (_b) {
          ports_1.resetOffscreenPort_();
        }
      }
      if (store_1.offscreenPort_) {} else if (DEBUG_OFFSCREEN) {
        browser_1.Windows_.create({
          url: store_1.CONST_.OffscreenFrame_
        }, wnd => {
          _lastOffscreenWndId = wnd.id;
        });
      } else if (!_offscreenLoading) {
        const all_reasons = browser_1.browser_.offscreen.Reason;
        const reasons = [ all_reasons.BLOBS, all_reasons.CLIPBOARD, all_reasons.MATCH_MEDIA ].filter(i => !!i);
        _offscreenLoading = true;
        browser_1.browser_.offscreen.createDocument({
          reasons: reasons.length > 0 ? reasons : [ "CLIPBOARD" ],
          url: store_1.CONST_.OffscreenFrame_,
          justification: "read and write system clipboard"
        }, () => {
          const err = browser_1.runtimeError_();
          _offscreenLoading = false;
          if (err) {
            _offscreenFailed = true;
            ports_1.resetOffscreenPort_();
            return err;
          }
        });
      }
    } else if (port) {
      const allow = task === 1 /* kTeeTask.CopyImage */ || task === 5 /* kTeeTask.Copy */ || task === 9 /* kTeeTask.DrawAndCopy */ || task === 3 /* kTeeTask.Paste */ ? "clipboard-write; clipboard-read" : "";
      run_commands_1.portSendFgCmd(port, 0 /* kFgCmd.callTee */ , 1, {
        u: store_1.CONST_.TeeFrame_,
        c: "R TEE UI",
        a: allow,
        t: 3e3,
        i: !frames || port === frames.cur_ || frames.cur_.s.flags_ & 512 /* Frames.Flags.ResReleased */ ? 0 : frames.cur_.s.frameId_
      }, 1);
    } else {
      let promise = deferred.promise_;
      browser_1.getCurWnd(false, curWnd => {
        const lastWndId = curWnd ? curWnd.id : store_1.curWndId_;
        browser_1.makeWindow({
          type: "popup",
          url: store_1.CONST_.TeeFrame_,
          focused: true,
          incognito: false,
          left: 0,
          top: 0,
          width: 100,
          height: 32
        }, "", wnd => {
          const teeTask = wnd ? null : store_1.replaceTeeTask_(null, null);
          if (wnd) {
            const newWndId = wnd.id;
            promise.then(() => {
              lastWndId !== store_1.curWndId_ && browser_1.Windows_.update(lastWndId, {
                focused: true
              }, browser_1.runtimeError_);
              browser_1.Windows_.remove(newWndId, browser_1.runtimeError_);
            });
            promise = null;
          } else if (teeTask && teeTask.i === id) {
            clearTimeout(teeTask.i);
            teeTask.r && teeTask.r(false);
          }
        });
      });
    }
    return deferred.promise_;
  });
  const nextFrame = () => {
    let port = store_1.cPort, ind = -1;
    const ref = ports_1.getCurFrames_(), ports = ref && ref.ports_;
    if (ports && ports.length > 1) {
      ind = ports.indexOf(port);
      for (let count = Math.abs(store_1.cRepeat); count > 0; count--) {
        ind += store_1.cRepeat > 0 ? 1 : -1;
        ind === ports.length ? ind = 0 : ind < 0 && (ind = ports.length - 1);
      }
      port = ports[ind];
    }
    exports.focusFrame(port, port.s.frameId_ === 0, port !== store_1.cPort && ref && port !== ref.cur_ ? 4 /* FrameMaskType.NormalNext */ : 3 /* FrameMaskType.OnlySelf */);
  };
  exports.nextFrame = nextFrame;
  const parentFrame = () => {
    const sender = store_1.cPort.s, msg = sender.tabId_ >= 0 && ports_1.getFrames_(store_1.cPort) ? null : "Vim+ can not access frames in current tab";
    msg && ports_1.showHUD(msg);
    ports_1.getParentFrame(sender.tabId_, sender.frameId_, store_1.cRepeat).then(port => {
      port ? exports.focusFrame(port, true, 5 /* FrameMaskType.ForcedSelf */) : exports.mainFrame();
    });
  };
  exports.parentFrame = parentFrame;
  const performFind = () => {
    const sender = store_1.cPort.s, absRepeat = store_1.cRepeat < 0 ? -store_1.cRepeat : store_1.cRepeat, rawIndex = store_1.get_cOptions().index, nth = rawIndex ? rawIndex === "other" ? absRepeat + 1 : rawIndex === "count" ? absRepeat : rawIndex >= 0 ? -1 - (0 | rawIndex) : 0 : 0, highlight = store_1.get_cOptions().highlight, extend = store_1.get_cOptions().extend, direction = extend === "before" || store_1.get_cOptions().direction === "before" ? -1 : 1, rawSelected = !nth && absRepeat < 2 ? store_1.get_cOptions().selected : null, leave = !!nth || !store_1.get_cOptions().active;
    let sentFindCSS = null;
    if (!(sender.flags_ & 32 /* Frames.Flags.hasFindCSS */)) {
      sender.flags_ |= 32 /* Frames.Flags.hasFindCSS */;
      sentFindCSS = browser_1.getFindCSS_cr_(sender);
    }
    run_commands_1.sendFgCmd(1 /* kFgCmd.findMode */ , true, run_commands_1.wrapFallbackOptions({
      c: nth > 0 ? store_1.cRepeat / absRepeat : store_1.cRepeat,
      l: leave ? 1 : 0,
      f: sentFindCSS,
      d: direction,
      m: typeof highlight === "number" ? highlight >= 1 ? Math.min(highlight | 0, 200) : 0 : highlight ? leave ? 100 : 20 : 0,
      n: !!store_1.get_cOptions().normalize,
      r: store_1.get_cOptions().returnToViewport === true,
      s: rawSelected == null ? 0 : typeof rawSelected !== "string" ? typeof rawSelected === "number" ? Math.max(0, rawSelected | 0) : 5 : (rawSelected.includes("auto") || rawSelected.includes("fallback") ? 0 : 4) | (rawSelected.includes("any") ? 2 : 1),
      t: extend ? direction > 0 ? 2 : 1 : 0,
      p: !!store_1.get_cOptions().postOnEsc,
      e: !!store_1.get_cOptions().restart,
      u: !!store_1.get_cOptions().scroll && store_1.get_cOptions().scroll !== "auto",
      q: store_1.get_cOptions().query ? store_1.get_cOptions().query + "" : leave || store_1.get_cOptions().last ? tools_1.FindModeHistory_.query_(sender.incognito_, "", nth < 0 ? -nth : nth) : ""
    }));
  };
  exports.performFind = performFind;
  const initHelp = (request, port) => run_commands_1.initHelpDialog().then(helpDialog => {
    var _a;
    if (!helpDialog) {
      return;
    }
    const port2 = request.w && ((_a = ports_1.getFrames_(port)) === null || _a === void 0 ? void 0 : _a.top_) || port, isOptionsPage = port2.s.url_.startsWith(store_1.CONST_.OptionsPage_);
    let options = request.a || {};
    port2.s.flags_ |= 262144 /* Frames.Flags.hadHelpDialog */;
    store_1.set_cPort(port2);
    if (request.f) {
      let cmdRegistry = store_1.keyToCommandMap_.get("?");
      let matched = cmdRegistry && cmdRegistry.alias_ === 8 /* kBgCmd.showHelp */ && cmdRegistry.background_ ? "?" : "";
      matched || store_1.keyToCommandMap_.forEach((item, key) => {
        item.alias_ === 8 /* kBgCmd.showHelp */ && item.background_ && (matched = matched && matched.length < key.length ? matched : (cmdRegistry = item, 
        key));
      });
      options = matched && key_mappings_1.normalizedOptions_(cmdRegistry) || options;
    }
    run_commands_1.sendFgCmd(17 /* kFgCmd.showHelpDialog */ , true, {
      h: helpDialog.render_(isOptionsPage, options.commandNames),
      o: store_1.CONST_.OptionsPage_,
      f: request.f,
      e: !!options.exitOnClick,
      c: isOptionsPage && !!key_mappings_1.keyMappingErrors_ || store_1.settingsCache_.showAdvancedCommands
    });
  });
  exports.initHelp = initHelp;
  const showVomnibar = forceInner => {
    var _a;
    let port = store_1.cPort;
    let optUrl = store_1.get_cOptions().url;
    let optQuery = store_1.get_cOptions().query;
    if (optQuery != null) {
      optUrl = optQuery;
      optQuery = null;
      store_1.get_cOptions().url = optUrl;
      delete store_1.get_cOptions().query;
    }
    if (optUrl != null && optUrl !== true && typeof optUrl !== "string") {
      optUrl = null;
      delete store_1.get_cOptions().url;
    }
    if (!port) {
      port = ((_a = ports_1.getCurFrames_()) === null || _a === void 0 ? void 0 : _a.top_) || null;
      if (!port) {
        return;
      }
      store_1.set_cPort(port);
      // not go to the top frame here, so that a current frame can suppress keys for a while
        }
    let defaultUrl = null;
    if (optUrl != null && store_1.get_cOptions().urlSedKeys) {
      const res = typeof optUrl === "string" ? optUrl : typeof store_1.get_cOptions().u === "string" ? store_1.get_cOptions().u : ports_1.getPortUrl_();
      if (res && res instanceof Promise) {
        res.then(url => {
          run_commands_1.overrideCmdOptions({
            u: url || ""
          }, true);
          exports.showVomnibar(forceInner);
        });
        return;
      }
      const exOut = {};
      defaultUrl = store_1.substitute_(res, 0 /* SedContext.NONE */ , {
        r: null,
        k: store_1.get_cOptions().urlSedKeys
      }, exOut);
      exOut.keyword_ != null && run_commands_1.overrideCmdOptions({
        keyword: exOut.keyword_
      });
    }
    store_1.get_cOptions().mode === "bookmark" && run_commands_1.overrideOption("mode", "bookm");
    const page = store_1.vomnibarPage_f, {url_: url} = port.s, preferWeb = !page.startsWith(store_1.CONST_.BrowserProtocol_), isCurOnExt = url.startsWith(store_1.CONST_.BrowserProtocol_), inner = forceInner || !page.startsWith(store_1.Origin2_) ? store_1.CONST_.VomnibarPageInner_ : page;
    forceInner = forceInner || (preferWeb ? isCurOnExt || page.startsWith("file:") && !url.startsWith("file:///") || page.startsWith("http:") && !/^http:/.test(url) && !/^http:\/\/localhost[:/]/i.test(page) : port.s.incognito_ || isCurOnExt && !page.startsWith(url.slice(0, url.indexOf("/", url.indexOf("://") + 3) + 1)));
    const useInner = forceInner || page === inner || port.s.tabId_ < 0, _trailingSlash0 = store_1.get_cOptions().trailingSlash, _trailingSlash1 = store_1.get_cOptions().trailing_slash, trailingSlash = _trailingSlash0 != null ? !!_trailingSlash0 : _trailingSlash1 != null ? !!_trailingSlash1 : null, options = run_commands_1.copyCmdOptions(BgUtils_.safer_({
      v: useInner ? inner : page,
      i: useInner ? null : inner,
      t: useInner ? 0 /* VomnibarNS.PageType.inner */ : preferWeb ? 2 /* VomnibarNS.PageType.web */ : 1 /* VomnibarNS.PageType.ext */ ,
      s: trailingSlash,
      j: useInner ? "" : store_1.CONST_.VomnibarScript_f_,
      e: !!store_1.get_cOptions().exitOnClick,
      u: defaultUrl,
      url: typeof optUrl === "string" && defaultUrl || optUrl,
      k: BgUtils_.getOmniSecret_(true),
      h: store_1.vomnibarBgOptions_.maxBoxHeight_
    }), store_1.get_cOptions());
    options.icase == null && store_1.vomnibarBgOptions_.actions.includes("icase") && (options.icase = true);
    run_commands_1.portSendFgCmd(port, 6 /* kFgCmd.vomnibar */ , true, options, store_1.cRepeat);
    options.k = "omni";
    store_1.set_cOptions(options);
 // safe on renaming
    };
  exports.showVomnibar = showVomnibar;
  const findContentPort_ = (port, type, local) => {
    const rawId = port.s.tabId_, tabId = rawId >= 0 ? rawId : store_1.curTabId_;
    const ref = port.s.frameId_ || rawId < 0 ? store_1.framesForTab_.get(tabId) : null;
    if (ref) {
      rawId < 0 && (port.s.flags_ & 64 /* Frames.Flags.aboutIframe */ || port.s.url_.startsWith("about:")) && (port = ref.cur_);
      (type === "tab" || !type && !local && rawId < 0) && (ref.top_ || rawId < 0) && (port = ref.top_ || ref.cur_);
      if (port.s.flags_ & 64 /* Frames.Flags.aboutIframe */ || port.s.url_.startsWith("blob:")) {
        return ports_1.getParentFrame(tabId, port.s.frameId_, 1).then(port2 => port2 || ref.top_ || ref.cur_);
      }
    }
    return port;
  };
  exports.findContentPort_ = findContentPort_;
  const marksActivate_ = () => {
    let mode = store_1.get_cOptions().mode, count = store_1.cRepeat < 2 || store_1.cRepeat > 10 ? 1 : store_1.cRepeat;
    const action = mode && (mode + "").toLowerCase() === "create" ? 1 /* kMarkAction.create */ : 0 /* kMarkAction.goto */;
    const key = store_1.get_cOptions().key;
    const options = {
      a: action,
      n: !store_1.get_cOptions().storeCount,
      s: store_1.get_cOptions().swap !== true,
      t: "",
      o: store_1.get_cOptions()
    };
    if (typeof key === "string" && key.trim().length === 1) {
      options.a = 0 /* kMarkAction.goto */;
      store_1.reqH_[21 /* kFgReq.marks */ ]({
        H: 21 /* kFgReq.marks */ ,
        c: options,
        k: store_1.cKey,
        n: key.trim(),
        s: 0,
        u: "",
        l: !!store_1.get_cOptions().local
      }, store_1.cPort);
      return;
    }
    Promise.resolve(i18n_1.trans_(action === 1 /* kMarkAction.create */ ? "mBeginCreate" : "mBeginGoto")).then(title => {
      options.t = title;
      run_commands_1.portSendFgCmd(store_1.cPort, 3 /* kFgCmd.marks */ , true, options, count);
    });
  };
  exports.marksActivate_ = marksActivate_;
  const enterVisualMode = () => {
    const _rawMode = store_1.get_cOptions().mode;
    const start = store_1.get_cOptions().start;
    const str = typeof _rawMode === "string" ? _rawMode.toLowerCase() : "";
    const sender = store_1.cPort.s;
    let sentFindCSS = null;
    let words = "", keyMap = null;
    let granularities = null;
    if (16 /* Frames.Flags.hadVisualMode */ & ~sender.flags_) {
      if (!(sender.flags_ & 32 /* Frames.Flags.hasFindCSS */)) {
        sender.flags_ |= 32 /* Frames.Flags.hasFindCSS */;
        sentFindCSS = browser_1.getFindCSS_cr_(sender);
      }
      keyMap = key_mappings_1.visualKeys_;
      granularities = key_mappings_1.visualGranularities_;
      sender.flags_ |= 16 /* Frames.Flags.hadVisualMode */;
    }
    const opts2 = BgUtils_.extendIf_({
      m: str === "caret" ? 3 /* VisualModeNS.Mode.Caret */ : str === "line" ? 2 /* VisualModeNS.Mode.Line */ : 1 /* VisualModeNS.Mode.Visual */ ,
      f: sentFindCSS,
      g: granularities,
      k: keyMap,
      t: !!store_1.get_cOptions().richText,
      s: start != null ? !!start : null,
      w: words
    }, store_1.get_cOptions());
    delete opts2.mode;
    delete opts2.start;
    delete opts2.richText;
    run_commands_1.sendFgCmd(5 /* kFgCmd.visualMode */ , true, opts2);
  };
  exports.enterVisualMode = enterVisualMode;
  const handleImageUrl = (url, buffer, actions, resolve, title, text, doShow) => {
    var _a;
    if (!actions) {
      resolve(1);
      return;
    }
    const blobRef_mv2 = "";
    actions & 1 /* kTeeTask.CopyImage */ && (url ? Promise.resolve() : BgUtils_.convertToDataURL_(buffer).then(u2 => {
      url = u2;
    })).then(() => store_1.runOnTee_(actions === 9 /* kTeeTask.DrawAndCopy */ ? 9 /* kTeeTask.DrawAndCopy */ : 1 /* kTeeTask.CopyImage */ , {
      u: url,
      t: text,
      b: 1
 /* Build.BTypes */    }, buffer)).then(async ok => {
      resolve(!!ok);
      return;
    });
    if (actions & 2 /* kTeeTask.ShowImage */) {
      doShow(url);
      actions & 1 /* kTeeTask.CopyImage */ || resolve(1);
      return;
    }
    if (actions & 4 /* kTeeTask.Download */) {
      const port = ((_a = ports_1.getCurFrames_()) === null || _a === void 0 ? void 0 : _a.top_) || store_1.cPort;
      const p2 = BgUtils_.deferPromise_();
      actions & 1 /* kTeeTask.CopyImage */ ? setTimeout(p2.resolve_, 800) : p2.resolve_(0);
      p2.promise_.then(() => browser_1.downloadFile(blobRef_mv2, title, port ? port.s.url_ : null)).then(succeed => {
        !succeed && doShow(url);
        actions === 4 /* kTeeTask.Download */ && resolve(true);
      });
    }
  };
  exports.handleImageUrl = handleImageUrl;
  const captureTab = (tabs, resolve) => {
    const show = store_1.get_cOptions().show, copy = !!store_1.get_cOptions().copy, rawDownload = store_1.get_cOptions().download, download = copy ? rawDownload === true : rawDownload !== false, png = !!store_1.get_cOptions().png, richText = !!store_1.get_cOptions().richText;
    let jpeg = png ? 0 : Math.min(Math.max(store_1.get_cOptions().jpeg | 0, 0), 100);
    const cb = url => {
      if (!url) {
        store_1.cPort && ports_1.showHUD("Can not capture " + (isExt ? "injected extensions" : "this tab"));
        resolve(0);
        return browser_1.runtimeError_();
      }
      const actions = (show ? 2 /* kTeeTask.ShowImage */ : 0) | (download ? 4 /* kTeeTask.Download */ : 0) | (copy ? 1 /* kTeeTask.CopyImage */ : 0);
      const doShow = url => {
        store_1.reqH_[26 /* kFgReq.openImage */ ]({
          t: "pixel=1&",
          u: url,
          f: title,
          a: false,
          m: 37 /* HintMode.OPEN_IMAGE */ ,
          o: {
            r: store_1.get_cOptions().reuse,
            m: store_1.get_cOptions().replace,
            p: store_1.get_cOptions().position,
            w: store_1.get_cOptions().window
          }
        }, store_1.cPort);
        return;
      };
      exports.handleImageUrl(url, null, actions, copy ? ok => {
        ports_1.showHUD(i18n_1.trans_(ok ? "imgCopied" : "failCopyingImg", [ ok === 1 ? "HTML" : jpeg ? "JPEG" : "PNG" ]));
        resolve(ok);
      } : resolve, title, ((richText || "") + "").includes("name") ? title : "", doShow);
    };
    const tab = tabs && tabs[0], isExt = !!tab && tab.url.startsWith(location.protocol);
    const tabId = tab ? tab.id : store_1.curTabId_, wndId = tab ? tab.windowId : store_1.curWndId_;
    let title = tab ? tab.title : "Tab" + tabId;
    title = store_1.get_cOptions().name === "title" ? title : BgUtils_.now().replace(/[-: ]/g, s => s === " " ? "_" : "") + "-" + title;
    title = title.replace(BgUtils_.getImageExtRe_(), "");
    title += jpeg > 0 ? ".jpg" : ".png";
    browser_1.Tabs_.captureVisibleTab(wndId, jpeg > 0 ? {
      format: "jpeg",
      quality: jpeg
    } : {
      format: "png"
    }, cb);
  };
  exports.captureTab = captureTab;
  const openImgReq = (req, port) => {
    var _a, _b;
    let url = req.u;
    if (/^<svg[\s>]/i.test(url)) {
      url = normalize_urls_1.normalizeSVG_(url);
      if (!url) {
        store_1.set_cPort(port);
        ports_1.showHUD(i18n_1.trans_("invalidImg"));
        return;
      }
      req.f = req.f || "SVG Image";
    }
    if (!BgUtils_.safeParseURL_(url)) {
      store_1.set_cPort(port);
      ports_1.showHUD(i18n_1.trans_("invalidImg"));
      return;
    }
    let prefix = store_1.CONST_.ShowPage_ + "#!image ";
    req.f && (prefix += "download=" + BgUtils_.encodeAsciiComponent_(req.f) + "&");
    req.r && (prefix += "src=" + BgUtils_.encodeAsciiComponent_(req.r) + "&");
    req.a !== false && (prefix += "auto=once&");
    req.t && (prefix += req.t);
    const opts2 = req.o || BgUtils_.safeObj_();
    const exOut = {}, urlAfterSed = opts2.s ? store_1.substitute_(url, 32768 /* SedContext.paste */ , opts2.s, exOut) : url;
    const keyword = (_a = exOut.keyword_) !== null && _a !== void 0 ? _a : opts2.k;
    const testUrl = (_b = opts2.t) !== null && _b !== void 0 ? _b : !keyword;
    const hasSed = urlAfterSed !== url;
    const reuse = opts2.r != null ? opts2.r : req.m & 16 /* HintMode.queue */ ? -2 /* ReuseType.newBg */ : -1 /* ReuseType.newFg */;
    url = urlAfterSed;
    // no group during openImg
        run_commands_1.replaceCmdOptions({
      opener: true,
      reuse,
      replace: opts2.m,
      position: opts2.p,
      window: opts2.w
    });
    store_1.set_cRepeat(1);
    const urlToOpen = keyword || hasSed ? testUrl ? normalize_urls_1.convertToUrl_(url, keyword, 2 /* Urls.WorkType.ActAnyway */) : normalize_urls_1.createSearchUrl_(url.trim().split(BgUtils_.spacesRe_), keyword, 2 /* Urls.WorkType.ActAnyway */) : url;
    port && ports_1.safePost(port, {
      N: 11 /* kBgReq.showHUD */ ,
      H: ports_1.ensureInnerCSS(store_1.cPort.s),
      k: 1 /* kTip.raw */ ,
      t: " ",
      d: 1e-4
    });
    // not use v:show for those from other extensions
        open_urls_1.openUrlWithActions(typeof urlToOpen !== "string" || !testUrl || urlToOpen.startsWith(location.protocol) && !urlToOpen.startsWith(store_1.Origin2_) ? urlToOpen : prefix + urlToOpen, 9 /* Urls.WorkType.FakeType */);
  };
  exports.openImgReq = openImgReq;
  const framesGoBack = (req, port, curTab) => {
    const hasTabsGoBack = true /* BrowserVer.Min$tabs$$goBack */;
    if (req.o.r) {
      run_commands_1.executeCommand(key_mappings_1.makeCommand_("reloadTab", BgUtils_.safer_(req.o)), req.s, 0 /* kKeyCode.None */ , port, 0, req.o.$f && {
        c: req.o.$f,
        r: req.o.$retry,
        u: 0,
        w: 0
      });
      return;
    }
    if (!hasTabsGoBack) {
      const url = curTab ? browser_1.getTabUrl(curTab) : (port.s.frameId_ ? ports_1.getFrames_(port).top_ : port).s.url_;
      if (url.startsWith(store_1.CONST_.BrowserProtocol_)) {
        store_1.set_cPort(port);
 /* Port | null -> Port */        ports_1.showHUD(i18n_1.trans_("noTabHistory"));
        run_commands_1.runNextCmd(0);
        return;
      }
    }
    const onApiCallback = run_commands_1.hasFallbackOptions(req.o) ? (run_commands_1.replaceCmdOptions(req.o), 
    run_commands_1.getRunNextCmdBy(0 /* kRunOn.otherCb */)) : browser_1.runtimeError_;
    const execGoBack = (tab, goStep) => {
      browser_1.executeScript_(tab.id, 0, null, step => {
        history.go(step);
      }, [ goStep ]);
    };
    const tabID = curTab ? curTab.id : port.s.tabId_;
    const count = req.s, reuse = open_urls_1.parseReuse(req.o.reuse || 0 /* ReuseType.current */);
    if (reuse) {
      const position = req.o.position;
      browser_1.Tabs_.duplicate(tabID, tab => {
        if (!tab) {
          return onApiCallback();
        }
        reuse === -2 /* ReuseType.newBg */ && browser_1.selectTab(tabID);
        if (hasTabsGoBack) {
          const opts = run_commands_1.parseFallbackOptions(req.o) || {};
          opts.reuse = 0 /* ReuseType.current */;
          exports.framesGoBack({
            s: count,
            o: opts
          }, null, tab);
        } else {
          execGoBack(tab, count);
        }
        const newTabIdx = tab.index--;
        const wantedIdx = position === "end" ? -1 : open_urls_1.newTabIndex(tab, position, false, true);
        wantedIdx != null && wantedIdx !== newTabIdx && browser_1.Tabs_.move(tab.id, {
          index: wantedIdx === 3e4 ? -1 : wantedIdx
        }, browser_1.runtimeError_);
      });
    } else {
      const jump = count > 0 ? browser_1.Tabs_.goForward : browser_1.Tabs_.goBack;
      if (hasTabsGoBack || jump) {
        for (let i = 0, end = count > 0 ? count : -count; i < end; i++) {
          jump(tabID, i ? browser_1.runtimeError_ : onApiCallback);
        }
      } else {
        execGoBack(curTab, count);
      }
    }
  };
  exports.framesGoBack = framesGoBack;
  const mainFrame = () => {
    const ref = ports_1.getCurFrames_(), port = ref && ref.top_;
    !port || port === ref.cur_ && store_1.get_cOptions().$else && typeof store_1.get_cOptions().$else === "string" ? run_commands_1.runNextCmd(0) : exports.focusFrame(port, true, port === ref.cur_ ? 3 /* FrameMaskType.OnlySelf */ : 5 /* FrameMaskType.ForcedSelf */);
  };
  exports.mainFrame = mainFrame;
  const toggleZoom = resolve => {
    browser_1.Q_(browser_1.Tabs_.getZoom).then(curZoom => {
      if (!curZoom) {
        resolve(0);
        return;
      }
      let absCount = store_1.cRepeat < -4 ? -store_1.cRepeat : store_1.cRepeat;
      if (store_1.get_cOptions().in || store_1.get_cOptions().out) {
        absCount = 0;
        store_1.set_cRepeat(store_1.get_cOptions().in ? store_1.cRepeat : -store_1.cRepeat);
      }
      let newZoom, level = store_1.get_cOptions().level, M = Math;
      if (store_1.get_cOptions().reset) {
        newZoom = 1;
      } else if (level != null && !isNaN(+level) || absCount > 4) {
        const min = M.max(.1, M.min(store_1.get_cOptions().min | 0 || .25, .9));
        const max = M.max(1.1, M.min(store_1.get_cOptions().min | 0 || 5, 100));
        newZoom = level == null || isNaN(+level) ? absCount > 1e3 ? 1 : absCount / (absCount > 49 ? 100 : 10) : 1 + level * store_1.cRepeat;
        newZoom = M.max(min, M.min(newZoom, max));
      } else {
        let nearest = 0, delta = 9, steps = [ .25, 1 / 3, .5, 2 / 3, .75, .8, .9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5 ];
        for (let ind = 0, d2 = 0; ind < steps.length && (d2 = Math.abs(steps[ind] - curZoom)) < delta; ind++) {
          nearest = ind, delta = d2;
        }
        newZoom = steps[nearest + store_1.cRepeat < 0 ? 0 : M.min(nearest + store_1.cRepeat, steps.length - 1)];
      }
      Math.abs(newZoom - curZoom) > .005 ? browser_1.Tabs_.setZoom(newZoom, browser_1.R_(resolve)) : resolve(0);
    });
  };
  exports.toggleZoom = toggleZoom;
  const framesGoNext = (isNext, rel) => {
    let rawPatterns = store_1.get_cOptions().patterns, patterns = rawPatterns, useDefaultPatterns = false;
    if (!patterns || !(patterns instanceof Array)) {
      patterns = patterns && typeof patterns === "string" ? patterns : (useDefaultPatterns = true, 
      isNext ? store_1.settingsCache_.nextPatterns : store_1.settingsCache_.previousPatterns);
      patterns = patterns.split(",");
    }
    if (useDefaultPatterns || !store_1.get_cOptions().$fmt) {
      let p2 = [];
      for (let i of patterns) {
        i = i && (i + "").trim();
        i && p2.push(".#[:" /* GlobalConsts.SelectorPrefixesInPatterns */ .includes(i[0]) ? i : i.toLowerCase());
        if (p2.length === 200 /* GlobalConsts.MaxNumberOfNextPatterns */) {
          break;
        }
      }
      patterns = p2;
      if (!useDefaultPatterns) {
        run_commands_1.overrideOption("patterns", patterns);
        run_commands_1.overrideOption("$fmt", 1);
      }
    }
    const maxLens = patterns.map(i => Math.max(i.length + 12, i.length * 4)), totalMaxLen = Math.max.apply(Math, maxLens);
    run_commands_1.sendFgCmd(10 /* kFgCmd.goNext */ , true, run_commands_1.wrapFallbackOptions({
      r: store_1.get_cOptions().noRel ? "" : rel,
      n: isNext,
      match: store_1.get_cOptions().match,
      clickable: store_1.get_cOptions().clickable,
      clickableOnHost: store_1.get_cOptions().clickableOnHost,
      exclude: store_1.get_cOptions().exclude,
      excludeOnHost: store_1.get_cOptions().excludeOnHost,
      evenIf: store_1.get_cOptions().evenIf,
      scroll: store_1.get_cOptions().scroll,
      p: patterns,
      l: maxLens,
      m: totalMaxLen > 0 && totalMaxLen < 99 ? totalMaxLen : 32,
      v: store_1.get_cOptions().view !== false,
      a: !!store_1.get_cOptions().avoidClick
    }));
  };
  exports.framesGoNext = framesGoNext;
  const focusFrame = (port, css, mask, noFallback) => {
    port.postMessage({
      N: 7 /* kBgReq.focusFrame */ ,
      H: css ? ports_1.ensureInnerCSS(port.s) : null,
      m: mask,
      k: store_1.cKey,
      c: 0,
      f: !noFallback && store_1.get_cOptions() && run_commands_1.parseFallbackOptions(store_1.get_cOptions()) || {}
    });
  };
  exports.focusFrame = focusFrame;
  const getBlurOption_ = () => {
    var _a;
    return (_a = store_1.get_cOptions().blur) !== null && _a !== void 0 ? _a : store_1.get_cOptions().grabFocus;
  };
  exports.getBlurOption_ = getBlurOption_;
  const blurInsertOnTabChange = tab => {
    let fallback = run_commands_1.parseFallbackOptions(store_1.get_cOptions());
    fallback && fallback.$then ? fallback.$else = fallback.$then : fallback = null;
    let blur = exports.getBlurOption_();
    if (typeof blur === "string") {
      const parsed = exclusions_1.createSimpleUrlMatcher_(blur) || false;
      run_commands_1.overrideOption(blur === store_1.get_cOptions().blur ? "blur" : "grabFocus", parsed);
      blur = parsed;
    }
    const frames = tab ? store_1.framesForTab_.get(tab.id) : null;
    if (browser_1.runtimeError_() || !frames || blur && blur !== true && !exclusions_1.matchSimply_(blur, frames.cur_.s.frameId_ ? frames.cur_.s.url_ : tab.url)) {
      // use `.url_` directly: faster is better
      fallback && run_commands_1.runNextCmdBy(1, fallback);
      return browser_1.runtimeError_();
    }
    setTimeout(() => {
      ports_1.waitForPorts_(store_1.framesForTab_.get(store_1.curTabId_), true).then(() => {
        const frames = store_1.framesForTab_.get(store_1.curTabId_);
        if (!frames || frames.flags_ & 512 /* Frames.Flags.ResReleased */) {
          fallback && run_commands_1.runNextCmdBy(1, fallback);
        } else {
          const options = BgUtils_.safer_({
            esc: true
          });
          fallback && run_commands_1.copyCmdOptions(options, BgUtils_.safer_(fallback));
          run_commands_1.portSendFgCmd(frames.cur_, 16 /* kFgCmd.dispatchEventCmd */ , false, options, -1);
        }
      });
    }, 17);
  };
  exports.blurInsertOnTabChange = blurInsertOnTabChange;
});
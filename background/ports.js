"use strict";
__filename = "background/ports.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./exclusions", "./i18n" ], function(require, exports, store_1, utils_1, browser_1, exclusions_1, i18n_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.waitForPorts_ = exports.refreshPorts_ = exports.tryToKeepAliveIfNeeded_mv3_non_ff = exports.getParentFrame = exports.complainNoSession = exports.complainLimits = exports.asyncIterFrames_ = exports.ensuredExitAllGrab = exports.showHUDEx = exports.showHUD = exports.safePost = exports.isNotVomnibarPage = exports.ensureInnerCSS = exports.indexFrame = exports.getFrames_ = exports.getCurFrames_ = exports.isExtIdAllowed = exports.findCPort = exports.requireURL_ = exports.getPortUrl_ = exports.resetOffscreenPort_ = exports.postTeeTask_ = exports.OnConnect = exports.sendResponse = exports.resetInnerKeepAliveTick_ = void 0;
  const RELEASE_TIMEOUT = 15e4;
  const ALIVE_TIMEOUT_IF_NO_ACTION = 3e4;
  const MAX_KEEP_ALIVE = 2;
  const DEBUG = false;
  const kAutoDisconnectPorts = true;
  const kAliveIfOnlyAnyAction = true /* BrowserVer.MinBgWorkerAliveIfOnlyAnyAction */;
  let _timeoutToTryToKeepAliveOnce_mv3_non_ff = 0;
  let _lastTimeToKeepContentAlive = 0;
  let innerKeepAliveTick_ = 0;
  const resetInnerKeepAliveTick_ = () => {
    innerKeepAliveTick_ = 0;
  };
  exports.resetInnerKeepAliveTick_ = resetInnerKeepAliveTick_;
  const onMessage = (request, port) => {
    innerKeepAliveTick_ = 0;
    if (request.H !== 90 /* kFgReq.msg */) {
      store_1.reqH_[request.H](request, port);
    } else {
      const ret = store_1.reqH_[request.c](request.a, port, request.i);
      ret !== port && port.postMessage({
        N: 4 /* kBgReq.msg */ ,
        m: request.i,
        r: ret
      });
    }
  };
  const sendResponse = (port, msgId, response) => {
    const frames = exports.getFrames_(port);
    if (frames && frames.ports_.includes(port)) {
      // for less exceptions
      try {
        port.postMessage({
          N: 4 /* kBgReq.msg */ ,
          m: msgId,
          r: response
        });
      } catch (_a) {}
    }
  };
  exports.sendResponse = sendResponse;
  const OnConnect = (port, type) => {
    if (type & 128 /* PortType.selfPages */) {
       _onPageConnect(port, type);
      return;
    }
    const lifecycle = port.sender.documentLifecycle;
    const isInactive = lifecycle !== "active";
    const sender =  formatPortSender(port);
    const url = sender.url_, isOmni = url === store_1.vomnibarPage_f;
    if (type > 7 || isOmni) {
      if (type === 999 /* PortType.CloseSelf */) {
        sender.tabId_ >= 0 && !sender.frameId_ && browser_1.removeTempTab(sender.tabId_, port.sender.tab.windowId, sender.url_);
        return;
      }
      if (type & 256 /* PortType.omnibar */ || isOmni) {
         _onOmniConnect(port, type, isOmni || url === store_1.CONST_.VomnibarPageInner_);
        return;
      }
      if (isInactive) {
        port.disconnect();
        DEBUG && console.log("on inactive port reconnect: tab=%o, frameId=%o, lifecycle=%o @ %o", sender.tabId_, sender.frameId_, lifecycle, Date.now() % 9e5);
        return;
      }
    }
    let tabId = sender.tabId_;
    const ref = tabId >= 0 ? store_1.framesForTab_.get(tabId) : void (tabId = sender.tabId_ = store_1.getNextFakeTabId());
    const isNewFrameInSameTab = (type & 9 /* PortType.reconnect */) !== 1 /* PortType.isTop */ && (type & 33 /* PortType.onceFreezed */) !== 33 /* PortType.onceFreezed */ && ref !== void 0;
    let status;
    let passKeys, flags;
    if (isNewFrameInSameTab && ref.lock_ !== null) {
      passKeys = ref.lock_.passKeys_;
      status = ref.lock_.status_;
      flags = status === 2 /* Frames.Status.disabled */ ? 3 /* Frames.Flags.lockedAndDisabled */ : 1 /* Frames.Flags.locked */;
    } else {
      passKeys = !exclusions_1.exclusionListening_ || type & 8 /* PortType.reconnect */ ? null : exclusions_1.getExcluded_(url, sender);
      status = passKeys === null ? 0 /* Frames.Status.enabled */ : passKeys ? 1 /* Frames.Status.partial */ : 2 /* Frames.Status.disabled */;
      flags = 0 /* Frames.Flags.blank */;
    }
    sender.status_ = status;
    type & 64 /* PortType.aboutIframe */ && (sender.flags_ = flags |= 64 /* Frames.Flags.aboutIframe */);
    if (isNewFrameInSameTab) {
      flags |= ref.flags_ & 4 /* Frames.Flags.userActed */;
      if (type & 1024 /* PortType.otherExtension */) {
        flags |= 128 /* Frames.Flags.otherExtension */;
        ref.flags_ |= 128 /* Frames.Flags.otherExtension */;
      }
      sender.flags_ = flags;
    }
    if (type & 8 /* PortType.reconnect */) {
      DEBUG && console.log("on port reconnect: tab=%o, frameId=%o, frames.flag=%o, old-ports=%o @ %o", sender.tabId_, sender.frameId_, ref ? ref.flags_ : null, ref ? ref.ports_.length : -1, Date.now() % 9e5);
      type & 4096 /* Frames.Flags.UrlUpdated */ && port.postMessage({
        N: 1 /* kBgReq.reset */ ,
        p: flags & 1 /* Frames.Flags.locked */ ? passKeys : exclusions_1.getExcluded_(url, sender),
        f: flags & 3
 /* Frames.Flags.MASK_LOCK_STATUS */      })
      ;
      _recoverStates(ref, port, type);
    } else {
      port.postMessage(type & 4 /* PortType.confInherited */ ? {
        N: 0 /* kBgReq.init */ ,
        c: null,
        d: isInactive,
        f: flags,
        p: passKeys,
        v: store_1.contentConfVer_
      } : {
        N: 0 /* kBgReq.init */ ,
        c: store_1.contentPayload_,
        d: isInactive,
        f: flags,
        k: store_1.keyFSM_,
        m: store_1.mappedKeyRegistry_,
        p: passKeys,
        t: store_1.mappedKeyTypes_,
        v: store_1.contentConfVer_
      });
      if (isInactive) {
        port.disconnect();
        DEBUG && console.log("on inactive port connect: tab=%o, frameId=%o, lifecycle=%o @ %o", sender.tabId_, sender.frameId_, lifecycle, Date.now() % 9e5);
        return;
      }
    }
    port.onDisconnect.addListener(onDisconnect);
    port.onMessage.addListener( onMessage);
    const isTopFrame = sender.frameId_ === 0;
    if (isNewFrameInSameTab) {
      if (type & 2 /* PortType.hasFocus */) {
        store_1.needIcon_ && ref.cur_.s.status_ !== status && store_1.setIcon_(tabId, status);
        ref.cur_ = port;
      } else {
        ref.cur_.s.flags_ & 512 /* Frames.Flags.ResReleased */ && (ref.cur_ = port);
      }
      isTopFrame && (ref.top_ = port);
      ref.ports_.push(port);
    } else {
      store_1.framesForTab_.set(tabId, {
        cur_: port,
        top_: isTopFrame ? port : null,
        ports_: [ port ],
        lock_: null,
        flags_: 0
 /* Frames.Flags.Default */      });
      status !== 0 /* Frames.Status.enabled */ && store_1.needIcon_ && store_1.setIcon_(tabId, status);
      ref !== void 0 && 
       revokeOldPorts(ref);
    }
  };
  exports.OnConnect = OnConnect;
  const _debugReleasedPort = function(req) {
    console.log("Can not send message %o from a dead port %o%s", req, this.s, ((new Error).stack + "").replace(/^.*\n/, ""));
  };
  const onDisconnect = port => {
    const sender = port.s, tabId = sender.tabId_, ref = store_1.framesForTab_.get(tabId);
    port === store_1.cPort && (sender.flags_ |= 512 /* Frames.Flags.ResReleased */ , 
    port.postMessage = _debugReleasedPort);
    if (!ref) {
      return;
    }
    const ports = ref.ports_, i = ports.lastIndexOf(port), isTop = !sender.frameId_;
    let len = ports.length;
    if (i >= 0) {
      len-- === 1 ? ports.length = 0 : ports.splice(i, 1);
      len > 0 && port === ref.cur_ && (ref.cur_ = ports[0]);
      port.postMessage = _debugReleasedPort;
    }
    if (isTop ? i >= 0 : !len) {
      ref.flags_ & 512 /* Frames.Flags.ResReleased */ ? sender.flags_ |= 512 /* Frames.Flags.ResReleased */ : store_1.framesForTab_.delete(tabId);
      kAutoDisconnectPorts && !kAliveIfOnlyAnyAction && tabId === store_1.lastKeptTabId_ && exports.tryToKeepAliveIfNeeded_mv3_non_ff(tabId);
    }
  };
  const _onOmniConnect = (port, type, isOmniUrl) => {
    if (type & 256 /* PortType.omnibar */) {
      if (isOmniUrl) {
        port.s.tabId_ < 0 && (port.s.tabId_ = type & 8 /* PortType.reconnect */ ? store_1.getNextFakeTabId() : store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_);
        port.s.flags_ |= 256 /* Frames.Flags.isVomnibar */;
        store_1.framesForOmni_.push(port);
        port.onDisconnect.addListener( onOmniDisconnect);
        port.onMessage.addListener( onMessage);
        if (type & 8 /* PortType.reconnect */) {
          const oldConfVer = type >> 13 /* PortType.OFFSET_SETTINGS */;
          oldConfVer !== store_1.omniConfVer_ && port.postMessage({
            N: 47 /* kBgReq.omni_updateOptions */ ,
            d: store_1.omniPayload_,
            v: store_1.omniConfVer_
          });
        } else {
          port.postMessage({
            N: 42 /* kBgReq.omni_init */ ,
            l: store_1.omniPayload_,
            s: utils_1.getOmniSecret_(false),
            v: store_1.omniConfVer_
          });
        }
        return;
      }
    } else {
      port.s.tabId_ < 0 || port.s.frameId_ === 0 || browser_1.executeScript_(port.s.tabId_, port.s.frameId_, [ store_1.CONST_.VomnibarScript_ ]);
    }
    port.disconnect();
  };
  const onOmniDisconnect = port => {
    const ref = store_1.framesForOmni_, i = ref.lastIndexOf(port);
    i >= 0 && (i === ref.length - 1 ? --ref.length : ref.splice(i, 1));
    port.postMessage = _debugReleasedPort;
    return browser_1.runtimeError_();
  };
  const postTeeTask_ = (port, task) => {
    port.postMessage({
      N: 49 /* kBgReq.omni_runTeeTask */ ,
      t: task.t,
      s: task.s
    });
  };
  exports.postTeeTask_ = postTeeTask_;
  const onTeeResult_ = res => {
    if (res.H !== 92 /* kFgReq.teeRes */) {
      return;
    }
    const task = store_1.replaceTeeTask_(null, null);
    if (task) {
      clearTimeout(task.i);
      task.r && task.r(res.r);
    }
  };
  const markTeeFail_ = () => {
    onTeeResult_({
      H: 92 /* kFgReq.teeRes */ ,
      r: false
    });
  };
  const resetOffscreenPort_ = () => {
    store_1.set_offscreenPort_(null);
    onTeeResult_({
      H: 92 /* kFgReq.teeRes */ ,
      r: false
    });
    browser_1.browser_.offscreen.closeDocument(browser_1.runtimeError_);
  };
  exports.resetOffscreenPort_ = resetOffscreenPort_;
  const _onPageConnect = (port, type) => {
    if (type & 1024 /* PortType.otherExtension */) {
      port.disconnect();
      return;
    }
    if (type & 2048 /* PortType.Tee */) {
      if (store_1.teeTask_) {
        const isOffscreen = type & 4096 /* PortType.Offscreen */;
        port.onMessage.addListener(onTeeResult_);
        exports.postTeeTask_(port, store_1.teeTask_);
        port.onDisconnect.addListener(isOffscreen ? exports.resetOffscreenPort_ : markTeeFail_);
        isOffscreen && store_1.set_offscreenPort_(port);
      } else {
        port.disconnect();
      }
      return;
    }
    port.s = false;
    port.onMessage.addListener(onMessage);
  };
  const formatPortSender = port => {
    const sender = port.sender;
    const tab = sender.tab;
 // || { id: -3, incognito: false }
        sender.tab = null;
    return port.s = {
      frameId_: sender.frameId || 0,
      flags_: 0 /* Frames.Flags.blank */ ,
      status_: 0 /* Frames.Status.enabled */ ,
      incognito_: tab != null && tab.incognito,
      tabId_: tab != null ? tab.id : -3,
      url_: sender.url
    };
  };
  const revokeOldPorts = frames => {
    if (store_1.cPort && store_1.cPort.s.tabId_ === frames.cur_.s.tabId_) {
      store_1.cPort.s.flags_ |= 512 /* Frames.Flags.ResReleased */;
      store_1.cPort.postMessage = _debugReleasedPort;
    }
    for (const port of frames.ports_) {
      port.s.frameId_ && _safeRefreshPort(port);
    }
  };
  const _safeRefreshPort = port => {
    port.s.flags_ |= 512 /* Frames.Flags.ResReleased */;
    try {
      port.onDisconnect.removeListener(onDisconnect);
      port.onMessage.removeListener(onMessage);
      port.postMessage({
        N: 15
 /* kBgReq.refreshPort */      });
      port.s.flags_ |= 524288 /* Frames.Flags.Refreshing */ , port.postMessage = _debugReleasedPort;
    } catch (e) {
      console.log("Can not refresh port safely: " + (e.message || e));
      safeDisconnect(port);
      return 1;
    }
  };
  const safeDisconnect = port => {
    try {
      port.disconnect();
      port.postMessage = _debugReleasedPort;
    } catch (_a) {}
  };
  /**
     * @returns "" - in a child frame, so need to send request to content
     * @returns string - valid URL
     * @returns Promise&lt;string> - valid URL or empty string for a top frame in "port's or the current" tab
     */  const getPortUrl_ = (port, ignoreHash, noSender, request) => {
    var _a;
    port = port || ((_a = store_1.framesForTab_.get(store_1.curTabId_)) === null || _a === void 0 ? void 0 : _a.top_) || null;
    return port && !noSender && exclusions_1.exclusionListening_ && (ignoreHash || exclusions_1.exclusionListenHash_) ? port.s.url_ : new Promise(resolve => {
      const webNav = port && port.s.frameId_ && utils_1.isNotPriviledged(port) ? browser_1.browserWebNav_() : null;
      port ? (port.s.frameId_ ? webNav ? webNav.getFrame : (_, callback) => callback(null) : browser_1.tabsGet)(webNav ? {
        tabId: port.s.tabId_,
        frameId: port.s.frameId_
      } : port.s.tabId_, tab => {
        const url = tab ? tab.url : "";
        if (!url && request) {
          request.N = 3 /* kBgReq.url */;
          exports.safePost(port, request);
        }
        resolve(url);
        return browser_1.runtimeError_();
      }) : browser_1.getCurTab(tabs => {
        resolve(tabs && tabs.length ? browser_1.getTabUrl(tabs[0]) : "");
        return browser_1.runtimeError_();
      });
    });
  };
  exports.getPortUrl_ = getPortUrl_;
  const requireURL_ = (request, ignoreHash, noSender, port) => {
    var _a;
    port || (port = store_1.cPort || ((_a = store_1.framesForTab_.get(store_1.curTabId_)) === null || _a === void 0 ? void 0 : _a.top_));
    const res = exports.getPortUrl_(port, ignoreHash, noSender, request);
    if (typeof res !== "string") {
      return res.then(url => {
        request.u = url;
        url && store_1.reqH_[request.H](request, port);
        return url;
      });
    }
    request.u = res;
    store_1.reqH_[request.H](request, port);
  };
  exports.requireURL_ = requireURL_;
  const findCPort = port => {
    const frames = store_1.framesForTab_.get(port && port.s.tabId_ >= 0 ? port.s.tabId_ : store_1.curTabId_);
    return frames ? frames.cur_ : null;
  };
  exports.findCPort = findCPort;
  const isExtIdAllowed = sender => {
    const extId = sender.id != null ? sender.id : "unknown_sender";
    let url = sender.url, tab = sender.tab;
    const list = store_1.extAllowList_, stat = list.get(extId);
    if (stat !== true && tab) {
      const ref = store_1.framesForTab_.get(tab.id), oldInfo = ref ? ref.unknownExt_ : null;
      ref && (oldInfo == null || oldInfo !== extId && typeof oldInfo === "string") && (ref.unknownExt_ = oldInfo == null ? extId : 2);
    }
    if (stat != null) {
      return stat;
    }
    if (url === store_1.vomnibarPage_f) {
      return true;
    }
    const backgroundLightYellow = "background-color:#fffbe5";
    console.log("%cReceive message from an extension/sender not in the allow list: %c%s", backgroundLightYellow, backgroundLightYellow + ";color:red", extId);
    list.set(extId, false);
    return false;
  };
  exports.isExtIdAllowed = isExtIdAllowed;
  const getCurFrames_ = () => store_1.framesForTab_.get(store_1.cPort ? store_1.cPort.s.tabId_ : store_1.curTabId_);
  exports.getCurFrames_ = getCurFrames_;
  const getFrames_ = port => store_1.framesForTab_.get(port.s.tabId_);
  exports.getFrames_ = getFrames_;
  const indexFrame = (tabId, frameId) => {
    const ref = store_1.framesForTab_.get(tabId);
    for (const port of ref ? ref.ports_ : []) {
      if (port.s.frameId_ === frameId) {
        return port;
      }
    }
    return null;
  };
  exports.indexFrame = indexFrame;
  const ensureInnerCSS = sender => {
    if (sender.flags_ & 8 /* Frames.Flags.hasCSS */) {
      return null;
    }
    const ref = store_1.framesForTab_.get(sender.tabId_);
    ref && (ref.flags_ |= 4 /* Frames.Flags.userActed */);
    sender.flags_ |= 12 /* Frames.Flags.userActed */;
    return store_1.innerCSS_;
  };
  exports.ensureInnerCSS = ensureInnerCSS;
  /** `true` means `port` is NOT vomnibar port */  const isNotVomnibarPage = (port, noLog) => {
    let info = port.s, f = info.flags_;
    if (f & 256 /* Frames.Flags.isVomnibar */) {
      return false;
    }
    if (!noLog && !(f & 2048 /* Frames.Flags.SOURCE_WARNED */)) {
      console.warn("Receive a request from %can unsafe source page%c (should be vomnibar) :\n %s @ tab %o", "color:red", "color:auto", info.url_.slice(0, 128), info.tabId_);
      info.flags_ |= 2048 /* Frames.Flags.SOURCE_WARNED */;
    }
    return true;
  };
  exports.isNotVomnibarPage = isNotVomnibarPage;
  /** action section */  const safePost = (port, req) => {
    try {
      const released = port.s.flags_ & 512 /* Frames.Flags.ResReleased */;
      released ? _debugReleasedPort.call(port, req) : port.postMessage(req);
      return released ? 0 : 1;
    } catch (_a) {
      return 0;
    }
  };
  exports.safePost = safePost;
  const show2 = (tipId, text) => {
    exports.showHUD(text + "", tipId);
  };
  const showHUD = (text, tipId) => {
    if (typeof text !== "string") {
      text.then( show2.bind(null, tipId));
      return;
    }
    const isCopy = tipId === 14 /* kTip.noUrlCopied */ || tipId === 15 /* kTip.noTextCopied */;
    if (isCopy) {
      text.startsWith(store_1.CONST_.BrowserProtocol_ + "-") && text.includes("://") && (text = text.slice(text.indexOf("/", text.indexOf("/") + 2) + 1) || text);
      text = text.length > 41 ? text.slice(0, 41) + "\u2026" : text && text + (store_1.UseZhLang_ ? "\u3002" : ".");
    }
    store_1.cPort && !exports.safePost(store_1.cPort, {
      N: 11 /* kBgReq.showHUD */ ,
      H: exports.ensureInnerCSS(store_1.cPort.s),
      k: isCopy && text ? 20 /* kTip.copiedIs */ : tipId || 1 /* kTip.raw */ ,
      t: text
    }) && store_1.set_cPort(null);
  };
  exports.showHUD = showHUD;
  const showHUDEx = (port, name, duration, args, _name2) => {
    if (!port) {
      return;
    }
    let text = _name2 || i18n_1.transEx_(name, args);
    if (typeof text !== "string") {
      text.then(exports.showHUDEx.bind(null, port, "NS", duration, []));
      return;
    }
    exports.safePost(port, {
      N: 11 /* kBgReq.showHUD */ ,
      H: exports.ensureInnerCSS(port.s),
      k: 1 /* kTip.raw */ ,
      d: duration,
      t: text
    });
  };
  exports.showHUDEx = showHUDEx;
  const ensuredExitAllGrab = ref => {
    const msg = {
      N: 8
 /* kBgReq.exitGrab */    };
    for (const p of ref.ports_) {
      if (!(p.s.flags_ & 4 /* Frames.Flags.userActed */)) {
        p.s.flags_ |= 4 /* Frames.Flags.userActed */;
        p.postMessage(msg);
      }
    }
    ref.flags_ |= 4 /* Frames.Flags.userActed */;
    return;
  };
  exports.ensuredExitAllGrab = ensuredExitAllGrab;
  const asyncIterFrames_ = (itemUpdatedFlag, callback, doesContinue) => {
    const MIN_ASYNC_ITER = 10;
    const knownKeys = utils_1.keys_(store_1.framesForTab_), knownCurTabId = store_1.curTabId_;
    const iter = tab => {
      let frames = store_1.framesForTab_.get(tab), weight = 0;
      if (frames !== void 0) {
        frames.flags_ & 512 /* Frames.Flags.ResReleased */ && itemUpdatedFlag && (frames.flags_ |= itemUpdatedFlag);
        weight = Math.min(frames.ports_.length, 8);
        callback(frames);
      }
      return weight;
    };
    if (knownKeys.length >= MIN_ASYNC_ITER) {
      const ind1 = knownKeys.indexOf(knownCurTabId);
      if (ind1 >= 0) {
        knownKeys.splice(ind1, 1);
        iter(knownCurTabId);
      }
      utils_1.asyncIter_(knownKeys, iter, doesContinue);
    } else {
      knownKeys.forEach(iter);
    }
  };
  exports.asyncIterFrames_ = asyncIterFrames_;
  const complainLimits = action => {
    exports.showHUDEx(store_1.cPort, "notAllowA", 0, [ action ]);
  };
  exports.complainLimits = complainLimits;
  const complainNoSession = () => {
    exports.complainLimits("control tab sessions");
  };
  exports.complainNoSession = complainNoSession;
  const getParentFrame = (tabId, curFrameId, level) => {
    if (!curFrameId || !browser_1.browserWebNav_()) {
      return Promise.resolve(null);
    }
    if (level === 1) {
      return browser_1.Q_(browser_1.browserWebNav_().getFrame, {
        tabId,
        frameId: curFrameId
      }).then(frame => {
        const frameId = frame ? frame.parentFrameId : 0;
        return frameId > 0 ? exports.indexFrame(tabId, frameId) : null;
      });
    }
    return browser_1.Q_(browser_1.browserWebNav_().getAllFrames, {
      tabId
    }).then(frames => {
      let found = false, frameId = curFrameId;
      if (!frames) {
        return null;
      }
      do {
        found = false;
        for (const i of frames) {
          if (i.frameId === frameId) {
            frameId = i.parentFrameId;
            found = frameId > 0;
            break;
          }
        }
      } while (found && 0 < --level);
      return frameId > 0 && frameId !== curFrameId ? exports.indexFrame(tabId, frameId) : null;
    });
  };
  exports.getParentFrame = getParentFrame;
  const tryToKeepAlive = rawNotFromInterval => {
    const now = performance.now(), isFromInterval = !(kAutoDisconnectPorts && rawNotFromInterval);
    if (kAutoDisconnectPorts && !kAliveIfOnlyAnyAction && _timeoutToTryToKeepAliveOnce_mv3_non_ff) {
      isFromInterval && clearTimeout(_timeoutToTryToKeepAliveOnce_mv3_non_ff);
      _timeoutToTryToKeepAliveOnce_mv3_non_ff = 0;
    }
    if (isFromInterval) {
      for (let i = store_1.framesForOmni_.length; 0 <= --i; ) {
        const port = store_1.framesForOmni_[i];
        const flags = port.s.flags_;
        if (flags & 1024 /* Frames.Flags.OldEnough */) {
          const doesRelease = port.s.tabId_ !== store_1.curTabId_;
          if (kAutoDisconnectPorts || doesRelease) {
            // send only once, because the page may be freezed so not respond on this message
            if (doesRelease) {
              port.s.flags_ = flags | 512 /* Frames.Flags.ResReleased */;
              safeDisconnect(port);
              store_1.framesForOmni_.splice(i, 1);
            } else if (!(flags & 524288 /* Frames.Flags.Refreshing */)) {
              port.s.flags_ = flags | 524288 /* Frames.Flags.Refreshing */;
              port.postMessage({
                N: 48
 /* kBgReq.omni_refresh */              });
            }
          }
        } else {
          port.s.flags_ = flags | 1024 /* Frames.Flags.OldEnough */;
        }
      }
    }
    let oldestToKeepAlive = 0;
    if (isFromInterval) {
      const visited = [];
      store_1.framesForTab_.forEach((frames, tabId) => {
        const visit = frames.ports_.length && tabId >= 0 && store_1.recencyForTab_.get(tabId) || 0;
        visit > 0 && visited.push(visit);
      });
      visited.sort((i, j) => j - i);
      oldestToKeepAlive = Math.max(now - RELEASE_TIMEOUT, visited.length ? visited[Math.min(MAX_KEEP_ALIVE, visited.length - 1)] - 1e3 : 0);
    }
    let typeOfFramesToKeep = 0 /* KKeep.None */ , framesToKeep = null;
    const listToRelease = [];
    store_1.framesForTab_.forEach((frames, tabId) => {
      const ports = frames.ports_, portNum = ports.length;
      if ((!kAutoDisconnectPorts || typeOfFramesToKeep > 3 /* KKeep.NormalWoPorts */) && !portNum) {
        return;
      }
      if (kAutoDisconnectPorts && (!typeOfFramesToKeep || portNum && typeOfFramesToKeep === 3 /* KKeep.NormalWoPorts */)) {
        typeOfFramesToKeep = portNum ? 4 /* KKeep.NormalWithPorts */ : 3 /* KKeep.NormalWoPorts */;
        framesToKeep = frames;
      }
      const mayRelease = [];
      for (const i of isFromInterval ? ports : []) {
        i.s.flags_ & 1024 /* Frames.Flags.OldEnough */ ? mayRelease.push(i) : i.s.flags_ |= 1024 /* Frames.Flags.OldEnough */;
      }
      if (!mayRelease.length) {
        kAutoDisconnectPorts && typeOfFramesToKeep === 4 /* KKeep.NormalWithPorts */ && portNum && (typeOfFramesToKeep = 5 /* KKeep.NormalFresh */ , 
        framesToKeep = frames);
        return;
      }
      const visit = tabId >= 0 && store_1.recencyForTab_.get(tabId) || 0;
      const doesRelease = visit < oldestToKeepAlive && tabId !== store_1.curTabId_ && (portNum === 1 && !(frames.flags_ & 131072 /* Frames.Flags.HadIFrames */) && ports[0] === frames.top_ || ports.some(utils_1.isNotPriviledged));
      if (kAutoDisconnectPorts ? portNum : doesRelease) {
        kAutoDisconnectPorts && !doesRelease || (frames.flags_ |= 512 /* Frames.Flags.ResReleased */);
        for (const i of mayRelease) {
          i.s.flags_ |= 512 /* Frames.Flags.ResReleased */;
        }
        listToRelease.push(frames);
      }
    });
    // just to make tsc happy
    const guessedOneToKeep = framesToKeep;
    for (const frames of listToRelease) {
      const doesRelease = !kAutoDisconnectPorts || !!(frames.flags_ & 512 /* Frames.Flags.ResReleased */) && frames !== guessedOneToKeep;
      let hadIFrames = !!(frames.flags_ & 131072 /* Frames.Flags.HadIFrames */) || frames.ports_.length > 1, failed = 0;
      const stillAlive = [];
      for (const port of frames.ports_) {
        if (port.s.flags_ & 512 /* Frames.Flags.ResReleased */) {
          if (kAutoDisconnectPorts && !doesRelease || hadIFrames && !utils_1.isNotPriviledged(port)) {
            if (kAutoDisconnectPorts) {
              _safeRefreshPort(port) ? failed = 1 : typeOfFramesToKeep < 6 /* KKeep.NormalRefreshed */ && (typeOfFramesToKeep = 6 /* KKeep.NormalRefreshed */ , 
              framesToKeep = frames);
            } else {
              port.s.flags_ ^= 512 /* Frames.Flags.ResReleased */;
              stillAlive.push(port);
            }
          } else {
            port.disconnect();
            port.s.frameId_ && (frames.flags_ |= 131072 /* Frames.Flags.HadIFrames */);
            port.postMessage = _debugReleasedPort;
          }
        } else {
          kAutoDisconnectPorts && typeOfFramesToKeep < 5 /* KKeep.NormalFresh */ && (typeOfFramesToKeep = 5 /* KKeep.NormalFresh */ , 
          framesToKeep = frames);
          stillAlive.push(port);
        }
      }
      DEBUG && console.log("free ports: tab=%o, release=%o, ports=%o, result.alive=%o @ %o", frames.cur_.s.tabId_, doesRelease, frames.ports_.length, stillAlive.length, Date.now() % 9e5);
      kAutoDisconnectPorts && frames === framesToKeep && (frames.flags_ &= -513 /* Frames.Flags.ResReleased */);
      frames.ports_.length = 0;
      kAutoDisconnectPorts ? failed && (/** never */ /** never */ stillAlive.forEach(_safeRefreshPort), 
      exports.refreshPorts_(frames, 1)) : stillAlive.length && frames.ports_.push(...stillAlive);
    }
    if (!kAutoDisconnectPorts) {
      framesToKeep || store_1.saveRecency_ && store_1.saveRecency_();
      return;
    }
    const newAliveTabId = framesToKeep ? framesToKeep.cur_.s.tabId_ : -1;
    if (store_1.lastKeptTabId_ !== newAliveTabId) {
      DEBUG && console.log("update last kept tab id to %o @ %o", newAliveTabId, Date.now() % 9e5);
      store_1.set_lastKeptTabId_(newAliveTabId);
    } else {
      DEBUG && console.log("reuse kept tab id: %o @ %o", newAliveTabId, Date.now() % 9e5);
    }
    if (store_1.lastKeptTabId_ === -1) {
      isFromInterval && store_1.saveRecency_ && store_1.saveRecency_();
    } else if (typeOfFramesToKeep < 5 /* KKeep.MIN_HANDLED */ && typeOfFramesToKeep) {
      exports.refreshPorts_(framesToKeep, 0);
      typeOfFramesToKeep = 6 /* KKeep.NormalRefreshed */;
    }
    return typeOfFramesToKeep;
  };
  const tryToKeepAliveIfNeeded_mv3_non_ff = removedTabId => {
    if (!kAutoDisconnectPorts) {
      return;
    }
    if (removedTabId !== store_1.lastKeptTabId_ || _timeoutToTryToKeepAliveOnce_mv3_non_ff) {
      return;
    }
    for (const item of store_1.framesForTab_.values()) {
      if (item.ports_.length) {
        store_1.set_lastKeptTabId_(item.cur_.s.tabId_);
        return;
      }
    }
    const nextCheckTime = ALIVE_TIMEOUT_IF_NO_ACTION + 1 - performance.now() % ALIVE_TIMEOUT_IF_NO_ACTION | 0;
    const toWait = nextCheckTime > 3e3 ? Math.max(1e3, nextCheckTime - 5e3) | 0 : nextCheckTime > 1200 ? 0 : -1;
    store_1.set_lastKeptTabId_(-1);
    if (toWait < 0) {
      tryToKeepAlive(1);
      return;
    }
    _timeoutToTryToKeepAliveOnce_mv3_non_ff = setTimeout(tryToKeepAlive, toWait, 1);
    DEBUG && removedTabId >= 0 && console.log("wait for %o ms to try to keep alive once @ %o", toWait, Date.now() % 9e5);
  };
  exports.tryToKeepAliveIfNeeded_mv3_non_ff = tryToKeepAliveIfNeeded_mv3_non_ff;
  const refreshPorts_ = (frames, forced) => {
    let flags = frames.flags_;
    if (flags & 524288 /* Frames.Flags.Refreshing */ || !(flags & 131072 /* Frames.Flags.HadIFrames */ || utils_1.isNotPriviledged(frames.cur_))) {
      DEBUG && flags & 524288 /* Frames.Flags.Refreshing */ && console.log("refresh ports: [de-dup] tab=%o, forced=%o, flags=%o, ports=%o @ %o", frames.cur_.s.tabId_, forced, flags, frames.ports_.length, Date.now() % 9e5);
      return;
    }
    const tabId = frames.cur_.s.tabId_;
    DEBUG && console.log("refresh ports: tab=%o, forced=%o, flags=%o, ports=%o @ %o", tabId, forced, flags, frames.ports_.length, Date.now() % 9e5);
    browser_1.executeScript_(tabId, -1, null, (_, updates) => {
      typeof VApi === "object" && VApi && VApi.q(0, updates);
 // Frames.RefreshPort
        }, [ 0, 512 /* PortType.refreshInBatch */ | (forced ? 8 /* PortType.reconnect */ : 0) | flags & 126976 /* Frames.Flags.MASK_UPDATES */ ], () => {
      const new_frames = store_1.framesForTab_.get(tabId);
      DEBUG && console.log("refresh ports: [done] tab=%o, flags=%o, ports=%o @ %o", tabId, flags, new_frames && new_frames.ports_.length, Date.now() % 9e5);
      new_frames && (new_frames.flags_ &= -524289 /* Frames.Flags.Refreshing */);
      return browser_1.runtimeError_();
    });
    flags &= -258561 /* Frames.Flags.HadIFrames */;
    frames.flags_ = flags | 524288 /* Frames.Flags.Refreshing */;
  };
  exports.refreshPorts_ = refreshPorts_;
  const _recoverStates = (frames, port, type) => {
    port.s.flags_ |= type & 16 /* PortType.hasCSS */ && 8 /* Frames.Flags.hasCSS */;
    frames || exports.refreshPorts_({
      cur_: port,
      top_: null,
      ports_: [],
      lock_: null,
      flags_: 131072
 /* Frames.Flags.HadIFrames */    }, 0);
    let flag = type;
    if (type & 512 /* PortType.refreshInBatch */) {} else if (type >> 13 /* PortType.OFFSET_SETTINGS */ === store_1.contentConfVer_ || frames && frames.flags_ & 126976 /* Frames.Flags.MASK_UPDATES */) {
      if (!(type & 2) || !frames || !(frames.flags_ & 512 /* Frames.Flags.ResReleased */)) {
        // no old data to sync
        return;
      }
      flag = frames.flags_ & 258048 /* Frames.Flags.HadIFrames */;
      (flag & 131072 /* Frames.Flags.HadIFrames */ || port.s.frameId_) && exports.refreshPorts_(frames, 0);
    } else {
      flag = 126976 /* Frames.Flags.MASK_UPDATES */;
    }
    flag & 8192 /* Frames.Flags.SettingsUpdated */ && port.postMessage({
      N: 6 /* kBgReq.settingsUpdate */ ,
      d: store_1.contentPayload_,
      v: store_1.contentConfVer_
    });
    flag & 32768 /* Frames.Flags.KeyMappingsUpdated */ && port.postMessage({
      N: 9 /* kBgReq.keyFSM */ ,
      m: store_1.mappedKeyRegistry_,
      t: store_1.mappedKeyTypes_,
      k: flag & 65536 /* Frames.Flags.KeyFSMUpdated */ ? store_1.keyFSM_ : null,
      v: store_1.contentConfVer_
    });
    if (flag & 16384 /* Frames.Flags.CssUpdated */ && port.s.flags_ & 8 /* Frames.Flags.hasCSS */) {
      port.s.flags_ |= 32 /* Frames.Flags.hasFindCSS */;
      port.postMessage({
        N: 11 /* kBgReq.showHUD */ ,
        H: store_1.innerCSS_,
        f: browser_1.getFindCSS_cr_(port.s)
      });
    }
  };
  const waitForPorts_ = (frames, checkCur) => {
    const defer = utils_1.deferPromise_();
    const oldChecked = frames && (checkCur ? frames.cur_ : frames.top_);
    if (frames && (!oldChecked || oldChecked.s.flags_ & 512 /* Frames.Flags.ResReleased */)) {
      exports.refreshPorts_(frames, 0);
      /^(?:http|file|ftp)/i.test(frames.cur_.s.url_) || browser_1.selectTab(frames.cur_.s.tabId_, browser_1.selectWndIfNeed);
      let tick = 0, interval = setInterval(() => {
        tick++;
        const checked = checkCur ? frames.cur_ : frames.top_;
        if (tick === 5 || checked && !(checked.s.flags_ & 512 /* Frames.Flags.ResReleased */)) {
          clearInterval(interval);
          defer.resolve_();
        }
      }, 33);
    } else {
      defer.resolve_();
    }
    return defer.promise_;
  };
  exports.waitForPorts_ = waitForPorts_;
  kAutoDisconnectPorts && kAliveIfOnlyAnyAction ? setInterval(() => {
    if (++innerKeepAliveTick_ >= (9e5 /* GlobalConsts.KeepAliveTime */ / (ALIVE_TIMEOUT_IF_NO_ACTION * .8) | 0)) {
      return;
    }
    const findAlivePort = ref => {
      const i = ref && ref.ports_.length ? ref.cur_.s.flags_ & 512 /* Frames.Flags.ResReleased */ ? ref.top_ || ref.ports_[0] : ref.cur_ : null;
      return !i || i.s.flags_ & 512 /* Frames.Flags.ResReleased */ || !i.s.url_.startsWith("http") && !i.s.url_.startsWith("file:") ? null : i;
    };
    const curTabId = store_1.curTabId_;
    let port = findAlivePort(store_1.framesForTab_.get(curTabId)) || (store_1.lastKeptTabId_ !== store_1.curTabId_ && store_1.lastKeptTabId_ > 0 ? findAlivePort(store_1.framesForTab_.get(store_1.lastKeptTabId_)) : null);
    if (!port) {
      for (const frames of store_1.framesForTab_.values()) {
        if (port = findAlivePort(frames)) {
          break;
        }
      }
    }
    !port && tryToKeepAlive(1) < 5 /* KKeep.MIN_HANDLED */ && (port = findAlivePort(store_1.framesForTab_.get(store_1.lastKeptTabId_)));
    let posted = 0;
    if (port) {
      DEBUG && console.log("[verbose] send alive message to content port: tab=%o, frameId=%o, flags=%s @ %o", port.s.tabId_, port.s.frameId_, port.s.flags_, Date.now() % 9e5);
      posted = exports.safePost(port, {
        N: 11 /* kBgReq.showHUD */ ,
        H: null,
        k: 0,
        t: ""
      });
    }
    if (!posted) {
      DEBUG && console.log("[warning] no available port to send alive message @ %o", Date.now() % 9e5);
      browser_1.getCurTab(store_1.blank_);
 // storage.local.getBytesInUse fails on MS Edge 122
        }
    const now = performance.now();
    if (now - _lastTimeToKeepContentAlive > RELEASE_TIMEOUT / 2 - ALIVE_TIMEOUT_IF_NO_ACTION - 100) {
      _lastTimeToKeepContentAlive = now;
      tryToKeepAlive(0);
    }
  }, ALIVE_TIMEOUT_IF_NO_ACTION * .8) : setInterval(tryToKeepAlive, RELEASE_TIMEOUT / 2, 0);
});
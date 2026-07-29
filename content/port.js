"use strict";
__filename = "content/port.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "./dom_ui", "./hud", "./key_handler" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, dom_ui_1, hud_1, key_handler_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.onPageShowPort = exports.onFreezePort = exports.setupBackupTimer_cr = exports.runFallbackKey = exports.runtimeConnect = exports.safePost = exports.onPortRes_ = exports.send_ = exports.post_ = exports.set_hookOnWnd = exports.set_contentCommands_ = exports.set_requestHandlers = exports.set_safeDestroy = exports.set_port_ = exports.hookOnWnd = exports.contentCommands_ = exports.requestHandlers = exports.safeDestroy = exports.runtime_port = void 0;
  let port_callbacks;
  let port_ = null;
  exports.runtime_port = port_;
  let tick = 0;
  let onceFreezed = 0;
  let safeDestroy;
  exports.safeDestroy = safeDestroy;
  let requestHandlers;
  exports.requestHandlers = requestHandlers;
  let contentCommands_;
  exports.contentCommands_ = contentCommands_;
  let hookOnWnd;
  exports.hookOnWnd = hookOnWnd;
  function set_port_(_newRuntimePort) {
    exports.runtime_port = port_ = _newRuntimePort;
  }
  exports.set_port_ = set_port_;
  function set_safeDestroy(_newSafeDestroy) {
    exports.safeDestroy = safeDestroy = _newSafeDestroy;
  }
  exports.set_safeDestroy = set_safeDestroy;
  function set_requestHandlers(_newHandlers) {
    exports.requestHandlers = requestHandlers = _newHandlers;
  }
  exports.set_requestHandlers = set_requestHandlers;
  function set_contentCommands_(_newCmds) {
    exports.contentCommands_ = contentCommands_ = _newCmds;
  }
  exports.set_contentCommands_ = set_contentCommands_;
  function set_hookOnWnd(_newHookOnWnd) {
    exports.hookOnWnd = hookOnWnd = _newHookOnWnd;
  }
  exports.set_hookOnWnd = set_hookOnWnd;
  const post_ = request => {
    port_.postMessage(request);
  };
  exports.post_ = post_;
  const send_ = (cmd, args, callback) => {
    exports.post_({
      H: 90 /* kFgReq.msg */ ,
      i: tick += 2,
      c: cmd,
      a: args
    });
    port_callbacks = port_callbacks || utils_1.safer({});
    port_callbacks[tick] = callback;
  };
  exports.send_ = send_;
  const onPortRes_ = response => {
    const id = response.m, handler = port_callbacks[id];
    delete port_callbacks[id];
    handler(response.r);
  };
  exports.onPortRes_ = onPortRes_;
  const safePost = (request, retried) => {
    if (port_) {} else {
      const r = chrome.runtime;
      // sometimes runtime may be undefined, found on Chrome 126 + Ubuntu24, although not reproduced on Win11
            if (!r || !r.id) {
        // in fact, only after BrowserVer.Min$runtime$$id$GetsUndefinedOnTurnOff
        safeDestroy();
        return;
      }
      utils_1.safeCall(exports.runtimeConnect);
      utils_1.injector ? utils_1.timeout_(() => {
        port_ || safeDestroy();
      }, 50) : port_ || safeDestroy();
    }
    try {
      port_ && exports.post_(request);
    } catch (// this extension is reloaded or disabled
    _a) {
      // this extension is reloaded or disabled
      if (port_ && !retried) {
        exports.runtime_port = port_ = null;
        exports.safePost(request, 1);
      } else {
        safeDestroy();
      }
    }
  };
  exports.safePost = safePost;
  /**
     * Reading lastError clears Chrome's "Unchecked runtime.lastError" console noise (e.g. bfcache).
     * Must return the value so the compiler keeps the property access (void-only reads get DCE'd).
     */  const clearRuntimeLastError = () => {
    try {
      return chrome.runtime.lastError;
    } catch (_a) {
      return 0;
    }
  };
  exports.runtimeConnect = extraFlags => {
    const api = chrome, status = utils_1.fgCache ? 8 /* PortType.reconnect */ | extraFlags | 16 /* PortType.hasCSS */ * !!dom_ui_1.style_ui : 0 /* PortType.initing */ + utils_1.inherited_, name = utils_1.isTop | 64 /* PortType.aboutIframe */ * utils_1.isIFrameInAbout_ | onceFreezed | status | 2 /* PortType.hasFocus */ * dom_utils_1.docHasFocus_() | utils_1.confVersion << 13 /* PortType.OFFSET_SETTINGS */ , data = {
      name: utils_1.injector ? utils_1.injector.$h(name) : "" + name
    }, connect = api.runtime.connect;
    exports.runtime_port = port_ = utils_1.injector ? connect(utils_1.injector.id, data) : connect(data);
    port_.onDisconnect.addListener(() => {
      // Chrome bfcache / freeze: must read lastError or Chrome logs "Unchecked runtime.lastError"
      const lastErr = clearRuntimeLastError();
      exports.runtime_port = port_ = null;
      // Do not thrash reconnect while the page is frozen / in back-forward cache
            if (typeof document !== "undefined" && document.wasDiscarded) {
        return;
      }
      // bfcache closes the channel; pageshow (persisted) reconnects — do not spin here
            const msg = lastErr && lastErr.message || "";
      if (msg.includes("back/forward cache")) {
        return;
      }
      !utils_1.fgCache && (utils_1.timeout_ === utils_1.interval_ ? safeDestroy() : utils_1.timeout_(() => {
        try {
          if (port_ || !utils_1.isAlive_) {
            return;
          }
          // pageshow after bfcache will reconnect; skip if document is still hidden in bfcache-ish state
                    if (typeof document !== "undefined" && document.visibilityState === "hidden" && !dom_utils_1.docHasFocus_()) {
            return;
          }
          exports.runtimeConnect();
        } catch (_a) {
          safeDestroy();
        }
      }, (utils_1.fgCache ? 2e3 : 5e3) + utils_1.isTop * 50));
    });
    port_.onMessage.addListener(response => {
      requestHandlers[response.N](response);
    });
    utils_1.isLocked_ && onceFreezed && utils_1.isTop && exports.post_({
      H: 48 /* kFgReq.syncStatus */ ,
      s: [ utils_1.isLocked_, key_handler_1.isPassKeysReversed, key_handler_1.passKeys && [ ...key_handler_1.passKeys ] ]
    });
    onceFreezed = 0;
    utils_1.set_i18n_getMsg(api.i18n.getMessage);
  };
  exports.runFallbackKey = (options, anotherTip, tipArgs, wait) => {
    const fallback = anotherTip ? options.$else : options.$then, context = options.$f;
    if (fallback && utils_1.isTY(fallback)) {
      console.log("Vim+: run another command %o for type & tip = %o", fallback, anotherTip);
      keyboard_utils_1.suppressTail_(wait || 60, 0);
      exports.post_({
        H: 20 /* kFgReq.nextKey */ ,
        k: fallback,
        f: {
          c: context,
          r: options.$retry,
          u: anotherTip,
          w: wait
        }
      });
    } else {
      const tip = anotherTip && (anotherTip !== 2 ? anotherTip : context && context.t);
      tip && hud_1.hudTip(tip, 0, tipArgs);
    }
  };
  exports.setupBackupTimer_cr = () => {
     utils_1.setupTimerFunc_cr((func, timeout) => timeout > 49 && port_ ? (exports.send_(37 /* kFgReq.wait */ , timeout, func), 
    tick - 1) : dom_utils_1.rAF_(() => {
      func(9 /* TimerType.fake */);
    }), timer => {
      timer && port_callbacks && port_callbacks[timer + 1] && (port_callbacks[timer + 1] = utils_1.isTY);
    });
  };
  const onFreezePort = event => {
    if (port_ && event.isTrusted) {
      onceFreezed = 32 /* PortType.onceFreezed */;
      try {
        port_.disconnect();
      } catch (_a) {}
      // Intentional disconnect still sets lastError in some Chromium builds
            clearRuntimeLastError();
      exports.runtime_port = port_ = null;
    }
  };
  exports.onFreezePort = onFreezePort;
  /** Reconnect after bfcache restore / page resume */  const onPageShowPort = event => {
    const e = event;
    if (!utils_1.isAlive_) {
      return;
    }
    if (e.persisted || onceFreezed) {
      try {
        port_ || exports.runtimeConnect(8 /* PortType.reconnect */);
      } catch (_a) {}
    }
  };
  exports.onPageShowPort = onPageShowPort;
});
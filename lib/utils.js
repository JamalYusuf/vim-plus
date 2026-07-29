"use strict";
__filename = "lib/utils.js";
define([ "require", "exports" ], function(require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.urlSameIgnoringHash = exports.includes_ = exports.abs_ = exports.min_ = exports.max_ = exports.math = exports.Lower = exports.isTY = exports.OBJECT_TYPES = exports.queueTask_ = exports.promiseDefer_ = exports.reflectApply_not_cr = exports.safeCall = exports.tryCreateRegExp = exports.createRegExp = exports.escapeAllForRe = exports.parseOpenPageUrlOptions = exports.parseSedOptions = exports.set_findOptByHost = exports.findOptByHost = exports.splitEntries_ = exports.recordLog = exports.isImageUrl = exports.isJSUrl = exports.Stop_ = exports.suppressCommonEvents = exports.setupEventListener = exports.setupTimerFunc_cr_mv3 = exports.setupTimerFunc_cr = exports.clearTimeout_ = exports.interval_ = exports.timeout_ = exports.unwrap_ff = exports.raw_unwrap_ff = exports.deref_ = exports.set_weakRef_ff = exports.weakRef_ff = exports.weakRef_not_ff = exports.safer = exports.safeObj = exports.set_onWndFocus = exports.onWndFocus = exports.getTime = exports.timeStamp_ = exports.locHref = exports.callFunc = exports.set_i18n_getMsg = exports.set_VTr = exports.VTr = exports.set_vApi = exports.vApi = exports.set_esc = exports.esc = exports.setupKeydownEvents = exports.set_keydownEvents_ = exports.keydownEvents_ = exports.set_evenHidden_ = exports.evenHidden_ = exports.set_clickable_ = exports.clickable_ = exports.set_inherited_ = exports.inherited_ = exports.set_confVersion = exports.confVersion = exports.set_fgCache = exports.fgCache = exports.set_noRAF_old_cr_ = exports.noRAF_old_cr_ = exports.set_readyState_ = exports.readyState_ = exports.set_isLocked_ = exports.isLocked_ = exports.set_isEnabled_ = exports.isEnabled_ = exports.isAlive_ = exports.runtime_ff = exports.isIFrameInAbout_ = exports.loc_ = exports.doc = exports.isAsContent = exports.injector = exports.isTop = exports.set_os_ = exports.os_ = exports.set_firefoxVer_ = exports.set_chromeVer_ = exports.firefoxVer_ = exports.chromeVer_ = exports.OnSafari = exports.OnEdge = exports.OnFirefox = exports.OnChrome = void 0;
  exports.OnChrome = true /* BrowserType.Chrome */ /* BrowserType.Chrome */;
  exports.OnFirefox = false /* BrowserType.Firefox */ /* BrowserType.Firefox */;
  exports.OnEdge = false /* BrowserType.Edge */ /* BrowserType.Edge */;
  exports.OnSafari = false /* BrowserType.Safari */ /* BrowserType.Safari */;
  /** its initial value should be 0, need by {@see ../content/request_handlers#hookOnWnd} */  exports.chromeVer_ = 0;
  /** its placeholder value should be 0, need by {@see ../content/mode_find.ts#onLoad2} */  exports.firefoxVer_ = 0;
  function set_chromeVer_(_newRealChromeVer) {
    exports.chromeVer_ = _newRealChromeVer;
  }
  exports.set_chromeVer_ = set_chromeVer_;
  function set_firefoxVer_(_newRealVer) {
    exports.firefoxVer_ = _newRealVer;
  }
  exports.set_firefoxVer_ = set_firefoxVer_;
  function set_os_(_newOS) {
    exports.os_ = _newOS;
  }
  exports.set_os_ = set_os_;
  exports.isTop = top === window;
  exports.injector = VimPlusInjector;
  exports.isAsContent = exports.injector === void 0;
  exports.doc = document;
  exports.loc_ = location;
  // contentDocument.open may replace a location of `about:blank` with the parent frame's
    exports.isIFrameInAbout_ = !exports.isTop && exports.loc_.protocol === "about:";
  exports.runtime_ff = null;
  let esc;
  exports.isAlive_ = esc;
  exports.esc = esc;
  exports.isEnabled_ = false;
  function set_isEnabled_(_newIsEnabled) {
    exports.isEnabled_ = _newIsEnabled;
  }
  exports.set_isEnabled_ = set_isEnabled_;
  exports.isLocked_ = 0;
  function set_isLocked_(_newIsLocked) {
    exports.isLocked_ = _newIsLocked;
  }
  exports.set_isLocked_ = set_isLocked_;
  exports.readyState_ = exports.doc.readyState;
  function set_readyState_(_newReadyState) {
    exports.readyState_ = _newReadyState;
  }
  exports.set_readyState_ = set_readyState_;
  function set_noRAF_old_cr_(_newNoRAF) {
    exports.noRAF_old_cr_ = _newNoRAF;
  }
  exports.set_noRAF_old_cr_ = set_noRAF_old_cr_;
  function set_fgCache(_newCache) {
    exports.fgCache = _newCache;
  }
  exports.set_fgCache = set_fgCache;
  exports.confVersion = 0;
  function set_confVersion(_newConfVer) {
    exports.confVersion = _newConfVer;
  }
  exports.set_confVersion = set_confVersion;
  exports.inherited_ = 0;
  function set_inherited_(_newInherited) {
    exports.inherited_ = _newInherited;
  }
  exports.set_inherited_ = set_inherited_;
  function set_clickable_(_newClickable) {
    exports.clickable_ = _newClickable;
  }
  exports.set_clickable_ = set_clickable_;
  exports.evenHidden_ = 0 /* kHidden.None */;
  function set_evenHidden_(_newEvenHidden_) {
    exports.evenHidden_ = _newEvenHidden_;
  }
  exports.set_evenHidden_ = set_evenHidden_;
  function set_keydownEvents_(_newKeydownEvents) {
    exports.keydownEvents_ = _newKeydownEvents;
  }
  exports.set_keydownEvents_ = set_keydownEvents_;
  exports.setupKeydownEvents = arr => {
    if (!arr) {
      return exports.keydownEvents_;
    }
    return !exports.isEnabled_ || !(exports.keydownEvents_ = arr);
  };
  function set_esc(_newEsc) {
    exports.esc = exports.isAlive_ = esc = _newEsc;
  }
  exports.set_esc = set_esc;
  function set_vApi(_newVApi) {
    exports.vApi = _newVApi;
  }
  exports.set_vApi = set_vApi;
  let i18n_getMsg;
  let VTr = (tid, args) => i18n_getMsg("" + tid, args);
  exports.VTr = VTr;
  function set_VTr(_newVTr) {
    exports.VTr = _newVTr;
  }
  exports.set_VTr = set_VTr;
  function set_i18n_getMsg(_newGetMsg) {
    i18n_getMsg = _newGetMsg;
  }
  exports.set_i18n_getMsg = set_i18n_getMsg;
  const callFunc = callback => {
    callback();
  };
  exports.callFunc = callFunc;
  const locHref = () => exports.loc_.href;
  exports.locHref = locHref;
  const timeStamp_ = event => event.timeStamp;
  exports.timeStamp_ = timeStamp_;
  exports.getTime = Date.now;
  let onWndFocus = () => {};
  exports.onWndFocus = onWndFocus;
  function set_onWndFocus(_newOnWndFocus) {
    exports.onWndFocus = _newOnWndFocus;
  }
  exports.set_onWndFocus = set_onWndFocus;
  exports.safeObj = Object.create;
  exports.safer = opt => Object.setPrototypeOf(opt, null);
  exports.weakRef_not_ff = val => val && new WeakRef(val);
  exports.weakRef_ff = null;
  function set_weakRef_ff(new_weakRef) {
    exports.weakRef_ff = new_weakRef;
  }
  exports.set_weakRef_ff = set_weakRef_ff;
  exports.deref_ = val => val && val.deref();
  exports.raw_unwrap_ff = 0;
  exports.unwrap_ff = 0;
  exports.timeout_ = (func, timeout) => setTimeout(func, timeout);
  exports.interval_ = (func, period) => setInterval(func, period);
  let clearTimeout_ = timer => {
    timer && clearTimeout(timer);
  };
  exports.clearTimeout_ = clearTimeout_;
  exports.setupTimerFunc_cr = (_newTimerFunc, _newClearTimer) => {
    exports.timeout_ = exports.interval_ = _newTimerFunc;
    exports.clearTimeout_ = _newClearTimer;
  };
  exports.setupTimerFunc_cr_mv3 = (newTout, newInt, newCT) => {
    exports.timeout_ = newTout, exports.interval_ = newInt, exports.clearTimeout_ = newCT;
  };
  /**
     * @param target Default to `window`
     * @param eventType string
     * @param func Default to `Stop_`
     * @param disable Default to `0`
     * @param activeMode Default to `{passive: true, capture: true}`; `1` means `passive: false`;
     *        on Firefox, `3` means "on bubbling and not passive"
     */  const setupEventListener = (target, eventType, func, disable, activeMode) => {
    (disable ? removeEventListener : addEventListener).call(target || window, eventType, func || exports.Stop_, {
      passive: !activeMode,
      capture: true
    });
  };
  exports.setupEventListener = setupEventListener;
  const suppressCommonEvents = (target, extraEvents) => {
    // note: if wheel is listened, then mousewheel won't be dispatched even on Chrome 35
    for (const i of (exports.VTr(110 /* kTip.kCommonEvents */) + extraEvents).split(" ")) {
      exports.setupEventListener(target, i);
    }
  };
  exports.suppressCommonEvents = suppressCommonEvents;
  const Stop_ = event => {
    event.stopImmediatePropagation();
  };
  exports.Stop_ = Stop_;
  const isJSUrl = str => /^javascript:/i.test(str);
  exports.isJSUrl = isJSUrl;
  let imgExtRe_;
  const isImageUrl = str => {
    if (!str || str[0] === "#" || str.length < 5 || exports.isJSUrl(str)) {
      return false;
    }
    const end = str.lastIndexOf("#") + 1 || str.length;
    str = str.substring(str.lastIndexOf("/", str.lastIndexOf("?") + 1 || end), end);
    return (imgExtRe_ || (imgExtRe_ = exports.createRegExp(107 /* kTip.imgExt */ , "i"))).test(str);
  };
  exports.isImageUrl = isImageUrl;
  const recordLog = tip => console.log.bind(console, tip > 0 ? exports.VTr(tip) : tip, exports.loc_.pathname.replace(/^.*(\/[^\/]+\/?)$/, "$1"), exports.getTime());
  exports.recordLog = recordLog;
  const splitEntries_ = (map, sep) => {
    let arr;
    if (exports.isTY(map, 1 /* kTY.obj */) && map.length == null) {
      if (exports.chromeVer_ < 56 /* BrowserVer.MinEnsuredES$Object$$values$and$$entries */) {
        arr = [];
        for (let key in map) {
          arr.push([ key, map[key] ]);
        }
      } else {
        arr = Object.entries(map);
      }
    } else {
      arr = (map + "").split(sep);
    }
    return arr;
  };
  exports.splitEntries_ = splitEntries_;
  function set_findOptByHost(newFindOptByHost) {
    exports.findOptByHost = newFindOptByHost;
  }
  exports.set_findOptByHost = set_findOptByHost;
  const parseSedOptions = opts => {
    const sed = opts.sed;
    return exports.isTY(sed, 1 /* kTY.obj */) && sed ? sed.length ? {
      r: "",
      k: exports.findOptByHost(sed, 0)
    } : sed : {
      r: sed,
      k: opts.sedKeys || opts.sedKey
    };
  };
  exports.parseSedOptions = parseSedOptions;
  exports.parseOpenPageUrlOptions = (opts, decoded) => ({
    d: (decoded = opts.decoded, decoded != null ? decoded : opts.decode),
    g: opts.group,
    i: opts.incognito,
    k: opts.keyword,
    m: opts.replace,
    o: opts.opener,
    p: opts.position,
    r: opts.reuse,
    s: exports.parseSedOptions(opts),
    t: opts.testUrl,
    w: opts.window
  });
  const escapeAllForRe = str => str.replace(/[$()*+.?\[\\\]\^{|}]/g, "\\$&");
  exports.escapeAllForRe = escapeAllForRe;
  const createRegExp = (pattern, flags) => new RegExp(exports.VTr(pattern) || "^(?!)", flags);
  exports.createRegExp = createRegExp;
  exports.tryCreateRegExp = (pattern, flags) => exports.safeCall(RegExp, pattern, flags);
  exports.safeCall = (func, arg1, arg2) => {
    try {
      return func(arg1, arg2);
    } catch (_a) {}
  };
  exports.reflectApply_not_cr = 0;
  const promiseDefer_ = () => {
    let r, p = new Promise(resolve => {
      r = resolve;
    });
    return {
      p,
      r
    };
  };
  exports.promiseDefer_ = promiseDefer_;
  // if `var queueMicrotask`, on Firefox globalThis.queueMicrotask is undefined even when window.queueMicrotask exists
    exports.queueTask_ = window.queueMicrotask && window.queueMicrotask.bind(window);
  const TYPES = [ "string", "object", "function", "number" ];
  exports.OBJECT_TYPES = TYPES;
  exports.isTY = (obj, ty) => typeof obj == TYPES[ty || 0 /* kTY.str */ ];
  const Lower = str => str.toLowerCase();
  exports.Lower = Lower;
  exports.math = Math;
  exports.max_ = (...args) => exports.math.max(...args);
  exports.min_ = (...args) => exports.math.min(...args);
  exports.abs_ = arg => exports.math.abs(arg);
  function includes_(el) {
    return this.indexOf(el) >= 0;
  }
  exports.includes_ = includes_;
  const urlSameIgnoringHash = (s1, s2) => s2 && s1.split("#")[0] === s2.split("#")[0];
  exports.urlSameIgnoringHash = urlSameIgnoringHash;
});
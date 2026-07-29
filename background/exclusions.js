"use strict";
__filename = "background/exclusions.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./settings", "./ports" ], (require, exports, store_1, BgUtils_, browser_1, normalize_urls_1, settings, ports_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.RefreshStatus_ = exports.getAllPassed_ = exports.getExcluded_ = exports.parseMatcher_ = exports.exclusionListenHash_ = exports.exclusionListening_ = exports.matchSimply_ = exports.createSimpleUrlMatcher_ = exports.createRule_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  settings = __importStar(settings);
  const createRule_ = (pattern, keys) => {
    let re, newPattern;
    let rule;
    keys = keys && keys.replace(/<(\S+)>/g, "$1");
    pattern[0] === "^" ? (re = BgUtils_.makeRegexp_(pattern.startsWith("^$|") ? pattern.slice(3) : pattern, "", 0)) || console.log("Failed in creating an RegExp from %o", pattern) : pattern[0] === "`" && ((newPattern = BgUtils_.makePattern_(pattern.slice(1), 0)) || console.log("Failed in creating an URLPattern from %o", pattern));
    rule = re ? {
      t: 1 /* kMatchUrl.RegExp */ ,
      v: re,
      k: keys
    } : newPattern ? {
      t: 3 /* kMatchUrl.Pattern */ ,
      v: {
        p: newPattern,
        s: pattern.slice(1)
      },
      k: keys
    } : {
      t: 2 /* kMatchUrl.StringPrefix */ ,
      v: pattern.startsWith(":vimium://") ? normalize_urls_1.formatVimiumUrl_(pattern.slice(10), false, -1 /* Urls.WorkType.ConvertKnown */) : pattern.slice(1),
      k: keys
    };
    return rule;
  };
  exports.createRule_ = createRule_;
  const createSimpleUrlMatcher_ = host => {
    let ind;
    if (host[0] === "^") {
      host = host.startsWith("^$|") ? host.slice(3) : host;
      ind = ".*$".includes(host.slice(-2)) ? host.endsWith(".*$") ? 3 : host.endsWith(".*") ? 2 : 0 : 0;
      host = ind !== 0 && host[host.length - ind] !== "\\" ? host.slice(0, -ind) : host;
      const re = BgUtils_.makeRegexp_(host, "");
      return re ? {
        t: 1 /* kMatchUrl.RegExp */ ,
        v: re
      } : null;
    }
    if (host[0] === "`") {
      const slice = host.slice(1), newPattern = BgUtils_.makePattern_(slice);
      return newPattern ? {
        t: 3 /* kMatchUrl.Pattern */ ,
        v: {
          p: newPattern,
          s: slice
        }
      } : null;
    }
    if (host === "localhost" || !host.includes("/") && host.includes(".") && (!/:(?!\d+$)/.test(host) || BgUtils_.isIPHost_(host, 6))) {
      // ignore rare `IPV6 + :port`
      host = host.toLowerCase();
      host = host.endsWith("*") ? host.slice(0, /^[^\\]\.\*$/.test(host.slice(-3)) ? -2 : -1) : host;
      host = host.startsWith(".*") && !/[(\\[]/.test(host) ? "*." + host.slice(2) : host;
      let host2;
      const re = BgUtils_.makeRegexp_("^https?://" + (host.startsWith("*") && host[1] !== "." ? "[^/]" + host : (host2 = host.replace(/\./g, "\\."), 
      // lgtm [js/incomplete-sanitization]
      host2.startsWith("*") ? host2.replace("*\\.", "(?:[^./]+\\.)*?") : host2)), "", 0);
      return re ? {
        t: 1 /* kMatchUrl.RegExp */ ,
        v: re
      } : host.includes("*") ? null : {
        t: 2 /* kMatchUrl.StringPrefix */ ,
        v: "https://" + (host.startsWith(".") ? host.slice(1) : host) + "/"
      };
    }
    host = (host[0] === ":" ? host.slice(1) : host).replace(/([\/?#])\*$/, "$1");
    host = host.startsWith("vimium://") ? normalize_urls_1.formatVimiumUrl_(host.slice(9), false, -1 /* Urls.WorkType.ConvertKnown */) : host.startsWith("extension:") ? "chrome-" + host : host;
    ind = host.indexOf("://");
    return {
      t: 2 /* kMatchUrl.StringPrefix */ ,
      v: ind > 0 && ind + 3 < host.length && host.indexOf("/", ind + 3) < 0 ? host + "/" : host
    };
  };
  exports.createSimpleUrlMatcher_ = createSimpleUrlMatcher_;
  const matchSimply_ = (matcher, url) => matcher.t === 1 /* kMatchUrl.RegExp */ ? matcher.v.test(url) : matcher.t === 2 /* kMatchUrl.StringPrefix */ ? url.startsWith(matcher.v) : matcher.v.p.test(url);
  exports.matchSimply_ = matchSimply_;
  let listening_ = false;
  exports.exclusionListening_ = listening_;
  let listeningHash_ = false;
  exports.exclusionListenHash_ = listeningHash_;
  let _onlyFirstMatch = false;
  let rules_ = [];
  const setRules_ = rules => {
    rules_ = rules.map(rule => exports.createRule_(rule.pattern, rule.passKeys));
  };
  const parseMatcher_ = pattern => {
    const res = pattern ? [ exports.createRule_(pattern, "") ] : rules_;
    return res.map(i => ({
      t: i.t,
      v: i.t === 1 /* kMatchUrl.RegExp */ ? i.v.source : i.t === 2 /* kMatchUrl.StringPrefix */ ? i.v : i.v.s
    }));
  };
  exports.parseMatcher_ = parseMatcher_;
  const getExcluded_ = (url, sender) => {
    var _a;
    let matchedKeys = "";
    for (const rule of rules_) {
      if (rule.t === 1 /* kMatchUrl.RegExp */ ? rule.v.test(url) : rule.t === 2 /* kMatchUrl.StringPrefix */ ? url.startsWith(rule.v) : rule.v.p.test(url)) {
        const str = rule.k;
        if (str.length === 0 || str[0] === "^" && str.length > 2 || _onlyFirstMatch) {
          return str && str.trim();
        }
        matchedKeys += str;
      }
    }
    if (!matchedKeys && sender.frameId_ && url.lastIndexOf("://", 5) < 0 && !BgUtils_.protocolRe_.test(url)) {
      const top = (_a = store_1.framesForTab_.get(sender.tabId_)) === null || _a === void 0 ? void 0 : _a.top_;
      if (top != null) {
        return exports.getExcluded_(top.s.url_, top.s);
      }
    }
    return matchedKeys ? matchedKeys.trim() : null;
  };
  exports.getExcluded_ = getExcluded_;
  let getOnURLChange_ = () => {
    const onURLChange = browser_1.browserWebNav_() ? details => {
      store_1.reqH_[10 /* kFgReq.checkIfEnabled */ ](details);
      ports_1.resetInnerKeepAliveTick_();
    } : null;
    getOnURLChange_ = () => onURLChange;
    return onURLChange;
  };
  const getAllPassed_ = () => {
    const allPassKeys = new Set;
    for (const {k: passKeys} of rules_) {
      if (passKeys) {
        if (passKeys[0] === "^" && passKeys.length > 2) {
          return true;
        }
        for (const key of passKeys.split(" ")) {
          allPassKeys.add(key);
        }
      }
    }
    return allPassKeys.size ? allPassKeys : null;
  };
  exports.getAllPassed_ = getAllPassed_;
  const RefreshStatus_ = old_is_empty => {
    const always_enabled = rules_.length > 0 ? null : {
      N: 1 /* kBgReq.reset */ ,
      p: null,
      f: 0
    };
    if (old_is_empty) {
      always_enabled || settings.broadcast_({
        N: 3 /* kBgReq.url */ ,
        H: 10 /* kFgReq.checkIfEnabled */ ,
        U: 0
      });
      return;
    }
    const needIcon = store_1.iconData_ != null || store_1.iconData_ !== void 0 && store_1.needIcon_;
    const oldRules = rules_;
    ports_1.asyncIterFrames_(4096 /* Frames.Flags.UrlUpdated */ , frames => {
      const status0 = frames.cur_.s.status_, curFrame = frames.cur_.s;
      for (const port of frames.ports_) {
        let pass = null, status = 0 /* Frames.Status.enabled */;
        if (always_enabled) {
          if (port.s.status_ === 0 /* Frames.Status.enabled */) {
            continue;
          }
        } else {
          pass = exports.getExcluded_(port.s.url_, port.s);
          status = pass === null ? 0 /* Frames.Status.enabled */ : pass ? 1 /* Frames.Status.partial */ : 2 /* Frames.Status.disabled */;
          if (!pass && port.s.status_ === status) {
            continue;
          }
        }
        if (frames.lock_) {
          continue;
        }
        port.postMessage(always_enabled || {
          N: 1 /* kBgReq.reset */ ,
          p: pass,
          f: 0
        });
        port.s.status_ = status;
      }
      needIcon && status0 !== curFrame.status_ && store_1.setIcon_(curFrame.tabId_, curFrame.status_);
    }, () => oldRules === rules_);
  };
  exports.RefreshStatus_ = RefreshStatus_;
  const updateListeners_ = () => {
    const listen = rules_.length > 0, l = listen || listening_ ? getOnURLChange_() : null;
    if (!l) {
      return;
    }
    if (listening_ !== listen) {
      exports.exclusionListening_ = listening_ = listen;
      const e = browser_1.browserWebNav_().onHistoryStateUpdated;
      listen ? e.addListener(l) : e.removeListener(l);
    }
    const listenHash = listen && store_1.settingsCache_.exclusionListenHash;
    if (listeningHash_ !== listenHash) {
      exports.exclusionListenHash_ = listeningHash_ = listenHash;
      const e = browser_1.browserWebNav_().onReferenceFragmentUpdated;
      listenHash ? e.addListener(l) : e.removeListener(l);
    }
  };
  store_1.updateHooks_.exclusionRules = rules => {
    const isEmpty = !rules_.length, curKeyFSM = store_1.keyFSM_;
    setRules_(rules);
    _onlyFirstMatch = store_1.settingsCache_.exclusionOnlyFirstMatch;
    updateListeners_();
    setTimeout(() => {
      setTimeout(exports.RefreshStatus_, 10, isEmpty);
      store_1.keyFSM_ === curKeyFSM && settings.postUpdate_("keyMappings", null);
    }, 1);
  };
  store_1.updateHooks_.exclusionOnlyFirstMatch = value => {
    _onlyFirstMatch = value;
  };
  store_1.updateHooks_.exclusionListenHash = updateListeners_;
  settings.ready_.then(() => {
    setRules_(store_1.settingsCache_.exclusionRules);
    _onlyFirstMatch = store_1.settingsCache_.exclusionOnlyFirstMatch;
  });
});
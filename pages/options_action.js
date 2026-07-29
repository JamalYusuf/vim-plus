import { OnFirefox, OnEdge, OnChrome, $, pageTrans_, enableNextTick_, nextTick_, IsEdg_, post_, toggleReduceMotion_, hasShift_, PageOs_, setupPageOs_, prevent_, CurCVer_, escapeAllForRe_, browser_ } from "./async_bg.js";

import { bgSettings_, ExclusionRulesOption_, setupBorderWidth_, showI18n_, setupSettingsCache_ } from "./options_base.js";

let conf_;

let url, topUrl = "";

let inited /* is saving (temp status) */ = 0;

let saved = true, oldPass = null;

let exclusions = null;

let toggleAction;

let noHelpSpan = 0;

const protocolRe = /^[a-z][\+\-\.\da-z]+:\/\//;

const stateAction = $("#state-action");

const saveBtn2 = $("#saveOptions");

let stateValue = stateAction.nextElementSibling, stateTail = stateValue.nextElementSibling;

const testers_ = Object.create(null);

let _onlyFirstMatch;

const aTrans_ = (k, a) => pageTrans_(k, a) || "";

class PopExclusionRulesOption extends ExclusionRulesOption_ {
  init_(element) {
    super.init_(element);
    this.$list_.onmousedown = event => {
      event.detail > 1 && event.target.localName !== "input" && prevent_(event);
    };
  }
  addRule_(_pattern, autoFocus) {
    super.addRule_(PopExclusionRulesOption.generateDefaultPattern_(), autoFocus);
  }
  checkNodeVisible_(vnode) {
    vnode.matcher_ = vnode.rule_.pattern && testers_[vnode.rule_.pattern] || false;
    return doesMatchCur_(vnode.matcher_);
  }
  populateElement_(rules1) {
    super.populateElement_(rules1);
    PopExclusionRulesOption.prototype.populateElement_ = null;
    PopExclusionRulesOption.prototype.checkNodeVisible_ = ExclusionRulesOption_.prototype.checkNodeVisible_;
    let visible_ = this.list_.filter(i => i.visible_), some = visible_.length > 0;
    let element1;
    inited = some ? 2 : 1;
    if (some) {
      element1 = visible_[0].$keys_;
      updateState(true);
    } else {
      this.addRule_("", false);
      element1 = this.list_[this.list_.length - 1].$keys_;
    }
    setTimeout(() => {
      element1.focus();
    }, 67);
  }
  executeSave_(value) {
    const p = super.executeSave_(value);
    const p2 = _forceState(`${conf_.tabId}/reset/silent`);
    return Promise.all([ p, p2 ]).then(([a]) => a);
  }
  updateVNode_(vnode, pattern, passKeys) {
    const patternIsSame = vnode.rule_.pattern === pattern, oldMatcher = vnode.matcher_;
    super.updateVNode_(vnode, pattern, passKeys);
    const tip = pattern ? passKeys ? passKeys.length > 1 && passKeys[0] === "^" ? aTrans_("onlyHook") || "only hook such keys" : aTrans_("passThrough") || "pass through such keys" : aTrans_("completelyDisabled") || "completely disabled" : "";
    vnode.$pattern_.title !== pattern && (vnode.$pattern_.title = pattern);
    vnode.$keys_.title !== tip && (vnode.$keys_.title = tip);
    if (patternIsSame) {
      vnode.matcher_ = oldMatcher;
      return;
    }
    this.updateLineStyle_(vnode, pattern);
  }
  updateLineStyle_(vnode, pattern) {
    const patternElement = vnode.$pattern_;
    let matcher;
    vnode.changed_ &= -5 /* kExclusionChange.mismatches */;
    if (pattern && pattern !== PopExclusionRulesOption.generateDefaultPattern_()) {
      if ((matcher = parseMatcher(vnode)) instanceof Promise) {
        matcher.then(this.updateLineStyle_.bind(this, vnode, pattern));
      } else if (doesMatchCur_(matcher)) {
        patternElement.title = patternElement.style.color = "";
      } else {
        vnode.changed_ |= 4 /* kExclusionChange.mismatches */;
        patternElement.style.color = "red";
        patternElement.title = "Red text means that the pattern does not\nmatch the current URL.";
      }
    } else {
      patternElement.title = patternElement.style.color = "";
    }
  }
  static generateDefaultPattern_() {
    const hasSubDomain = conf_.hasSubDomain;
    const main = (hasSubDomain ? topUrl : url).split(/[?#]/)[0];
    const url2 = hasSubDomain || main.startsWith("http:") ? (hasSubDomain < 2 && main[4] !== ":" ? "^https://" : "^https?://") + (hasSubDomain ? "(?:[^/]+.)?" : "") + escapeAllForRe_(main.split("/", 3)[2]) + "/" : main.startsWith(location.origin + "/") ? ":vimium:/" + new URL(main).pathname.replace("/pages", "") : /^[^:]+:\/\/./.test(main) && !main.startsWith("file:") ? ":" + main.split("/", 3).join("/") + "/" : ":" + main;
    testers_[url2] || (testers_[url2] = deserializeMatcher(url2[0] === "^" ? {
      t: 1 /* kMatchUrl.RegExp */ ,
      v: url2
    } : {
      t: 2 /* kMatchUrl.StringPrefix */ ,
      v: url2.startsWith(":vimium:") ? main : url2.slice(1)
    }));
    PopExclusionRulesOption.generateDefaultPattern_ = () => url2;
    return url2;
  }
}

const updateState = updateOldPass => {
  exclusions.readValueFromElement_(true);
  const toCheck = exclusions.list_.filter(i => i.visible_ && (!!i.rule_.pattern || !!(i.changed_ & 4 /* kExclusionChange.mismatches */)));
  const oldInited = inited;
  inited = 2;
  Promise.all(toCheck.map(i => i.matcher_ !== null ? i.matcher_ : parseMatcher(i))).then(() => {
    _doUpdateState(oldInited, updateOldPass, toCheck);
  });
};

const _doUpdateState = (oldInited, updateOldPass, toCheck) => {
  const isSaving = oldInited === 3;
  let pass = getExcluded_(!!topUrl, toCheck);
  pass && (pass = collectPass(pass));
  updateOldPass && (oldPass = oldInited >= 2 ? pass : null);
  const same = pass === oldPass;
  const isReversed = !!pass && pass.length > 2 && pass[0] === "^";
  stateAction.textContent = (isSaving ? pass ? aTrans_("137") + aTrans_(isReversed ? "138" : "139") : aTrans_("140") : aTrans_(same ? "141" : "142") + aTrans_(pass ? isReversed ? "138" : "139" : same ? "143" : "143_2")).replace(" to be", "") + aTrans_("colon") + aTrans_("NS");
  /* note: on C91, Win10, text may have a negative margin-left (zh/fr) when inline-block and its left is inline */  stateValue.className = pass ? "code" : "";
  stateValue.textContent = pass ? isReversed ? pass.slice(2) : pass : aTrans_("143_3") + aTrans_(pass !== null ? "144" : "145");
  stateTail.textContent = conf_.lock !== null && !isSaving && same ? aTrans_("147", [ aTrans_(conf_.lock !== 0 /* Frames.Status.enabled */ ? "144" : "145") ]) : conf_.lock !== null ? aTrans_("148") : "";
  const mismatches = toCheck.some(vnode => !!(vnode.changed_ & 4 /* kExclusionChange.mismatches */) && (vnode.rule_.pattern !== vnode.savedRule_.pattern || vnode.rule_.passKeys !== vnode.savedRule_.passKeys));
  saveBtn2.disabled = same && !mismatches;
  saveBtn2.firstChild.data = aTrans_(isSaving ? "115_3" : same && !mismatches ? "115" : "115_2");
};

const saveOptions = () => {
  if (saveBtn2.disabled) {
    return;
  }
  enableNextTick_(8 /* kReadyInfo.LOCK */);
  return exclusions.save_().then(() => {
    enableNextTick_(0 /* kReadyInfo.NONE */ , 8 /* kReadyInfo.LOCK */);
    inited = 3;
    updateBottomLeft();
    updateState(true);
    saveBtn2.firstChild.data = aTrans_("115_3");
    saveBtn2.disabled = true;
    saved = true;
  });
};

const collectPass = pass => {
  pass = pass.trim();
  const isReversed = pass.length > 2 && pass.startsWith("^");
  isReversed && (pass = pass.slice(1).trimLeft());
  const dict = Object.create(null);
  for (let i of pass.split(" ")) {
    dict[i === "*" ? aTrans_("asterisk") : i] = 1;
  }
  return (isReversed ? "^ " : "") + Object.keys(dict).sort().join(" ");
};

const _forceState = cmd => post_(22 /* kPgReq.toggleStatus */ , [ cmd, conf_.tabId, conf_.frameId ]).then(res => {
  conf_.status = res[0], conf_.lock = res[1];
});

const forceState = (act, event) => {
  event && prevent_(event);
  const notClose = event && (event.ctrlKey || event.metaKey);
  _forceState(`${conf_.tabId}/${act}`).then(() => {
    notClose ? (updateBottomLeft(), updateState(false)) : window.close();
  });
};

const doesMatchCur_ = rule => {
  if (!rule) {
    return false;
  }
  return rule.t === 2 /* kMatchUrl.StringPrefix */ ? url.startsWith(rule.v) || !!topUrl && topUrl.startsWith(rule.v) : rule.t === 3 /* kMatchUrl.Pattern */ ? rule.v.p.test(url) || !!topUrl && rule.v.p.test(topUrl) : rule.v.test(url) || !!topUrl && rule.v.test(topUrl);
};

const parseMatcher = vnode => {
  const pattern = vnode.rule_.pattern;
  const cached = testers_[pattern];
  if (cached) {
    return vnode.matcher_ = cached instanceof Promise ? cached.then(i => vnode.matcher_ = i) : cached;
  }
  const serialized = post_(23 /* kPgReq.parseMatcher */ , pattern);
  return testers_[pattern] = vnode.matcher_ = serialized.then(i => testers_[pattern] = vnode.matcher_ = deserializeMatcher(i));
};

const deserializeMatcher = serialized => serialized.t === 2 /* kMatchUrl.StringPrefix */ ? {
  t: serialized.t,
  v: serialized.v
} : serialized.t === 3 /* kMatchUrl.Pattern */ ? {
  t: serialized.t,
  v: {
    p: new URLPattern(serialized.v, "http://localhost", {
      ignoreCase: true
    }),
    s: serialized.v
  }
} : {
  t: serialized.t,
  v: new RegExp(serialized.v, "")
};

const buildTester = () => {
  const {rules, matchers} = conf_.exclusions;
  for (let i = 0, len = rules.length; i < len; i++) {
    const str = rules[i].pattern;
    testers_[str !== "__proto__" ? str : "_"] = deserializeMatcher(matchers[i]);
  }
};

const getExcluded_ = (inIframe, vnodes) => {
  let matchedKeys = "";
  for (const node of vnodes) {
    const rule = node.matcher_;
    if (rule && (rule.t === 2 /* kMatchUrl.StringPrefix */ ? url.startsWith(rule.v) : rule.t === 3 /* kMatchUrl.Pattern */ ? rule.v.p.test(url) : rule.v.test(url))) {
      const str = node.rule_.passKeys;
      if (str.length === 0 || _onlyFirstMatch || str[0] === "^" && str.length > 2) {
        return str;
      }
      matchedKeys += str;
    }
  }
  if (!matchedKeys && inIframe && url.lastIndexOf("://", 5) < 0 && !protocolRe.test(url) && topUrl) {
    return getExcluded_(false, vnodes);
  }
  return matchedKeys || null;
};

const updateBottomLeft = () => {
  toggleAction = conf_.status !== 2 /* Frames.Status.disabled */ ? "Disable" : "Enable";
  let el0 = $("#toggleOnce"), el1 = el0.nextElementSibling;
  nextTick_(() => {
    el0.firstElementChild.textContent = (aTrans_(toggleAction) || toggleAction) + (conf_.lock !== null ? "" : aTrans_("Once"));
    el0.onclick = forceState.bind(null, toggleAction);
    stateValue.id = "state-value";
    el1.classList.toggle("hidden", conf_.lock === null);
    conf_.lock !== null && (el1.firstElementChild.onclick = forceState.bind(null, "Reset"));
  });
};

const initOptionsLink = _url => {
  const element = $(".options-link"), optionsUrl = location.origin + "/pages/options.html" /* GlobalConsts.OptionsPage */;
  if (_url.startsWith(optionsUrl)) {
    nextTick_(() => {
      element.nextElementSibling.remove();
      element.remove();
    });
  } else {
    element.href !== optionsUrl && nextTick_(() => {
      element.href = optionsUrl;
    });
    element.onclick = event => {
      prevent_(event);
      post_(15 /* kPgReq.focusOrLaunch */ , {
        u: optionsUrl,
        p: true
      }).then(() => {
        window.close();
      });
    };
  }
};

const initExclusionRulesTable = () => {
  PageOs_ || window.addEventListener("keydown", event => {
    if (event.keyCode === 13 /* kKeyCode.enter */ && event.metaKey) {
      onEnterKeyUp(event);
    } else if (event.altKey && (event.keyCode === 88 /* kKeyCode.X */ || conf_.lock !== null && event.keyCode === 90 /* kKeyCode.Z */) && !(event.ctrlKey || event.metaKey || hasShift_(event))) {
      prevent_(event);
      event.stopImmediatePropagation();
      forceState(event.keyCode === 88 /* kKeyCode.X */ ? toggleAction : "Reset");
    }
  });
  exclusions = new PopExclusionRulesOption($("#exclusionRules"), () => {
    if (saved) {
      saved = false;
      let el = !noHelpSpan && $("#helpSpan");
      if (el) {
        el.nextElementSibling.style.display = "";
        el.remove();
        noHelpSpan = 1;
      }
    }
    updateState(inited < 2);
  });
  exclusions.fetch_();
  Object.assign(globalThis, {
    exclusions,
    updateState,
    updateBottomLeft
  });
};

post_(20 /* kPgReq.actionInit */).then(_resolved => {
  conf_ = _resolved;
  setupPageOs_(conf_.os);
  const _url = conf_.url;
  let blockedMsg = $("#blocked-msg");
  enableNextTick_(1 /* kReadyInfo.action */);
  if (!conf_.runnable) {
    onNotRunnable(blockedMsg);
    initOptionsLink(_url);
    nextTick_(showI18n_);
    nextTick_(didShow);
    return;
  }
  nextTick_(versionEl => {
    blockedMsg.remove();
    blockedMsg = null;
    toggleReduceMotion_(conf_.reduceMotion);
    versionEl.textContent = conf_.ver;
  }, $("#version"));
  topUrl = conf_.topUrl || _url;
  url = conf_.frameUrl || topUrl;
  _onlyFirstMatch = conf_.exclusions.onlyFirst;
  bgSettings_.defaults_ = {
    exclusionRules: conf_.exclusions.defaults
  };
  setupSettingsCache_({
    exclusionRules: conf_.exclusions.rules
  });
  buildTester();
  conf_.exclusions = null;
  saveBtn2.onclick = saveOptions;
  document.addEventListener("keyup", onEnterKeyUp);
  initOptionsLink(_url);
  initQuickActions();
  updateBottomLeft();
  initExclusionRulesTable();
  nextTick_(showI18n_);
  setupBorderWidth_ && nextTick_(setupBorderWidth_);
  nextTick_(didShow);
});

const initQuickActions = () => {
  const helpBtn = document.getElementById("qa-help");
  const panelBtn = document.getElementById("qa-sidepanel");
  const readingBtn = document.getElementById("qa-reading");
  const bookmarkBtn = document.getElementById("qa-bookmark");
  const shortcuts = document.getElementById("qa-shortcuts");
  helpBtn && helpBtn.addEventListener("click", () => {
    post_(24 /* kPgReq.initHelp */);
  });
  panelBtn && panelBtn.addEventListener("click", () => {
    try {
      const sp = browser_.sidePanel;
      sp && conf_.tabId >= 0 && sp.open({
        tabId: conf_.tabId
      });
    } catch (_a) {}
  });
  readingBtn && readingBtn.addEventListener("click", () => {
    post_(38 /* kPgReq.runPageAction */ , {
      action: "readingList",
      tabId: conf_.tabId
    }).then(res => {
      if (res && res.message) {
        const el = document.getElementById("state-action");
        el && (el.textContent = " \xb7 " + res.message);
      }
    });
  });
  bookmarkBtn && bookmarkBtn.addEventListener("click", () => {
    post_(38 /* kPgReq.runPageAction */ , {
      action: "bookmark",
      tabId: conf_.tabId
    }).then(res => {
      if (res && res.message) {
        const el = document.getElementById("state-action");
        el && (el.textContent = " \xb7 " + res.message);
      }
    });
  });
  shortcuts && shortcuts.addEventListener("click", event => {
    prevent_(event);
    post_(15 /* kPgReq.focusOrLaunch */ , {
      u: "chrome://extensions/shortcuts"
    });
  });
};

const onEnterKeyUp = event => {
  if (event.keyCode === 13 /* kKeyCode.enter */) {
    const el = event.target;
    if (el instanceof HTMLAnchorElement) {
      el.hasAttribute("href") || setTimeout(el1 => {
        el1.click();
        el1.blur();
      }, 0, el);
    } else if (event.ctrlKey || event.metaKey) {
      const q = !saved && saveOptions();
      q && q.then(() => {
        setTimeout(window.close, 300);
      });
    }
  }
};

const didShow = () => {
  const docEl = document.documentElement;
  docEl.classList.remove("loading");
  docEl.style.width = "";
  docEl.style.height = "";
};

const onNotRunnable = blockedMsg => {
  const _url = conf_.url || "";
  const body = document.body;
  body.innerText = "";
  blockedMsg.style.display = "";
  blockedMsg.querySelector("#version").textContent = conf_.ver;
  const refreshTip = blockedMsg.querySelector("#refresh-after-install");
  let uad;
  let uaList;
  conf_.tabId < 0 || !_url || !/^(ht|s?f)tp/i.test(_url) ? refreshTip.remove() : !IsEdg_ && (uad = navigator.userAgentData, 
  (uaList = uad.brands) ? uaList.find(i => i.brand.includes("Opera")) : /\b(Opera|OPR)\//.test(navigator.userAgent)) && /\.(google|bing|baidu)\./.test(_url.split("/", 4).slice(0, 3).join("/")) && (blockedMsg.querySelector("#opera-warning").style.display = "");
  body.append(blockedMsg);
  const extIdToAdd = conf_.unknownExt;
  if (extIdToAdd) {
    const refusedEl = $("#injection-refused");
    refusedEl.style.display = "";
    refusedEl.nextElementSibling.remove();
    $("#doAllowExt").onclick = function() {
      this.onclick = null;
      post_(21 /* kPgReq.allowExt */ , [ conf_.tabId, extIdToAdd ]).then(() => {
        setTimeout(() => {
          location.reload();
        }, 0);
      });
    };
  }
  const retryInjectElement = $("#retryInject");
  if (!retryInjectElement) {
    return;
  }
  if (/^(file|ftps?|https?):/.test(_url) && conf_.tabId >= 0) {
    retryInjectElement.onclick = event => {
      prevent_(event);
      post_(6 /* kPgReq.runFgOn */ , conf_.tabId).then(() => {
        window.close();
      });
    };
  } else {
    retryInjectElement.nextElementSibling.remove();
    retryInjectElement.remove();
  }
};
import { CurCVer_, OnChrome, $, $$, nextTick_, pageLangs_, pageTrans_, post_, enableNextTick_, onDicts_, curPagePath_, setupPageOs_ } from "./async_bg.js";

const _globalDelegates = {};

export const showI18n_ = () => {
  if (pageLangs_ === "en") {
    return;
  }
  const lang1 = pageLangs_.split(",")[0];
  const langInput = navigator.language || lang1;
  let el = $("#keyMappings"), t = el && oTrans_("keyMappingsP");
  t && (el.placeholder = t);
  if (langInput && (!lang1.startsWith("zh") || langInput !== "zh-CN")) {
    for (el of $$("input[type=text], textarea")) {
      el.lang = langInput;
    }
  }
  for (el of $$("[data-i]")) {
    const i = el.dataset.i, isTitle = i.endsWith("-t");
    t = pageTrans_(isTitle ? i.slice(0, -2) : i);
    t != null && (isTitle ? el.title = t : el.textContent = t);
  }
  document.documentElement.lang = lang1 === "zh" ? "zh-CN" : lang1.replace("_", "-");
};

window.__extends = function(child, parent) {
  const __ = function() {
    this.constructor = child;
  };
  __.prototype = parent.prototype;
  child.prototype = new __;
};

export const debounce_ = (func, wait, bound_context, also_immediate) => {
  let timestamp, timeout = 0;
  const later = () => {
    const last = Date.now() - timestamp;
 // safe for time changes
        if (last < wait - /* for resolution tolerance */ 4 && last >= 0) {
      timeout = setTimeout(later, wait - last);
      return;
    }
    timeout = 0;
    timestamp !== also_immediate && func.call(bound_context);
  };
  also_immediate = also_immediate ? 1 : 0;
  return () => {
    timestamp = Date.now();
 // safe for time changes
        if (timeout) {
      also_immediate && (also_immediate = timestamp - 1);
      return;
    }
    timeout = setTimeout(later, wait);
    if (also_immediate) {
      also_immediate = timestamp;
      func.call(bound_context);
    }
  };
};

export const didBindEvent_ = ev => {
  const type = typeof ev !== "string" ? ev.type : ev;
  for (const delegate of _globalDelegates[type] || []) {
    for (const el of typeof delegate.selector_ === "string" ? $$(delegate.selector_) : [ delegate.selector_ ]) {
      delegate.capture_ !== "on" ? el.addEventListener(type, delegate.handler_, delegate.capture_) : el["on" + type] = delegate.handler_;
    }
  }
  _globalDelegates[type] = null;
  removeEventListener(type, didBindEvent_, true);
};

export const delayBinding_ = (selector_, type, handler_, capture_) => {
  let handlers = _globalDelegates[type];
  if (!handlers) {
    addEventListener(type, didBindEvent_, true);
    handlers = _globalDelegates[type] = [];
  }
  handlers.push({
    selector_,
    handler_,
    capture_: capture_ || false
  });
};

const _updateLock = "__locking";

let settingsCache_ = null;

export const setupSettingsCache_ = cache => {
  settingsCache_ = cache;
};

export const getSettingsCache_ = () => settingsCache_;

export const bgSettings_ = {
  platform_: "",
  defaults_: null,
  resetCache_() {
    settingsCache_ = null;
  },
  preloadCache_() {
    if (settingsCache_) {
      return settingsCache_ instanceof Promise ? settingsCache_ : Promise.resolve();
    }
    bgSettings_.defaults_ || post_(0 /* kPgReq.settingsDefaults */).then(res => {
      bgSettings_.defaults_ = res[0];
      setupPageOs_(res[1]);
      bgSettings_.platform_ = res[2];
      enableNextTick_(1 /* kReadyInfo.options */);
    });
    return settingsCache_ = post_(1 /* kPgReq.settingsCache */).then(res => {
      settingsCache_ = res;
    });
  },
  get_(key) {
    settingsCache_ == null && this.preloadCache_();
    if (settingsCache_ instanceof Promise) {
      return settingsCache_.then(() => this.get_(key));
    }
    const cached = settingsCache_[key];
    if (cached && cached instanceof Array && cached[0] === _updateLock) {
      throw new Error("unexpected bgSettings_.get_() when set_() is still waiting, with key = " + key);
    }
    return cached !== void 0 ? cached : this.defaults_[key];
  },
  set_(key, val) {
    if (settingsCache_ == null || settingsCache_ instanceof Promise) {
      throw new Error("invalid settingsCache_ when bgSettings_.set_() with key = " + key);
    }
    {
      let lock = settingsCache_[key];
      if (lock instanceof Array && lock[0] === _updateLock) {
        lock[1]++;
        console.trace("Warning: %o times of bgSettings_.set_() with key =", lock[1], key);
      } else {
        settingsCache_[key] = [ _updateLock, 1 ];
      }
    }
    const val0 = bgSettings_.defaults_[key];
    let val2 = val;
    val0 !== void 0 && (typeof val0 === "object" ? JSON.stringify(val) === JSON.stringify(val0) : val === val0) && (val2 = null);
    return post_(2 /* kPgReq.setSetting */ , {
      key,
      val: val2
    }).then(val3 => {
      if (settingsCache_ == null || settingsCache_ instanceof Promise) {
        throw new Error("settingsCache_ became invalid when bgSettings_.set_() with key = " + key);
      }
      {
        const lock = settingsCache_[key];
        if (--lock[1] > 0) {
          return;
        }
      }
      settingsCache_[key] = val3 !== null ? val3 : val;
    });
  },
  valuesToLoad_: {
    __proto__: null,
    filterLinkHints: "f",
    hideHud: "h",
    ignoreReadonly: "y",
    keyLayout: "l",
    mouseReachable: "e",
    keyboard: "k",
    keyupTime: "u",
    linkHintCharacters: "c",
    linkHintNumbers: "n",
    passEsc: "p",
    regexFindMode: "r",
    smoothScroll: "s",
    scrollStepSize: "t",
    waitForEnter: "w"
  },
  complexValuesToLoad_: {
    __proto__: null,
    c: 1,
    n: 1,
    l: 1,
    d: 1,
    p: 1,
    y: 1
  }
};

bgSettings_.preloadCache_();

//#endregion
export class Option_ {
  onSave_() {}
  constructor(element, onUpdated) {
    const field = element.id;
    this.field_ = field;
    this.element_ = element;
    this.previous_ = this.onUpdated_ = null;
    this.saved_ = false;
    this.locked_ = false;
    field in bgSettings_.valuesToLoad_ ? onUpdated = this._onCacheUpdated.bind(this, onUpdated) : field !== "autoDarkMode" && field !== "autoReduceMotion" || (onUpdated = this._manuallySyncCache.bind(this, onUpdated));
    this.onUpdated_ = debounce_(onUpdated, 330, this, 1);
    this.init_(element);
  }
  fetch_() {
    this.saved_ = true;
    const value = this.innerFetch_();
    if (value instanceof Promise) {
      return value.then(Option_.prototype.fetch_.bind(this));
    }
    this.previous_ = value;
    Option_.suppressPopulate_ || nextTick_(() => {
      this.populateElement_(this.previous_);
    });
  }
  innerFetch_() {
    return bgSettings_.get_(this.field_);
  }
  normalize_(value) {
    const checker = this.checker_;
    return checker ? checker.check_(value) : value;
  }
  allowToSave_() {
    return true;
  }
  async save_() {
    let value = this.readValueFromElement_(), isJSON = typeof value === "object", previous = isJSON ? JSON.stringify(this.previous_) : this.previous_, pod = isJSON ? JSON.stringify(value) : value;
    if (pod === previous) {
      return;
    }
    previous = pod;
    const _val = this.normalize_(value);
    value = _val instanceof Promise ? await _val : _val;
    value = await this.executeSave_(value);
    this.previous_ = value;
    this.saved_ = true;
    (previous !== (isJSON ? JSON.stringify(value) : value) || this.doesPopulateOnSave_(value)) && nextTick_(() => {
      this.populateElement_(this.previous_, true);
    });
    return this.onSave_();
  }
  isDirty_() {
    const latest = this.innerFetch_();
    const diff = !this.areEqual_(this.previous_, latest);
    if (diff && this.areEqual_(latest, this.readValueFromElement_())) {
      this.previous_ = latest;
      this.saved_ = true;
      return false;
    }
    return diff;
  }
  async executeSave_(value) {
    await bgSettings_.set_(this.field_, value);
    this.field_ in bgSettings_.valuesToLoad_ && Option_.syncToFrontend_.push(this.field_);
    return this.innerFetch_();
  }
  doesPopulateOnSave_(_val) {
    return false;
  }
  areEqual_(old, newVal) {
    return old === newVal;
  }
}

Option_.all_ = {};

Option_.syncToFrontend_ = null;

Option_.onFgCacheUpdated_ = null;

Option_.suppressPopulate_ = false;

export class ExclusionRulesOption_ extends Option_ {
  init_(element) {
    this.template_ = element.querySelector("#exclusionTemplate").content.querySelector(".exclusionRule");
    this.$list_ = element.querySelector("tbody");
    this.list_ = [];
    delayBinding_(this.$list_, "input", ExclusionRulesOption_.MarkChanged_);
    delayBinding_(this.$list_, "input", this.onUpdated_);
    delayBinding_(this.$list_, "click", e => {
      this.onRemoveRow_(e);
    });
    this._rendered = false;
    delayBinding_("#exclusionAddButton", "click", () => this.addRule_(""), "on");
  }
  onRowChange_(_isInc) {}
  static MarkChanged_(event) {
    const target = event.target;
    const vnode = target.vnode;
    vnode && (vnode.changed_ |= target.classList.contains("pattern") ? 1 /* kExclusionChange.pattern */ : 2 /* kExclusionChange.passKeys */);
  }
  addRule_(pattern, autoFocus) {
    const isInited = autoFocus !== false, old = isInited && this.$list_.childElementCount;
    const vnode = this.appendRuleTo_(this.$list_, {
      passKeys: "",
      pattern
    });
    pattern && (vnode.savedRule_ = {
      passKeys: "",
      pattern: ""
    });
    const item = this.list_[this.list_.length - 1];
    if (isInited) {
      old >= 4 && this.element_.scrollBy(0, 40);
      nextTick_(() => item.$pattern_.focus());
    }
    pattern && this.onUpdated_();
    this.onRowChange_(1);
  }
  populateElement_(rules) {
    if (!this._rendered) {
      this._rendered = true;
      for (const el of pageLangs_ !== "en" ? $$("[title]", this.template_) : []) {
        const t = pageTrans_(el.title);
        t && (el.title = t);
      }
    }
    this.$list_.innerText = "";
    this.list_ = [];
    if (rules.length <= 0) {} else if (rules.length === 1) {
      this.appendRuleTo_(this.$list_, rules[0]);
    } else {
      const frag = document.createDocumentFragment();
      rules.forEach(this.appendRuleTo_.bind(this, frag));
      this.$list_.append(frag);
    }
    return this.onRowChange_(rules.length);
  }
  checkNodeVisible_(_vnode) {
    return true;
  }
  appendRuleTo_(list, rule_) {
    const {passKeys, pattern} = rule_, vnode = {
      // rebuild a rule, to ensure a consistent memory layout
      rule_,
      matcher_: null,
      changed_: 0 /* kExclusionChange.NONE */ ,
      visible_: false,
      $pattern_: null,
      $keys_: null,
      savedRule_: rule_
    };
    vnode.visible_ = this.checkNodeVisible_(vnode);
    if (!vnode.visible_) {
      this.list_.push(vnode);
      return vnode;
    }
    const row = document.importNode(this.template_, true), patternEl = row.querySelector(".pattern"), passKeysEl = row.querySelector(".passKeys"), trimmedKeys = passKeys.trimRight();
    patternEl.value = pattern;
    pattern && (patternEl.placeholder = "");
    passKeysEl.value = trimmedKeys;
    trimmedKeys && (passKeysEl.placeholder = "");
    vnode.$pattern_ = patternEl;
    vnode.$keys_ = passKeysEl;
    patternEl.vnode = vnode;
    passKeysEl.vnode = vnode;
    this.updateVNode_(vnode, pattern, passKeys);
    this.list_.push(vnode);
    list.append(row);
    return vnode;
  }
  static OnNewKeys_(vnode) {
    vnode.rule_.pattern && vnode.$keys_.placeholder && (vnode.$keys_.placeholder = "");
  }
  onRemoveRow_(event) {
    let element = event.target;
    element.localName === "path" && (element = element.parentElement);
    element.localName === "svg" && (element = element.parentElement);
    if (!element.classList.contains("remove")) {
      return;
    }
    element = element.parentNode.parentNode;
    if (element.classList.contains("exclusionRule")) {
      const vnode = element.querySelector(".pattern").vnode;
      element.remove();
      event.preventDefault();
      vnode.changed_ & 4 /* kExclusionChange.mismatches */ && vnode.savedRule_.pattern ? Object.assign(vnode, {
        rule_: {
          passKeys: "",
          pattern: ""
        },
        matcher_: false,
        changed_: 12 /* kExclusionChange.deleted */ ,
        $pattern_: null,
        $keys_: null
      }) : this.list_.splice(this.list_.indexOf(vnode), 1);
      this.onUpdated_();
      return this.onRowChange_(0);
    }
  }
  static onFormatKey_(old, modifiers, ch) {
    const chLower = ch.toLowerCase();
    return modifiers || ch.length !== 1 ? ch !== chLower ? `<${modifiers}s-${chLower}>` : old : ch;
  }
  static formatKeys_(keys) {
    return keys && keys.replace(/<(?!<)((?:[acm]-){0,3})(\S|[A-Za-z]\w+)>/g, ExclusionRulesOption_.onFormatKey_);
  }
  readValueFromElement_(part) {
    const rules = [];
    part = part === true;
    for (const vnode of this.list_) {
      if (part && !vnode.visible_) {
        continue;
      }
      const changed = vnode.changed_;
      if (!changed || !(changed & 3 /* kExclusionChange.passKeys */)) {
        vnode.rule_.pattern && rules.push(vnode.rule_);
        continue;
      }
      let pattern = changed & 1 /* kExclusionChange.pattern */ ? vnode.$pattern_.value.trim() : vnode.rule_.pattern;
      let fixTail = false, passKeys = changed & 2 /* kExclusionChange.passKeys */ ? vnode.$keys_.value : vnode.rule_.passKeys;
      if (!pattern) {
        this.updateVNode_(vnode, "", passKeys);
        continue;
      }
      if (changed & 1 /* kExclusionChange.pattern */) {
        const isOtherProtocol = /^(about|vimium):/i.test(pattern);
        let schemeLen = pattern.startsWith(":") ? 0 : pattern.indexOf("://");
        if (schemeLen) {
          if (/^[\^*]|[^\\][$()*+?\[\]{|}]/.test(pattern)) {
            if (pattern.startsWith("`")) {} else if (pattern.startsWith("^")) {
              const ind = ".*$".includes(pattern.slice(-2)) ? pattern.endsWith(".*$") ? 3 : pattern.endsWith(".*") ? 2 : 0 : 0;
              pattern = ind !== 0 && pattern[pattern.length - ind] !== "\\" ? pattern.slice(0, -ind) : pattern;
            } else {
              fixTail = !pattern.includes("/", schemeLen + 3);
              if (pattern.endsWith("*")) {
                pattern = pattern.slice(0, /^[^\\]\.\*$/.test(pattern.slice(-3)) ? -2 : -1);
                fixTail = false;
              }
              pattern = pattern.startsWith(".*") && !/[(\\[]/.test(pattern) ? "*." + pattern.slice(2) : pattern;
              let host2 = pattern;
              host2 = (schemeLen < 0 && !isOtherProtocol ? "^https?://" : "^") + (host2.startsWith("*") && host2[1] !== "." ? "[^/]" + host2 : (host2 = host2.replace(/\./g, "\\."), 
              // lgtm [js/incomplete-sanitization]
              host2.startsWith("*") ? host2.replace("*\\.", "(?:[^./]+\\.)*?") : host2.replace("://*\\.", "://(?:[^./]+\\.)*?")));
              pattern = _testRe(host2, "") ? host2 : pattern.includes("*") || pattern.includes("/") || isOtherProtocol ? ":" + pattern : ":https://" + (pattern.startsWith(".") ? pattern.slice(1) : pattern);
            }
          } else {
            fixTail = !pattern.includes("/", schemeLen + 3) && !isOtherProtocol;
            pattern = pattern.replace(/\\(.)/g, "$1");
            pattern = (schemeLen < 0 && !isOtherProtocol ? ":http://" : ":") + pattern;
          }
        }
        fixTail && (pattern += "/");
      }
      if (changed & 2 /* kExclusionChange.passKeys */ && passKeys) {
        passKeys = ExclusionRulesOption_.formatKeys_(passKeys);
        const passArr = passKeys.match(/<(?!<)(?:a-)?(?:c-)?(?:m-)?(?:s-)?(?:[a-z]\w+|[^\sA-Z])>|\S/g);
        if (passArr) {
          const isReversed = passArr[0] === "^" && passArr.length > 1;
          isReversed && passArr.shift();
          passArr.sort();
          isReversed ? passArr.unshift("^") : passArr[0] === "^" && (passArr.shift(), passArr.push("^"));
        }
        passKeys = passArr ? passArr.join(" ") + " " : "";
        passKeys = passKeys.replace(/<escape>/gi, "<esc>");
      }
      this.updateVNode_(vnode, pattern, passKeys);
      rules.push(vnode.rule_);
    }
    return rules;
  }
  updateVNode_(vnode, pattern, keys) {
    const hasNewKeys = !vnode.rule_.passKeys && !!keys;
    vnode.rule_ = {
      passKeys: keys,
      pattern
    };
    vnode.matcher_ = null;
    vnode.changed_ &= -4 /* kExclusionChange.passKeys */;
    hasNewKeys && ExclusionRulesOption_.OnNewKeys_(vnode);
  }
  onSave_() {
    for (let i = 0, rules = this.list_; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule.visible_) {
        continue;
      }
      if (rule.changed_ & 8 /* kExclusionChange.deleted */) {
        rules.splice(i--, 1);
        continue;
      }
      rule.savedRule_ = rule.rule_;
      rule.$pattern_.value !== rule.rule_.pattern && (rule.$pattern_.value = rule.rule_.pattern);
      const passKeys = rule.rule_.passKeys.trim();
      rule.$keys_.value !== passKeys && (rule.$keys_.value = passKeys);
    }
  }
  areEqual_(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

const _testRe = (pattern, suffix) => {
  try {
    return new RegExp(pattern, suffix);
  } catch (_a) {
    return null;
  }
};

export let setupBorderWidth_ = devicePixelRatio < 2 ? () => {
  const css = document.createElement("style"), ratio = devicePixelRatio;
  const onlyInputs = ratio >= 1;
  let scale = 1 / ratio;
  scale += 999e-8;
  scale = ("" + scale).slice(0, 7).replace(/\.?0+$/, "");
  css.textContent = onlyInputs ? `html { --vc-tiny: ${scale}px; }` : `* { border-width: ${scale}px !important; }`;
  document.head.append(css);
} : null;

export const oTrans_ = (k, a) => pageTrans_(k, a) || "";

Object.assign(window, {
  Option_,
  oTrans_
});
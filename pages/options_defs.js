import { CurCVer_, OnChrome, OnFirefox, $, $$, nextTick_, post_, enableNextTick_, toggleReduceMotion_, OnEdge, CurFFVer_, OnSafari, prevent_, bTrans_ } from "./async_bg.js";

import { bgSettings_, Option_, ExclusionRulesOption_, oTrans_, delayBinding_ } from "./options_base.js";

Option_.syncToFrontend_ = [];

Option_.prototype._onCacheUpdated = function(func) {
  const val = func.call(this);
  if (this.field_ === "passEsc" || this.field_ === "ignoreReadonly") {
    this.locked_ || this.normalize_(val);
  } else if (VApi && !this.locked_) {
    const shortKey = bgSettings_.valuesToLoad_[this.field_];
    const p = shortKey in bgSettings_.complexValuesToLoad_ ? post_(3 /* kPgReq.updatePayload */ , {
      key: shortKey,
      val
    }) : Promise.resolve(val);
    p.then(val2 => {
      var _a;
      VApi.z[shortKey] = val2 != null ? val2 : val;
      if (shortKey === "l") {
        const misc = VApi.y(), root = misc.r, frame = root && root.querySelector("iframe.Omnibar");
        frame && post_(29 /* kPgReq.updateOmniPayload */ , {
          key: shortKey,
          val: val2 != null ? val2 : val
        });
      }
      (_a = Option_.onFgCacheUpdated_) === null || _a === void 0 || _a.call(Option_);
    });
  }
};

Option_.prototype._manuallySyncCache = function(func) {
  const rawVal = func.call(this);
  if (this.locked_) {} else if (this.field_ === "autoReduceMotion") {
    const val = rawVal === 1 || rawVal !== 0 && matchMedia("(prefers-reduced-motion: reduce)").matches;
    VApi && (VApi.z.m = val);
    toggleReduceMotion_(val);
  } else {
    this.onSave_();
  }
};

Option_.saveOptions_ = async () => {
  const arr = Option_.all_, dirty = [];
  bgSettings_.resetCache_();
  const permissions = arr.optionalPermissions;
  const permissionsPromise = permissions && permissions.save_();
  await Promise.all([ bgSettings_.preloadCache_(), permissionsPromise ]);
  for (const i in arr) {
    const opt = arr[i];
    !opt.saved_ && opt.isDirty_() && dirty.push(opt.i18nName_());
  }
  if (dirty.length > 0) {
    let ok = confirm(oTrans_("dirtyOptions", [ dirty.join("\n  * ") ]));
    if (!ok) {
      return false;
    }
  }
  for (const i in arr) {
    const opt = arr[i];
    if (!opt.saved_ && !opt.allowToSave_()) {
      return false;
    }
  }
  enableNextTick_(8 /* kReadyInfo.LOCK */);
  arr.vimSync.saved_ || await arr.vimSync.save_();
  arr.exclusionRules.saved_ || await arr.exclusionRules.save_();
  const q = [];
  for (const i in arr) {
    const item = arr[i];
    item.saved_ || q.push(item.save_());
  }
  await Promise.all(q);
  enableNextTick_(0 /* kReadyInfo.NONE */ , 8 /* kReadyInfo.LOCK */);
  return true;
};

Option_.needSaveOptions_ = () => {
  const arr = Option_.all_;
  for (const i in arr) {
    if (!arr[i].saved_) {
      return true;
    }
  }
  return false;
};

Option_.prototype.i18nName_ = function() {
  let el = this.element_;
  if (this instanceof BooleanOption_) {
    return el.nextElementSibling.textContent;
  }
  el = el.closest("tr");
  el = el && el.querySelector(".caption");
  if (!el) {
    console.log("[WARNING] No i18n name found for Option #" + this.field_);
    return this.field_;
  }
  return el.innerText.replace(/[\r\n]/g, "");
};

// in fact, it's IntegerOption
export class NumberOption_ extends Option_ {
  init_() {
    let s, i;
    this.checker_ = {
      min: (s = this.element_.min) && !isNaN(i = parseFloat(s)) ? i : null,
      max: (s = this.element_.max) && !isNaN(i = parseFloat(s)) ? i : null,
      default: 0,
      check_: NumberOption_.Check_
    };
    delayBinding_(this.element_, "input", this.onUpdated_);
    delayBinding_(this.element_, "focus", this.addWheelListener_.bind(this));
    nextTick_(() => {
      this.checker_.default = bgSettings_.defaults_[this.field_];
    });
  }
  populateElement_(value) {
    this.element_.value = "" + value;
  }
  readValueFromElement_() {
    return Math.round(parseFloat(this.element_.value));
  }
  addWheelListener_() {
    const el = this.element_, func = e => this.onWheel_(e), onBlur = () => {
      el.removeEventListener("wheel", func, {
        passive: false
      });
      el.removeEventListener("blur", onBlur);
      this.wheelTime_ = 0;
    };
    this.wheelTime_ = 0;
    el.addEventListener("wheel", func, {
      passive: false
    });
    el.addEventListener("blur", onBlur);
  }
  onWheel_(event) {
    prevent_(event);
    const oldTime = this.wheelTime_;
    let i = Date.now();
 // safe for time changes
        if (i - oldTime < 100 && i + 99 > oldTime && oldTime) {
      return;
    }
    this.wheelTime_ = i;
    const el = this.element_, inc = (event.deltaY || event.deltaX) > 0, val0 = el.value;
    let val, func = inc ? el.stepUp : el.stepDown;
    if (typeof func === "function") {
      func.call(el);
      val = el.value;
      el.value = val0;
    } else {
      func = parseFloat;
      let step = func(el.step) || 1;
      i = (+el.value || 0) + (inc ? step : -step);
      isNaN(step = func(el.max)) || (i = Math.min(i, step));
      isNaN(step = func(el.min)) || (i = Math.max(i, step));
      val = "" + i;
    }
    return this.atomicUpdate_(val, oldTime > 0, false);
  }
  static Check_(value) {
    isNaN(value) && (value = this.default);
    value = this.min != null ? Math.max(this.min, value) : value;
    return this.max != null ? Math.min(this.max, value) : value;
  }
}

export class BooleanOption_ extends Option_ {
  init_() {
    const el = this.element_;
    let map = el.dataset.map;
    this.map_ = map ? JSON.parse(map) : el.dataset.allowNull ? BooleanOption_.map_for_3_ : BooleanOption_.map_for_2_;
    this.true_index_ = this.map_.length - 1;
    this.true_index_ > 1 && this.field_ !== "vimSync" && delayBinding_(el, "input", this.onTripleStatusesClicked.bind(this), true);
    delayBinding_(el, "change", this.onUpdated_);
  }
  populateElement_(value) {
    // support false/true when .map_ is like [0, 1, 2]
    const is_true = value === true || value === this.map_[this.true_index_];
    this.element_.checked = is_true;
    this.element_.indeterminate = this.true_index_ > 1 && value === this.map_[1];
    this.inner_status_ = is_true ? this.true_index_ : Math.max(0, this.map_.indexOf(value));
  }
  readValueFromElement_() {
    let value = this.element_.indeterminate ? this.map_[1] : this.map_[this.element_.checked ? this.true_index_ : 0];
    return value;
  }
  onTripleStatusesClicked(event) {
    this.inner_status_ = BooleanOption_.ToggleTripleStatuses(this.inner_status_, event);
  }
  static ToggleTripleStatuses(old, event) {
    const elemenc = event.target;
    prevent_(event);
    const newVal = old === 2 ? 1 : old ? 0 : 2;
    elemenc.indeterminate = old === 2;
    elemenc.checked = newVal === 2;
    return newVal;
  }
  normalize_(value) {
    this.element_.dataset.map && typeof value === "boolean" && (value = this.map_[value ? this.true_index_ : 0]);
    return value;
  }
  static ToggleDisabled_(el, disabled) {
    el.disabled = disabled;
    const text = el.nextElementSibling;
    text.tabIndex = disabled ? -1 : 0;
    text.ariaDisabled = disabled || null;
  }
}

BooleanOption_.map_for_2_ = [ false, true ];

BooleanOption_.map_for_3_ = [ false, null, true ];

export class TextOption_ extends Option_ {
  constructor() {
    super(...arguments);
    this._lastError = false;
  }
  init_() {
    const converter = this.element_.dataset.converter || "";
    const ops = converter ? converter.split(" ") : [];
    delayBinding_(this.element_, "input", this.onUpdated_);
    ops.length > 0 && (this.checker_ = {
      ops_: ops,
      status_: 0,
      check_: TextOption_.normalizeByOps_
    });
  }
  fetch_() {
    let p = super.fetch_();
    const checker = this.checker_;
    if (checker) {
      // allow old users to correct mistaken chars and save
      checker.status_ = 0;
      p ? p = p.then(() => {
        checker.status_ = checker.check_(this.previous_) === this.previous_ ? 1 : 0;
      }) : checker.status_ = checker.check_(this.previous_) === this.previous_ ? 1 : 0;
    }
    return p;
  }
  populateElement_(value, enableUndo) {
    // not replace spaces with \xa0 - the old issue is not reproducible even on Chrome 35/48 + Win 10
    const value2 = this.formatValue_(value);
    enableUndo !== true ? this.element_.value = value2 : this.atomicUpdate_(value2, true, true);
  }
  readRaw_() {
    return this.element_.value.trim().replace(/\xa0/g, " ");
  }
  formatValue_(value) {
    return value;
  }
  /** @returns `string` in fact */  readValueFromElement_() {
    let value = this.readRaw_();
    const checker = this.checker_;
    if (value && checker && checker.check_ === TextOption_.normalizeByOps_) {
      checker.status_ |= 2;
      value = TextOption_.normalizeByOps_.call(checker, value);
      checker.status_ &= -3;
    }
    return value;
  }
  doesPopulateOnSave_(val) {
    return this.formatValue_(val) !== this.readRaw_();
  }
  showError_(msg, tag) {
    const hasError = !!msg;
    if (!hasError && !this._lastError) {
      return;
    }
    this._lastError = hasError;
    TextOption_.showError_(msg, tag, this.element_);
  }
  static showError_(msg, tag, el) {
    const hasError = !!msg;
    const {classList: cls} = el;
    let errEl = el.nextElementSibling;
    errEl = errEl && errEl.classList.contains("tip") ? errEl : null;
    if (!hasError && !errEl) {
      return;
    }
    nextTick_(() => {
      if (hasError) {
        if (errEl == null) {
          errEl = document.createElement("div");
          errEl.className = "tip";
          el.after(errEl);
        }
        errEl.textContent = msg;
        tag !== null && cls.add(tag || "has-error");
      } else {
        cls.remove("has-error"), cls.remove("highlight");
        errEl && errEl.remove();
      }
    });
  }
  static normalizeByOps_(value) {
    const ops = this.ops_;
    ops.indexOf("lower") >= 0 ? value = value.toUpperCase().toLowerCase() : ops.indexOf("upper") >= 0 && (value = value.toLowerCase().toUpperCase());
    value = value.normalize();
    if (ops.indexOf("chars") < 0 || this.status_ & 2 && !(this.status_ & 1)) {
      return value;
    }
    let str2 = "";
    for (let ch of value.replace(/\s/g, "")) {
      str2.includes(ch) || (str2 += ch);
    }
    return str2;
  }
}

export class NonEmptyTextOption_ extends TextOption_ {
  readValueFromElement_() {
    this.element_.value.trim() || this.populateElement_(bgSettings_.defaults_[this.field_], true);
    return super.readValueFromElement_();
  }
}

export class CssSelectorOption_ extends NonEmptyTextOption_ {
  readRaw_() {
    const value = super.readRaw_();
    return value.replace(/:default\([^)]*\)/, ":default" /* GlobalConsts.kCssDefault */);
  }
  formatValue_(value) {
    value = value.replace(/(?:^# |\/\/)[^\n]*|([,>] ?)(?!$|\n)/g, (full, s) => s ? s !== ">" ? ", " : " > " : full);
    value = value.replace(/(^|\n):default(?!\()(, \S)?/, (_, prefix, suffix) => {
      const val_with_default = `:default(${this.getRealDefault()})`;
      return prefix + CssSelectorOption_.WrapAndOutput_(val_with_default) + (suffix ? ",\n" + suffix[2] : "");
    });
    return value;
  }
  getRealDefault() {
    return bTrans_(this.field_ === "passEsc" ? "121" /* kTip.defaultPassEsc */ : "120" /* kTip.defaultIgnoreReadonly */);
  }
  static WrapAndOutput_(line) {
    const hostSep = line.indexOf("##");
    let str = hostSep >= 0 ? line.slice(0, hostSep + 2) : "";
    let output = "";
    line = hostSep >= 0 ? line.slice(hostSep + 2) : line;
    line = line.replace(/,|>/g, s => s === "," ? ", " : " > ").trimRight();
    for (const i of line.split(", ")) {
      if (str && str.length + i.length > 62) {
        output = str.endsWith("#") ? str : (output ? output + "\n" : "") + str + ",";
        str = "  " + i;
      } else {
        str = str ? str + (str.endsWith("#") ? "" : ", ") + i : i;
      }
    }
    return str ? (output ? output + "\n" : "") + str.trimRight() : output;
  }
}

export class JSONOption_ extends TextOption_ {
  formatValue_(obj) {
    const one = this.element_ instanceof HTMLInputElement, s0 = JSON.stringify(obj, null, one ? 1 : 2);
    return one ? s0.replace(/(,?)\n\s*/g, (_, s) => s ? ", " : "") : s0;
  }
  readValueFromElement_() {
    let value = super.readValueFromElement_(), obj = null;
    if (value) {
      try {
        obj = JSON.parse(value);
      } catch (_a) {}
    } else {
      obj = bgSettings_.defaults_[this.field_];
      this.populateElement_(obj, true);
    }
    return obj;
  }
  static stableClone_(src) {
    if (!src || typeof src !== "object") {
      return src;
    }
    if (src instanceof Array) {
      return src.map(JSONOption_.stableClone_);
    }
    const dest = {};
    for (let key of Object.keys(src).sort()) {
      dest[key] = JSONOption_.stableClone_(src[key]);
    }
    return dest;
  }
  areEqual_(a, b) {
    return JSON.stringify(a) === JSON.stringify(JSONOption_.stableClone_(b));
  }
  normalize_(value) {
    return JSONOption_.stableClone_(value);
  }
}

export class MaskedText_ extends TextOption_ {
  init_() {
    super.init_();
    this.masked_ = true;
    this._myCancelMask = this.cancelMask_.bind(this);
    delayBinding_(this.element_, "focus", this._myCancelMask);
  }
  cancelMask_() {
    if (!this._myCancelMask) {
      return;
    }
    this.element_.removeEventListener("focus", this._myCancelMask);
    this.element_.classList.remove("masked");
    this._myCancelMask = null;
    this.masked_ = false;
    this.element_.removeAttribute("placeholder");
    this.fetch_();
  }
  populateElement_(value, enableUndo) {
    if (this.masked_) {
      this.element_.placeholder = oTrans_("clickToUnmask");
      return;
    }
    super.populateElement_(value, enableUndo);
  }
  readRaw_() {
    return this.masked_ ? this.previous_ : super.readRaw_();
  }
}

TextOption_.prototype.atomicUpdate_ = NumberOption_.prototype.atomicUpdate_ = function(value, undo, locked) {
  const input = this.element_, initialValue = input.value;
  let selection = input.selectionDirection !== "backward" ? input.selectionEnd : input.selectionStart;
  let newFocused = false;
  if (undo) {
    this.locked_ = true;
    newFocused = document.activeElement !== input;
    newFocused && input.focus();
    document.execCommand("undo");
  }
  this.locked_ = locked;
  if (selection == null) {
    input.select();
    document.execCommand("insertText", false, value);
    newFocused && this.element_.blur();
  } else {
    const oldValue = undo ? input.value : initialValue;
    let left = input.scrollLeft, top = input.scrollTop;
    let diffStart = 0, diffLast = oldValue.length - 1, newLast = value.length - 1;
    let limit = Math.min(diffLast, newLast);
    while (diffStart <= limit && oldValue[diffStart] === value[diffStart]) {
      diffStart++;
    }
    limit = Math.max(diffStart, diffLast - (newLast - diffStart));
    while (limit <= diffLast && oldValue[diffLast] === value[newLast]) {
      diffLast--, newLast--;
    }
    input.setSelectionRange(diffStart, diffLast + 1);
    const diffValue = value.slice(diffStart, newLast + 1);
    document.execCommand("insertText", false, diffValue);
    newFocused && input.blur();
    if (initialValue !== oldValue) {
      diffStart = 0, diffLast = initialValue.length - 1, newLast = value.length - 1;
      limit = Math.min(diffLast, newLast);
      while (diffStart <= limit && initialValue[diffStart] === value[diffStart]) {
        diffStart++;
      }
      limit = Math.max(diffStart, diffLast - (newLast - diffStart));
      while (limit <= diffLast && initialValue[diffLast] === value[newLast]) {
        diffLast--, newLast--;
      }
    }
    if (selection) {
      if (selection === initialValue.length) {
        left = input.scrollWidth, top = input.scrollHeight;
        selection = value.length;
      } else if (selection < diffStart) {} else if (selection > diffLast) {
        selection += newLast - diffLast;
      } else {
        const oldOffset = initialValue.slice(0, selection).split("\n"), rows = oldOffset.length;
        const newOffset = value.split("\n").slice(0, rows);
        newOffset.length === rows && (newOffset[rows - 1] = newOffset[rows - 1].slice(0, oldOffset[rows - 1].length));
        selection = newOffset.reduce((i, j) => i + j.length, 0) + newOffset.length - 1;
      }
    } else {
      left = top = 0;
    }
    input.scrollTo(left, top);
    input.setSelectionRange(selection, selection);
  }
  this.locked_ = false;
};

ExclusionRulesOption_.prototype.onRowChange_ = function(isAdd) {
  if (this.list_.length !== isAdd) {
    return;
  }
  const el = $("#exclusionToolbar"), options = $$("[data-model]", el);
  el.style.visibility = isAdd ? "" : "hidden";
  for (const optionEl of options) {
    const opt = Option_.all_[optionEl.id], style = opt.element_.parentNode.style;
    style.visibility = isAdd || opt.saved_ ? "" : "visible";
    style.display = !isAdd && opt.saved_ ? "none" : "";
  }
};

export const saveBtn_ = $("#saveOptions");

export const exportBtn_ = $("#exportButton");

export let savedStatus_;

export let registerClass_;

export const createNewOption_ = (() => {
  let status = false;
  savedStatus_ = newStat => status = newStat != null ? newStat : status;
  const onUpdated = function() {
    if (this.locked_) {
      return;
    }
    const rawVal = this.readValueFromElement_();
    if (this.saved_ = this.areEqual_(this.previous_, rawVal)) {
      if (status && !Option_.needSaveOptions_()) {
        saveBtn_.disabled = true;
        saveBtn_.firstChild.data = oTrans_("115");
        exportBtn_.disabled = false;
        savedStatus_(false);
        window.onbeforeunload = null;
      }
      return rawVal;
    }
    if (status) {
      return rawVal;
    }
    window.onbeforeunload = onBeforeUnload;
    savedStatus_(true);
    saveBtn_.disabled = false;
    saveBtn_.firstChild.data = oTrans_("115_2");
    exportBtn_.disabled = true;
    return rawVal;
  };
  const types = {
    Number: NumberOption_,
    Boolean: BooleanOption_,
    Text: TextOption_,
    NonEmptyText: NonEmptyTextOption_,
    JSON: JSONOption_,
    MaskedText: MaskedText_,
    ExclusionRules: ExclusionRulesOption_,
    CssSelector: CssSelectorOption_
  };
  const createOption = element => {
    const cls = types[element.dataset.model];
    const instance = new cls(element, onUpdated);
    return Option_.all_[instance.field_] = instance;
  };
  Option_.suppressPopulate_ = true;
  for (const el of $$('[data-model]:not([data-model=""])')) {
    createOption(el);
  }
  registerClass_ = (name, cls) => {
    types[name] = cls;
  };
  return createOption;
})();

{
  const exclusionRules = Option_.all_.exclusionRules, table = exclusionRules.$list_;
  table.ondragstart = event => {
    const dragged = event.target;
    const cur = document.activeElement;
    if (cur.localName === "input") {
      cur !== dragged && prevent_(event);
      return;
    }
    exclusionRules.dragged_ = dragged;
    dragged.style.opacity = "0.5";
  };
  table.ondragend = () => {
    const dragged = exclusionRules.dragged_;
    exclusionRules.dragged_ = null;
    dragged && (dragged.style.opacity = "");
  };
  table.ondragover = event => {
    exclusionRules.dragged_ && prevent_(event);
  };
  table.ondrop = event => {
    prevent_(event);
    const dragged = exclusionRules.dragged_;
    if (!dragged) {
      return;
    }
    let target = event.target;
    target = target.closest(".exclusionRule");
    if (!target || dragged === target) {
      return;
    }
    target.before(dragged);
    const list = exclusionRules.list_, srcNode = dragged.querySelector(".pattern").vnode, targetNode = target.querySelector(".pattern").vnode;
    list.splice(list.indexOf(srcNode), 1);
    list.splice(list.indexOf(targetNode), 0, srcNode);
    exclusionRules.onUpdated_();
  };
}

const keyMappingsOption_ = Option_.all_.keyMappings;

const normalizeKeyMappings = value => {
  const re = new RegExp("^#![^\\n]*|^[^]", "gm");
  let arr;
  while (arr = re.exec(value)) {
    const line = arr[0];
    if (line && line[0] !== "\n") {
      if (line[0] !== "#" /* kMappingsFlag.char0 */) {
        break;
      }
      if (line[1] === "!" /* kMappingsFlag.char1 */) {
        const flag = line.slice(2).trim();
        if (flag === "no-check" /* kMappingsFlag.noCheck */) {
          value = value.slice(0, arr.index) + value.slice(arr.index + line.length).trimLeft();
          break;
        }
      }
    }
  }
  value = value.replace(/\.activateMode(?:To)?/g, ".activate");
  return value;
};

keyMappingsOption_.innerFetch_ = function() {
  const val = Option_.prototype.innerFetch_.call(this);
  return val instanceof Promise ? val.then(normalizeKeyMappings) : normalizeKeyMappings(val);
};

keyMappingsOption_.normalize_ = function(value) {
  value = normalizeKeyMappings(value);
  return Option_.prototype.normalize_.call(this, value);
};

export const onKeyMappingsError_ = err => {
  err === true ? keyMappingsOption_.showError_(oTrans_("ignoredNonEN"), null) : keyMappingsOption_.showError_(err);
};

const linkHintCharactersOption_ = Option_.all_.linkHintCharacters;

const linkHintNumbersOption_ = Option_.all_.linkHintNumbers;

const filterLinkHintsOption_ = Option_.all_.filterLinkHints;

linkHintCharactersOption_.onSave_ = linkHintNumbersOption_.onSave_ = function() {
  this.showError_(!this.element_.style.display && this.previous_.length < 4 /* GlobalConsts.MinHintCharSetSize */ ? "Too few characters for LinkHints" : "");
};

filterLinkHintsOption_.onSave_ = () => {
  nextTick_(() => {
    const enableFilterLinkHints = filterLinkHintsOption_.readValueFromElement_();
 // also used during change events
        linkHintNumbersOption_.element_.style.display = enableFilterLinkHints ? "" : "none";
    linkHintCharactersOption_.element_.style.display = enableFilterLinkHints ? "none" : "";
    BooleanOption_.ToggleDisabled_(Option_.all_.waitForEnter.element_, !enableFilterLinkHints);
    linkHintCharactersOption_.onSave_();
    linkHintNumbersOption_.onSave_();
  });
};

delayBinding_(filterLinkHintsOption_.element_, "change", filterLinkHintsOption_.onSave_, true);

const keyLayout = Option_.all_.keyLayout;

const [elAlwaysIgnore, elIgnoreIfAlt, elIgnoreIfNotASCII, elIgnoreCaps, elMapModifier, elInPrivResistFp] = $$("input", keyLayout.element_);

keyLayout.readValueFromElement_ = () => {
  let flags = 0;
  if (elAlwaysIgnore.checked) {
    flags = 1 /* kKeyLayout.alwaysIgnore */;
  } else {
    flags |= elIgnoreIfAlt.checked ? 8 /* kKeyLayout.ignoreIfAlt */ : 0;
    flags |= elIgnoreIfNotASCII.checked ? 2 /* kKeyLayout.ignoreIfNotASCII */ : elIgnoreIfNotASCII.indeterminate ? 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */ : 0;
    flags |= elIgnoreCaps.checked ? 16 /* kKeyLayout.ignoreCaps */ : elIgnoreCaps.indeterminate ? 512 /* kKeyLayout.ignoreCapsOnMac */ : 0;
  }
  flags |= elMapModifier.checked ? 128 /* kKeyLayout.mapRightModifiers */ : elMapModifier.indeterminate ? 64 /* kKeyLayout.mapLeftModifiers */ : 0;
  flags |= elInPrivResistFp.checked ? 32 /* kKeyLayout.inPrivResistFp_ff */ : 0;
  const old = keyLayout.previous_;
  old & 256 /* kKeyLayout.fromOld */ && (old & -257 /* kKeyLayout.fromOld */) === flags && (flags |= 256 /* kKeyLayout.fromOld */);
  return flags;
};

let _lastKeyLayoutValue;

let _iprf_visible = true;

keyLayout.populateElement_ = value => {
  const always = !!(value & 1 /* kKeyLayout.alwaysIgnore */);
  elAlwaysIgnore.checked = always;
  elIgnoreIfAlt.checked = always || !!(value & 8 /* kKeyLayout.ignoreIfAlt */);
  elIgnoreIfNotASCII.checked = always || !!(value & 2 /* kKeyLayout.ignoreIfNotASCII */);
  elIgnoreIfNotASCII.indeterminate = !!(value & 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */);
  elIgnoreCaps.checked = always || !!(value & 16 /* kKeyLayout.ignoreCaps */);
  elIgnoreCaps.indeterminate = !!(value & 512 /* kKeyLayout.ignoreCapsOnMac */);
  elInPrivResistFp.checked = !!(value & 32 /* kKeyLayout.inPrivResistFp_ff */);
  elMapModifier.checked = !!(value & 128 /* kKeyLayout.mapRightModifiers */);
  elMapModifier.indeterminate = !!(value & 64 /* kKeyLayout.mapLeftModifiers */);
  _lastKeyLayoutValue = value;
  onAlwaysIgnoreChange();
  Option_.onFgCacheUpdated_ && post_(3 /* kPgReq.updatePayload */ , {
    key: "l",
    val: value
  }).then(val2 => {
    VApi.z.l = val2 != null ? val2 : value;
    Option_.onFgCacheUpdated_();
  });
  if (_iprf_visible) {
    elInPrivResistFp.parentElement.parentElement.parentElement.style.display = "none";
    _iprf_visible = false;
  }
};

const onAlwaysIgnoreChange = ev => {
  const always = elAlwaysIgnore.checked;
  BooleanOption_.ToggleDisabled_(elIgnoreIfAlt, always);
  BooleanOption_.ToggleDisabled_(elIgnoreIfNotASCII, always);
  BooleanOption_.ToggleDisabled_(elIgnoreCaps, always);
  if (ev) {
    if (always) {
      elIgnoreIfAlt.checked = elIgnoreIfNotASCII.checked = elIgnoreCaps.checked = true;
      elIgnoreIfNotASCII.indeterminate = elIgnoreCaps.indeterminate = false;
    } else {
      const old = keyLayout.innerFetch_();
      if (typeof old === "number" && !(_lastKeyLayoutValue & 1 /* kKeyLayout.alwaysIgnore */)) {
        _lastKeyLayoutValue === old ? keyLayout.fetch_() : keyLayout.populateElement_(_lastKeyLayoutValue);
        ev.stopImmediatePropagation();
        nextTick_(keyLayout.onUpdated_);
      }
    }
  }
};

delayBinding_(keyLayout.element_, "input", event => {
  const el = event.target;
  if (el === elAlwaysIgnore) {
    onAlwaysIgnoreChange(event);
  } else {
    const kMid = el === elIgnoreIfNotASCII ? 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */ : el === elIgnoreCaps ? 512 /* kKeyLayout.ignoreCapsOnMac */ : el === elMapModifier ? 64 /* kKeyLayout.mapLeftModifiers */ : 0;
    const kTrue = el === elIgnoreIfNotASCII ? 2 /* kKeyLayout.ignoreIfNotASCII */ : el === elIgnoreCaps ? 16 /* kKeyLayout.ignoreCaps */ : el === elMapModifier ? 128 /* kKeyLayout.mapRightModifiers */ : 8 /* kKeyLayout.ignoreIfAlt */;
    if (kMid) {
      const newVal = BooleanOption_.ToggleTripleStatuses(_lastKeyLayoutValue & kTrue ? 2 : _lastKeyLayoutValue & kMid ? 1 : 0, event);
      _lastKeyLayoutValue = _lastKeyLayoutValue & ~(kMid | kTrue) | (newVal > 1 ? kTrue : newVal ? kMid : 0);
    } else {
      _lastKeyLayoutValue = _lastKeyLayoutValue & ~kTrue | (el.checked ? kTrue : 0);
    }
  }
}, true);

Option_.all_.vomnibarPage.onSave_ = function() {
  const url = this.previous_, isExtPage = url.startsWith(location.protocol) || url.startsWith("front/");
  isExtPage ? this.showError_("") : url.startsWith("file:") ? this.showError_(oTrans_("fileVomnibar"), "highlight") : /^http:\/\/(?!localhost[:/])/i.test(url) ? this.showError_(oTrans_("httpVomnibar"), "highlight") : this.showError_("");
};

Option_.all_.userDefinedCss.onSave_ = function() {
  if (!this.element_.classList.contains("debugging")) {
    return;
  }
  nextTick_(() => {
    const root = VApi.y().r;
    for (const frame of $$("iframe", root)) {
      const isFind = frame.classList.contains("HUD"), style = frame.contentDocument.querySelector("style.debugged");
      style && (isFind ? style.remove() : style.classList.remove("debugged"));
    }
    this.element_.classList.remove("debugging");
  });
};

Option_.all_.autoReduceMotion.onSave_ = function() {
  nextTick_(() => {
    const value = this.previous_;
    toggleReduceMotion_(value === 2 ? matchMedia("(prefers-reduced-motion: reduce)").matches : value > 0);
  });
};

const onBeforeUnload = () => {
  setTimeout(() => {
    setTimeout(() => {
      for (const i of Object.values(Option_.all_)) {
        if (i instanceof TextOption_ && i._lastError) {
          continue;
        }
        let node = i.element_;
        if (node.localName === "input" && node.type === "checkbox") {
          const p1 = node.parentElement, p2 = p1.parentElement;
          node = p2.localName === "td" ? p2 : p1;
        }
        node.classList.toggle("highlight", !i.saved_);
      }
    }, 300);
  }, 17);
  return oTrans_("beforeUnload");
};
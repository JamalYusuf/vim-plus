"use strict";
__filename = "content/insert.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "./port", "./dom_ui", "./hud", "./scroller", "./key_handler", "../lib/keyboard_utils", "./mode_find" ], function(require, exports, utils_1, dom_utils_1, port_1, dom_ui_1, hud_1, scroller_1, key_handler_1, keyboard_utils_1, mode_find_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.onBlur = exports.onFocus = exports.resetInsertAndScrolling = exports.exitInputHint = exports.exitInsertMode = exports.focusUpper = exports.setupSuppress = exports.findNewEditable = exports.insert_Lock_ = exports.exitGrab = exports.insertInit = exports.set_readonlyFocused_ = exports.set_passAsNormal = exports.set_onWndBlur2 = exports.set_grabBackFocus = exports.set_isHintingInput = exports.set_inputHint = exports.set_is_last_mutable = exports.set_insert_last2_ = exports.set_insert_last_ = exports.set_insert_global_ = exports.onWndBlur2 = exports.insert_inputHint = exports.suppressType = exports.grabBackFocus = exports.insert_last_mutable = exports.insert_last2_ = exports.insert_last_ = exports.readonlyFocused_ = exports.passAsNormal = exports.insert_global_ = exports.raw_insert_lock = void 0;
  let shadowNodeMap;
  let lock_ = null;
  exports.raw_insert_lock = lock_;
  let insert_global_ = null;
  exports.insert_global_ = insert_global_;
  let isHintingInput = 0;
  let inputHint = null;
  exports.insert_inputHint = inputHint;
  let suppressType = 0;
  exports.suppressType = suppressType;
  let insert_last_;
  exports.insert_last_ = insert_last_;
  let insert_last2_;
  exports.insert_last2_ = insert_last2_;
  let is_last_mutable = 1;
  exports.insert_last_mutable = is_last_mutable;
  let lastWndFocusTime = 0;
  // the `readyState_ > "i"` is to grab focus on `chrome://*/*` URLs and `about:*` iframes
    let grabBackFocus = utils_1.readyState_ > "i";
  exports.grabBackFocus = grabBackFocus;
  let onExitSuppress;
  let onWndBlur2;
  exports.onWndBlur2 = onWndBlur2;
  let passAsNormal = 0;
  exports.passAsNormal = passAsNormal;
  let readonlyFocused_ = 0;
  exports.readonlyFocused_ = readonlyFocused_;
  function set_insert_global_(_newIGlobal) {
    exports.insert_global_ = insert_global_ = _newIGlobal;
  }
  exports.set_insert_global_ = set_insert_global_;
  function set_insert_last_(_newILast) {
    exports.insert_last_ = insert_last_ = _newILast;
  }
  exports.set_insert_last_ = set_insert_last_;
  function set_insert_last2_(_newILast2) {
    exports.insert_last2_ = insert_last2_ = _newILast2;
  }
  exports.set_insert_last2_ = set_insert_last2_;
  function set_is_last_mutable(_newIsLastMutable) {
    exports.insert_last_mutable = is_last_mutable = _newIsLastMutable;
  }
  exports.set_is_last_mutable = set_is_last_mutable;
  function set_inputHint(_newIHint) {
    exports.insert_inputHint = inputHint = _newIHint;
  }
  exports.set_inputHint = set_inputHint;
  function set_isHintingInput(_newIsHintingInput) {
    isHintingInput = _newIsHintingInput;
  }
  exports.set_isHintingInput = set_isHintingInput;
  function set_grabBackFocus(_newGrabBackFocus) {
    exports.grabBackFocus = grabBackFocus = _newGrabBackFocus;
  }
  exports.set_grabBackFocus = set_grabBackFocus;
  function set_onWndBlur2(_newOnBlur) {
    exports.onWndBlur2 = onWndBlur2 = _newOnBlur;
  }
  exports.set_onWndBlur2 = set_onWndBlur2;
  function set_passAsNormal(_newNormal) {
    exports.passAsNormal = passAsNormal = _newNormal;
  }
  exports.set_passAsNormal = set_passAsNormal;
  function set_readonlyFocused_(_newRoFocused) {
    return exports.readonlyFocused_ = readonlyFocused_ = _newRoFocused;
  }
  exports.set_readonlyFocused_ = set_readonlyFocused_;
  const insertInit = (doesGrab, inLoading) => {
    let activeEl = dom_utils_1.deepActiveEl_unsafe_();
 // (historical bug note removed)
        let counter = inLoading ? 0 : 1, tick = 0;
    if (doesGrab) {
      if (activeEl && dom_utils_1.getEditableType_(activeEl)) {
        if (inLoading) {
          exports.insert_last_ = insert_last_ = exports.insert_last2_ = insert_last2_ = null;
          counter = 1;
          utils_1.recordLog(113 /* kTip.logGrabFocus */)();
        }
        activeEl.blur();
        // here ignore the rare case of an XMLDocument with an editable node on Firefox, for smaller code
                activeEl = dom_utils_1.deepActiveEl_unsafe_();
      } else {
        activeEl = null;
      }
      if (!activeEl) {
        exports.grabBackFocus = grabBackFocus = (event, target) => {
          const activeEl1 = dom_utils_1.activeEl_unsafe_(), now = utils_1.getTime();
          // on Chrome, password saver won't set doc.activeElement when dispatching "focus" events
                    if (activeEl1 === target || activeEl1 && dom_utils_1.TryGetShadowRoot_(activeEl1)) {
            utils_1.Stop_(event);
            counter && utils_1.abs_(now - tick) > 512 ? counter = 1 : counter++ || utils_1.recordLog(113 /* kTip.logGrabFocus */)();
            tick = now;
            counter > 15 ? exports.exitGrab(event) : target.blur();
          }
        };
        if (!inLoading) {
          return;
        }
        keyboard_utils_1.handler_stack.push(exports.exitGrab, 11 /* kHandler.grabBackFocus */);
        utils_1.setupEventListener(0, dom_utils_1.MDW, exports.exitGrab);
        return;
      }
    }
    exports.grabBackFocus = grabBackFocus = false;
    activeEl && dom_utils_1.getEditableType_(activeEl) && (exports.raw_insert_lock = lock_ = activeEl);
  };
  exports.insertInit = insertInit;
  exports.exitGrab = event => {
    if (!grabBackFocus) {
      return 0 /* HandlerResult.Nothing */;
    }
    exports.grabBackFocus = grabBackFocus = false;
    keyboard_utils_1.removeHandler_(11 /* kHandler.grabBackFocus */);
    utils_1.setupEventListener(0, dom_utils_1.MDW, exports.exitGrab, 1);
    // it's acceptable to not set the userActed flag if there's only the top frame;
    // when an iframe gets clicked, the events are mousedown and then focus, so safePost is needed
        !((event && event.e || event) instanceof Event) || !frames.length && utils_1.isTop || port_1.safePost({
      H: 12
 /* kFgReq.exitGrab */    });
    return 0 /* HandlerResult.Nothing */;
  };
  const insert_Lock_ = () => lock_;
  exports.insert_Lock_ = insert_Lock_;
  const findNewEditable = () => {
    // ignore those in Shadow DOMs, since no issues have been reported
    const el = dom_utils_1.activeEl_unsafe_();
    /** Ignore standalone usages of `{-webkit-user-modify:}` without `[contenteditable]`
        * On Chromestatus, this is tagged `WebKitUserModify{PlainText,ReadWrite,ReadOnly}Effective`
        * * https://www.chromestatus.com/metrics/css/timeline/popularity/338
        * * https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/dom/element.cc?dr=C&q=IsRootEditableElementWithCounting&g=0&l=218
        * `only used {-wum:RW}` in [0.2914%, 0.2926%]
        * * Total percentage of `WebKitUserModifyReadWriteEffective` is 0.2926%, `WebKitUserModifyReadOnlyEffective` is ~ 0.000006%
        * * `all used [ce=PT]` := `PlainTextEditingEffective - WebKitUserModifyPlainTextEffective` = 0.5754% - 0.5742% = 0.0012%
        * * `contributed WebKitUserModifyReadWriteEffective` <= 0.0012%
        * `only used {-wum:PT}` in [0, 0.5742%]
        * And in top sites only "tre-rj.*.br" (Brazil) and "slatejs.org" causes `WebKitUserModify{RW/PT}Effective`
        * * in slatejs.org, there's `[contenteditable=true]` and `{-webkit-user-modify:*plaintext*}` for browser compatibility
        */    if (el && el.isContentEditable) {
      utils_1.esc(0 /* HandlerResult.Nothing */);
      exports.raw_insert_lock = lock_ = el;
    }
    return lock_;
  };
  exports.findNewEditable = findNewEditable;
  const setupSuppress = onExit => {
    const f = onExitSuppress;
    onExitSuppress = exports.suppressType = suppressType = 0;
    if (onExit) {
      exports.suppressType = suppressType = dom_utils_1.getSelection_().type;
      onExitSuppress = onExit;
    }
    f && f();
  };
  exports.setupSuppress = setupSuppress;
  /** should only be called during keydown events */  const focusUpper = (key, force, event) => {
    const parEl = dom_utils_1.frameElement_() && !dom_utils_1.fullscreenEl_unsafe_();
    if (!parEl && (!force || utils_1.isTop)) {
      return;
    }
    event && keyboard_utils_1.prevent_(event);
    if (parEl) {
      keyboard_utils_1.consumeKey_mac(key, event);
      const parApi = dom_ui_1.getParentVApi();
      if (parApi && !parApi.a(utils_1.keydownEvents_)) {
        parApi.s();
        parApi.f(0, 0, 0, 1);
      } else {
        parent.focus();
      }
    } else if (utils_1.keydownEvents_[key] !== 2) {
      // avoid sending too many messages
      port_1.post_({
        H: 11 /* kFgReq.nextFrame */ ,
        t: 1 /* Frames.NextType.parent */ ,
        k: key
      });
      utils_1.keydownEvents_[key] = 2;
    }
  };
  exports.focusUpper = focusUpper;
  exports.exitInsertMode = (target, event) => {
    if (target === lock_ || dom_utils_1.TryGetShadowRoot_(target)) {
      target = lock_;
      exports.raw_insert_lock = lock_ = null;
    } else {
      target = dom_utils_1.getEditableType_(target) ? target : null;
    }
    const ret = insert_global_ && insert_global_.p || target && event && testConfiguredSelector_(target, 1) && keyboard_utils_1.isEscape_(event.c) ? 0 /* HandlerResult.Nothing */ : 2 /* HandlerResult.Prevent */;
    target && (ret ? target.blur() : utils_1.timeout_(dom_utils_1.blur_unsafe.bind(0, target), 0));
    if (insert_global_) {
      port_1.runFallbackKey(insert_global_, 0);
      exports.insert_global_ = insert_global_ = null;
      hud_1.hudHide();
    }
    return ret;
  };
  const exitInputHint = () => {
    if (inputHint) {
      inputHint.b && dom_utils_1.removeEl_s(inputHint.b);
      exports.insert_inputHint = inputHint = null;
      dom_ui_1.set_usePopover_(dom_ui_1.usePopover_ & -5);
      keyboard_utils_1.removeHandler_(13 /* kHandler.focusInput */);
    }
  };
  exports.exitInputHint = exitInputHint;
  const resetInsertAndScrolling = () => {
    scroller_1.setNewScrolling(exports.insert_last_ = insert_last_ = exports.insert_last2_ = insert_last2_ = exports.raw_insert_lock = lock_ = exports.insert_global_ = insert_global_ = null), 
    exports.insert_last_mutable = is_last_mutable = 1, exports.exitGrab(), exports.setupSuppress();
    readonlyFocused_ > 0 && hud_1.hudHide();
  };
  exports.resetInsertAndScrolling = resetInsertAndScrolling;
  const onFocus = event => {
    if (!event.isTrusted) {
      return;
    }
    // on Firefox, target may also be `document`
        let target = event.target;
    let el2;
    if (target === window) {
      lastWndFocusTime = utils_1.timeStamp_(event);
      utils_1.onWndFocus();
      return;
    }
    if (!utils_1.isEnabled_) {
      return;
    }
    // since BrowserVer.MinMaybeAutoFillInShadowDOM , Chrome will auto fill a password in a shadow tree
    if (lock_ && lock_ === dom_utils_1.deepActiveEl_unsafe_()) {
      return;
    }
    if (target === dom_ui_1.ui_box) {
      utils_1.Stop_(event);
      return;
    }
    // on Edge 107 and MV3 mode, chrome.dom may throw `invalid extension context`
        const sr = dom_utils_1.TryGetShadowRoot_(target, port_1.runtime_port ? 0 : 1);
    if (sr) {
      const path = dom_utils_1.getEventPath(event);
      let topOfPath;
      /**
             * isNormalHost is true if one of:
             * - Chrome is since BrowserVer.MinOnFocus$Event$$Path$IncludeOuterElementsIfTargetInShadowDOM
             * - `event.currentTarget` (`this`) is a shadowRoot
             */      const isNormalHost = (topOfPath = path[0]) !== target;
      hookOnShadowRoot(isNormalHost ? path : [ sr, target ], target);
      target = isNormalHost ? topOfPath : target;
    }
    if (!lastWndFocusTime || utils_1.timeStamp_(event) - lastWndFocusTime > 30) {
      el2 = dom_utils_1.SafeEl_not_ff_(target);
      el2 && scroller_1.setNewScrolling(el2);
    }
    lastWndFocusTime = 0;
    let editableParent, type;
    if (type = dom_utils_1.getEditableType_(target)) {
      if (grabBackFocus) {
        grabBackFocus(event, target);
      } else {
        utils_1.esc(0 /* HandlerResult.Nothing */);
        exports.raw_insert_lock = lock_ = target;
        // here ignore the rare case of an XMLDocument with a editable node on Firefox, for smaller code
                if (dom_utils_1.activeEl_unsafe_() !== utils_1.doc.body) {
          if (is_last_mutable) {
            el2 = utils_1.deref_(insert_last_);
            exports.insert_last2_ = insert_last2_ = el2 && el2 !== target ? insert_last_ : insert_last2_;
            exports.insert_last_ = insert_last_ = utils_1.weakRef_not_ff(target);
          } else {
            exports.insert_last2_ = insert_last2_ = utils_1.weakRef_not_ff(target);
          }
        }
        editableParent = type !== 3 /* EditableType.ContentEditable */ ? target : dom_utils_1.SafeEl_not_ff_(target.closest("[contenteditable]"));
        exports.readonlyFocused_ = readonlyFocused_ = editableParent && testConfiguredSelector_(editableParent, 0) ? -1 : type > 2 /* EditableType.MaxNotEditableElement */ && editableParent && !dom_utils_1.isAriaFalse_(editableParent, 3 /* kAria.readOnly */) || type > 3 /* EditableType.MaxNotTextBox */ && target.readOnly ? 1 : 0;
        readonlyFocused_ > 0 && hud_1.hudHide();
      }
    }
  };
  exports.onFocus = onFocus;
  const onBlur = event => {
    if (!utils_1.isEnabled_ || !event.isTrusted) {
      return;
    }
    let topOfPath, target = event.target;
    if (target === window) {
      onWndBlur();
      return;
    }
    const sr = dom_utils_1.TryGetShadowRoot_(target, port_1.runtime_port ? 0 : 1);
    if (sr && target !== dom_ui_1.ui_box) {
      const path = dom_utils_1.getEventPath(event);
      const same = (topOfPath = path[0]) === target;
      if (same) {
        shadowNodeMap || hookOnShadowRoot([ sr, 0 ], 0);
 // in case of unexpect wrong states made by onFocus
                shadowNodeMap.set(sr, 1 /* kNodeInfo.ShadowBlur */);
      } else {
        hookOnShadowRoot(path, target, 1);
        target = topOfPath;
      }
    }
    if (lock_ === target) {
      exports.raw_insert_lock = lock_ = null;
      inputHint && !isHintingInput && dom_utils_1.docHasFocus_() && exports.exitInputHint();
      readonlyFocused_ > 0 && hud_1.hudHide();
    }
  };
  exports.onBlur = onBlur;
  const onShadow = function(event) {
    if (!event.isTrusted) {
      return;
    }
    if (utils_1.isEnabled_ && event.type === "focus") {
      exports.onFocus(event);
      return;
    }
    utils_1.isEnabled_ && shadowNodeMap.get(this) !== 1 /* kNodeInfo.ShadowBlur */ || hookOnShadowRoot([ this, 0 ], 0, 1);
    utils_1.isEnabled_ && exports.onBlur(event);
  };
  const hookOnShadowRoot = (path, target, disable) => {
    for (let len = path.indexOf(target); 0 <= --len; ) {
      const root = path[len];
      // root is target or inside target, so always a Node
            if (dom_utils_1.isNode_(root, 11 /* kNode.DOCUMENT_FRAGMENT_NODE */)) {
        utils_1.setupEventListener(root, "focus", onShadow, disable);
        utils_1.setupEventListener(root, dom_utils_1.BU, onShadow, disable);
        disable ? shadowNodeMap && shadowNodeMap.delete(root) : (shadowNodeMap || (shadowNodeMap = new WeakMap)).set(root, 2 /* kNodeInfo.ShadowFull */);
      }
    }
  };
  const onWndBlur = () => {
    scroller_1.scrollTick(0);
    onWndBlur2 && onWndBlur2();
    key_handler_1.onPassKey && key_handler_1.onPassKey();
    mode_find_1.find_box && mode_find_1.find_box === dom_ui_1.ui_root.activeElement || utils_1.set_keydownEvents_(utils_1.safeObj(null));
    key_handler_1.set_isCmdTriggered(0 /* kKeyCode.None */);
     key_handler_1.resetAnyClickHandler_cr();
    utils_1.esc(3 /* HandlerResult.ExitNormalMode */);
  };
  const testConfiguredSelector_ = (target, passEsc) => {
    let selector = passEsc ? utils_1.fgCache.p : utils_1.fgCache.y;
    if (utils_1.isTY(selector)) {
      selector = dom_utils_1.findSelectorByHost(selector, target);
      selector = selector ? [ selector.replace(":default", utils_1.VTr(passEsc + 120 /* kTip.defaultIgnoreReadonly */)) ] : 0;
      utils_1.fgCache["yp"[passEsc]] = selector;
    }
    return selector && dom_utils_1.testMatch(selector[0], target);
  };
});
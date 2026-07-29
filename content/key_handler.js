"use strict";
__filename = "content/key_handler.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "../lib/rect", "./port", "./dom_ui", "./insert", "./scroller", "./async_dispatcher", "./hud" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, rect_1, port_1, dom_ui_1, insert_1, scroller_1, async_dispatcher_1, hud_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.onKeyup = exports.onEscDown = exports.onKeydown = exports.resetAnyClickHandler_cr = exports.checkKeyOnTop = exports.checkKey = exports.inheritKeyMappings = exports.set_maybeEscIsHidden_ff = exports.set_currentKeys = exports.set_mappedKeys = exports.set_mapKeyTypes = exports.set_keyFSM = exports.set_isPassKeysReversed = exports.set_onPassKey = exports.set_nextKeys = exports.set_passKeys = exports.set_isCmdTriggered = exports.maybeEscIsHidden_ff = exports.noopHandler = exports.isPassKeysReversed = exports.onPassKey = exports.anyClickHandler = exports.isCmdTriggered = exports.isWaitingAccessKey = exports.currentKeys = exports.mapKeyTypes = exports.mappedKeys = exports.keyFSM = exports.passKeys = void 0;
  let passKeys = null;
  exports.passKeys = passKeys;
  let isPassKeysReversed = false;
  exports.isPassKeysReversed = isPassKeysReversed;
  let mapKeyTypes = 0 /* kMapKey.NONE */;
  exports.mapKeyTypes = mapKeyTypes;
  let mappedKeys = null;
  exports.mappedKeys = mappedKeys;
  let keyFSM;
  exports.keyFSM = keyFSM;
  let currentKeys;
  exports.currentKeys = currentKeys;
  let curKeyTimestamp;
  let nextKeys;
  let maybeEscIsHidden_ff = 27 /* kKeyCode.esc */;
  exports.maybeEscIsHidden_ff = maybeEscIsHidden_ff;
  let isWaitingAccessKey = false;
  exports.isWaitingAccessKey = isWaitingAccessKey;
  let isCmdTriggered = 0 /* kKeyCode.None */;
  exports.isCmdTriggered = isCmdTriggered;
  let noopEventHandler = Object.is;
  exports.noopHandler = noopEventHandler;
  let anyClickHandler = {
    handleEvent: noopEventHandler
  };
  exports.anyClickHandler = anyClickHandler;
  let onPassKey;
  exports.onPassKey = onPassKey;
  utils_1.set_esc(i => {
    exports.currentKeys = currentKeys = "";
    nextKeys = null;
    curKeyTimestamp = 0;
    return i;
  });
  function set_isCmdTriggered(_newTriggerred) {
    return exports.isCmdTriggered = isCmdTriggered = _newTriggerred;
  }
  exports.set_isCmdTriggered = set_isCmdTriggered;
  function set_passKeys(_newPassKeys) {
    exports.passKeys = passKeys = _newPassKeys;
  }
  exports.set_passKeys = set_passKeys;
  function set_nextKeys(_newNK) {
    nextKeys = _newNK;
  }
  exports.set_nextKeys = set_nextKeys;
  function set_onPassKey(_newOnPassKey) {
    exports.onPassKey = onPassKey = _newOnPassKey;
  }
  exports.set_onPassKey = set_onPassKey;
  function set_isPassKeysReversed(_newPKReversed) {
    exports.isPassKeysReversed = isPassKeysReversed = _newPKReversed;
  }
  exports.set_isPassKeysReversed = set_isPassKeysReversed;
  function set_keyFSM(_newKeyFSM) {
    return exports.keyFSM = keyFSM = _newKeyFSM;
  }
  exports.set_keyFSM = set_keyFSM;
  function set_mapKeyTypes(_newMapKeyTypes) {
    exports.mapKeyTypes = mapKeyTypes = _newMapKeyTypes;
  }
  exports.set_mapKeyTypes = set_mapKeyTypes;
  function set_mappedKeys(_newMappedKeys) {
    exports.mappedKeys = mappedKeys = _newMappedKeys;
  }
  exports.set_mappedKeys = set_mappedKeys;
  function set_currentKeys(_newCurrentKeys) {
    exports.currentKeys = currentKeys = _newCurrentKeys;
  }
  exports.set_currentKeys = set_currentKeys;
  function set_maybeEscIsHidden_ff(_isEsc) {
    exports.maybeEscIsHidden_ff = maybeEscIsHidden_ff = _isEsc;
  }
  exports.set_maybeEscIsHidden_ff = set_maybeEscIsHidden_ff;
  const inheritKeyMappings = newState => {
    var _a;
    if (newState.m[3]) {
      _a = newState.m, exports.keyFSM = keyFSM = _a[0], exports.mappedKeys = mappedKeys = _a[1], 
      exports.mapKeyTypes = mapKeyTypes = _a[2], utils_1.vApi.z = _a[3];
      utils_1.set_inherited_(4 /* PortType.confInherited */);
    }
  };
  exports.inheritKeyMappings = inheritKeyMappings;
  keyboard_utils_1.set_getMappedKey((eventWrapper, mode) => {
    const char = eventWrapper.v ? "" : mode > 5 && mode < 11 /* kModeId.MIN_NOT_EXPECT_ASCII */ && utils_1.fgCache.l & 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */ ? keyboard_utils_1.char_(eventWrapper, 4 /* kKeyLayout.inCmdIgnoreIfNotASCII */) : eventWrapper.c !== " " /* kChar.INVALID */ ? eventWrapper.c : keyboard_utils_1.char_(eventWrapper, utils_1.fgCache.l & 2 /* kKeyLayout.ignoreIfNotASCII */);
    let mapped, key = char;
    if (char) {
      const event = eventWrapper.e;
      let baseMod = `${event.altKey ? "a-" : ""}${event.ctrlKey ? "c-" : ""}${event.metaKey ? "m-" : ""}`, chLower = utils_1.Lower(char), isLong = char.length > 1, mod = event.shiftKey && (isLong || baseMod && char.toUpperCase() !== chLower) ? baseMod + "s-" : baseMod;
      char.length === 1 || char.length > 1 && char === chLower || console.error(`Assert error: mapKey get an invalid char of "${char}" !`);
      key = isLong || mod ? mod + chLower : char;
      if (mappedKeys && mode < 10 /* kModeId.NO_MAP_KEY_BUT_MAY_IGNORE_LAYOUT */) {
        mapped = mapKeyTypes & (mode > 2 /* kModeId.Insert */ ? 4 /* kMapKey.otherMode */ : mode) && mappedKeys[key + ":" + "nnielmfvos" /* GlobalConsts.ModeIds */ [mode]] || (mapKeyTypes & 8 /* kMapKey.plain */ ? mappedKeys[key] : "");
        key = mapped ? mode > 3 /* kModeId.max_not_command */ && mapped.startsWith("v-") ? (eventWrapper.v = mapped, 
        "") : mapped : mapKeyTypes & 16 /* kMapKey.char */ && !isLong && (mapped = mappedKeys[chLower]) && mapped.length < 2 && (baseMod = mapped.toUpperCase()) !== mapped ? mod ? mod + mapped : char === chLower ? mapped : baseMod : key;
      }
    }
    return key;
  });
  exports.checkKey = (event, key, /** 0 means normal; 1 means (plain) insert; 2 means on-top normal */ modeType) => {
    // when checkKey, Vim+ must be enabled, so passKeys won't be `""`
    if (passKeys && !currentKeys && passKeys.has(mappedKeys ? keyboard_utils_1.getMappedKey(event, 11 /* kModeId.NO_MAP_KEY */) : key) !== isPassKeysReversed && !insert_1.passAsNormal) {
      // a normal exclusion passKeys should not include `<v-***>`, so here just ignore the case to make code shorter
      return utils_1.esc(0 /* HandlerResult.Nothing */);
    }
    let j = keyboard_utils_1.isEscape_(key);
    if (j) {
      return nextKeys ? (utils_1.esc(3 /* HandlerResult.ExitNormalMode */), 2 /* HandlerResult.Prevent */) : j;
    }
    let key2 = key, isVirtual = key.startsWith("v-");
 // key may come from `a mode < kModeId.max_not_command`
        if (!nextKeys || !(j = nextKeys[key])) {
      j = isVirtual ? keyFSM[key] || 1 /* KeyAction.cmd */ : modeType ? modeType < 2 && 
      // insert mode: not accept a sequence of multiple keys,
      // because the simplified keyFSM can not be used when nextKeys && !nextKeys[key]
      (keyFSM[key2 = key + ":i" /* GlobalConsts.InsertModeId */ ] || (key2 = keyboard_utils_1.keybody_(key)) < "f:" /* kChar.minNotF_num */ && key2 > "f0" /* kChar.maxNotF_num */ && keyFSM[key2 = key]) === 1 /* KeyAction.cmd */ ? 1 /* KeyAction.cmd */ : 0 /* KeyAction.INVALID */ : keyFSM[currentKeys && mapKeyTypes & 1 /* kMapKey.normalMode */ ? key2 = keyboard_utils_1.getMappedKey(event, 1 /* kModeId.Normal */) : key];
      if (!j || currentKeys && passKeys && passKeys.has(mappedKeys ? keyboard_utils_1.getMappedKey(event, 11 /* kModeId.NO_MAP_KEY */) : key) !== isPassKeysReversed && !insert_1.passAsNormal) {
        return utils_1.esc(nextKeys && modeType ? 2 /* HandlerResult.Prevent */ : 0 /* HandlerResult.Nothing */);
      }
      j !== 1 /* KeyAction.cmd */ && (exports.currentKeys = currentKeys = "");
    }
    exports.currentKeys = currentKeys += key2.length > 1 ? key2 = `<${key2}>` : key2;
    let result = 2 /* HandlerResult.Prevent */;
    if (j === 1 /* KeyAction.cmd */) {
      keyboard_utils_1.prevent_(event.e);
      port_1.runtime_port || port_1.runtimeConnect();
      port_1.post_({
        H: 19 /* kFgReq.key */ ,
        k: currentKeys,
        l: event.i,
        e: dom_utils_1.getElDesc_(insert_1.raw_insert_lock)
      });
      utils_1.esc(2 /* HandlerResult.Prevent */);
      exports.isCmdTriggered = isCmdTriggered = event.i || 1 /* kKeyCode.True */;
    } else {
      curKeyTimestamp = utils_1.timeStamp_(event.e);
      if (j !== 2 /* KeyAction.count */) {
        nextKeys = utils_1.safer(j);
        if (isVirtual) {
          keyboard_utils_1.replaceOrSuppressMost_(3 /* kHandler.onTopNormal */ ,  exports.checkKeyOnTop);
          hud_1.hudHide();
        } else if (event.c === keyboard_utils_1.MODIFIER && currentKeys === key2) {
          curKeyTimestamp -= 27100 /* GlobalConsts.ModifierKeyTimeout */;
          result = 0 /* HandlerResult.Nothing */;
        }
      } else {
        nextKeys = keyFSM;
      }
    }
    return result;
  };
  const checkKeyOnTop = event => {
    const consumed = currentKeys && event.i !== 229 /* kKeyCode.ime */ , key = consumed && keyboard_utils_1.getMappedKey(event, 3 /* kModeId.Next */);
 // never set event.v - see kModeId.max_not_command
        key && exports.checkKey(event, key, 2);
    consumed && currentKeys || hud_1.hudHide(keyboard_utils_1.removeHandler_(3 /* kHandler.onTopNormal */));
    return consumed ? 2 /* HandlerResult.Prevent */ : 0 /* HandlerResult.Nothing */;
  };
  exports.checkKeyOnTop = checkKeyOnTop;
  const checkAccessKey_cr = event => {
    /** On Firefox, access keys are only handled during keypress events, so it has been "hooked" well:
         * https://dxr.mozilla.org/mozilla/source/content/events/src/nsEventStateManager.cpp#960 .
         * And the modifier stat for access keys is user-configurable: `ui.key.generalAccessKey`
         * * there was another one (`ui.key.contentAccess`) but it has been removed from the latest code
         */
    if (event.e.altKey) {
      /** On Chrome, there're 2 paths to trigger accesskey:
             * * `blink::WebInputEvent::kRawKeyDown` := `event#keydown` => `blink::WebInputEvent::kChar` := `handleAccessKey`
             * * `blink::WebInputEvent::kKeyDown` := `handleAccessKey` + `event#keydown`
             * In source code on 2019-10-19, the second `WebInputEvent::kKeyDown` is almost not in use (except in Pepper API),
             * and https://cs.chromium.org/chromium/src/third_party/blink/public/platform/web_input_event.h?l=110&q=kKeyDown
             *     says that Android uses `WebInputEvent::kKeyDown` and Windows prefers `RawKeyDown+Char`,
             * so, here ignores the 2nd path.
             */
      // during tests, an access key of ' ' (space) can be triggered on macOS (2019-10-20)
      keyboard_utils_1.getMappedKey(event, 0 /* kModeId.Plain */);
      isWaitingAccessKey !== (event.c.length === 1 || event.c === keyboard_utils_1.SPC) && keyboard_utils_1.getKeyStat_(event.e, 1) /* Chrome ignore .shiftKey */ === (utils_1.os_ ? 1 /* KeyStat.altKey */ : 3 /* KeyStat.ctrlKey */) && exports.resetAnyClickHandler_cr(!isWaitingAccessKey);
    }
  };
  const resetAnyClickHandler_cr = enable => {
    exports.isWaitingAccessKey = isWaitingAccessKey = !!enable;
    anyClickHandler.handleEvent = enable ? onAnyClick_cr : dom_ui_1.toExitOnClick_ ? dom_ui_1.doExitOnClick_ : noopEventHandler;
  };
  exports.resetAnyClickHandler_cr = resetAnyClickHandler_cr;
  const onAnyClick_cr = event => {
    // Note: here `event` may be a simulated one from a browser itself or page scripts
    // here has been on Chrome
    if (isWaitingAccessKey && event.isTrusted && !event.detail && !event.clientY /* a simulated click from a keyboard event is "positionless" */) {
      const path = dom_utils_1.getEventPath(event), t = path[0];
      if (dom_utils_1.ElementProto_not_ff.getAttribute.call(t, "accesskey")) {
        // if a script has modified [accesskey], then do nothing on - just in case.
         exports.resetAnyClickHandler_cr();
        keyboard_utils_1.prevent_(event);
        dom_utils_1.blur_unsafe(t);
      }
    }
  };
  const onKeydown = event => {
    const key = event.keyCode;
    if (!utils_1.isEnabled_ || !event.isTrusted && event.z !== utils_1.fgCache || !key) {
      return;
    }
 // not only Chrome Password Saver but also AutoFill (WebFormControlElement::SetAutofillValue)
        const eventWrapper = {
      c: " " /* kChar.INVALID */ ,
      e: event,
      i: key,
      v: ""
    };
    if (scroller_1.keyIsDown && scroller_1.onScrolls(eventWrapper)) {
      checkAccessKey_cr(eventWrapper);
      return;
    }
    isWaitingAccessKey &&  exports.resetAnyClickHandler_cr();
    let keyStr, action = 0 /* HandlerResult.Nothing */;
    let handler_ind = keyboard_utils_1.handler_stack.length;
    handler_ind && (port_1.runtime_port || port_1.runtimeConnect());
    for (;0 < handler_ind && action === 0 /* HandlerResult.Nothing */; ) {
      action = keyboard_utils_1.handler_stack[handler_ind -= 2](eventWrapper);
    }
    eventWrapper.v && (action = exports.checkKey(eventWrapper, eventWrapper.v));
    if (action) {} else if (insert_1.insert_global_ || (insert_1.raw_insert_lock ||  insert_1.findNewEditable()) && !insert_1.suppressType && !insert_1.passAsNormal && insert_1.readonlyFocused_ >= 0) {
      keyStr = key === 229 /* kKeyCode.ime */ ? "" : mapKeyTypes & (insert_1.insert_global_ && insert_1.insert_global_.k ? 10 /* kMapKey.plain */ : 34 /* kMapKey.plain_in_insert */) || (insert_1.insert_global_ ? insert_1.insert_global_.k : mapKeyTypes & 64 /* kMapKey.directInsert */ || key > 111 /* kKeyCode.maxNotFn */ && key < 132 /* kKeyCode.minNotFn */) && (key < 48 /* kKeyCode.N0 */ || key > 93 /* kKeyCode.menuKey */ || key > 57 /* kKeyCode.N9 */ && key < 65 /* kKeyCode.A */ || keyboard_utils_1.getKeyStat_(event, 1)) || (key > 132 /* kKeyCode.minNotFn */ ? event.ctrlKey : key === 27 /* kKeyCode.esc */) ? keyboard_utils_1.getMappedKey(eventWrapper, mapKeyTypes & 2 /* kMapKey.insertMode */ ? 2 /* kModeId.Insert */ : 0 /* kModeId.Plain */) : event.key.length === 1 ? " " /* kChar.INVALID */ : "";
      if (insert_1.insert_global_ ? insert_1.insert_global_.k ? keyStr === insert_1.insert_global_.k : keyboard_utils_1.isEscape_(keyStr) : keyStr && (keyStr.length < 2 ? utils_1.esc(0 /* HandlerResult.Nothing */) : (action = exports.checkKey(eventWrapper, keyStr, 1)) > 5 /* HandlerResult.MaxNotEsc */)) {
        checkAccessKey_cr(eventWrapper);
 // even if nothing will be done or `passEsc` matches
                if (!insert_1.insert_global_ && (insert_1.raw_insert_lock && insert_1.raw_insert_lock === utils_1.doc.body || !utils_1.isTop && rect_1.wndSize_() < 5)) {
          keyboard_utils_1.isRepeated_(eventWrapper) && insert_1.focusUpper(key, true, event);
          action = /* the real is HandlerResult.PassKey; here's for smaller code */ 0 /* HandlerResult.Nothing */;
        } else {
          action =  insert_1.exitInsertMode(event.target, eventWrapper);
        }
      }
    } else if (key > 31 /* kKeyCode.maxNotPrintable */ ? key !== 229 /* kKeyCode.ime */ : 134685440 /* kKeyCode.shiftKey */ >> key & 1) {
      curKeyTimestamp && utils_1.timeStamp_(event) - curKeyTimestamp > 3e4 /* GlobalConsts.KeySequenceTimeout */ && utils_1.esc(0 /* HandlerResult.Nothing */);
      keyStr = keyboard_utils_1.getMappedKey(eventWrapper, currentKeys ? 3 /* kModeId.Next */ : 1 /* kModeId.Normal */);
      action = keyStr ? exports.checkKey(eventWrapper, keyStr, 0) : 0 /* HandlerResult.Nothing */;
      action > 5 /* HandlerResult.MaxNotEsc */ && (action = action > 6 /* HandlerResult.PlainEsc */ ?  exports.onEscDown(event, key, keyboard_utils_1.isRepeated_(eventWrapper)) : 0 /* HandlerResult.Nothing */);
      action === 0 /* HandlerResult.Nothing */ && insert_1.suppressType && eventWrapper.c.length === 1 && !keyboard_utils_1.getKeyStat_(event) && (
      // not suppress ' ', so that it's easier to exit this mode
      action = 2 /* HandlerResult.Prevent */);
    }
    if (action < 1 /* HandlerResult.MinStopOrPreventEvents */) {
      // (historical bug note removed)
      utils_1.os_ || utils_1.keydownEvents_[key] !== 1 || event.repeat || (utils_1.keydownEvents_[key] = 0);
      return;
    }
    if (action > 1 /* HandlerResult.MaxNotPrevent */) {
      checkAccessKey_cr(eventWrapper);
      async_dispatcher_1.evIDC_cr || async_dispatcher_1.set_evIDC_cr(event.sourceCapabilities);
      keyboard_utils_1.prevent_(event);
    } else {
      utils_1.Stop_(event);
    }
    keyboard_utils_1.consumeKey_mac(key, event);
  };
  exports.onKeydown = onKeydown;
  /** @param key should be valid */  const onEscDown = (event, key, repeat) => {
    let action = 2 /* HandlerResult.Prevent */;
    let activeEl = repeat || !utils_1.isTop ? dom_utils_1.deepActiveEl_unsafe_() : null;
    /** if `notBody` then `activeEl` is not null */    !repeat && dom_ui_1.removeSelection() || (repeat && !utils_1.keydownEvents_[key] && activeEl ? activeEl === utils_1.deref_(async_dispatcher_1.lastHovered_) ? async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.unhover_async()) : dom_utils_1.blur_unsafe(activeEl) : utils_1.isTop || activeEl ? action = 0 /* HandlerResult.Nothing */ : insert_1.focusUpper(key, repeat, event));
    return action;
  };
  exports.onEscDown = onEscDown;
  const onKeyup = event => {
    let key = event.keyCode;
    if (!utils_1.isEnabled_ || !event.isTrusted && event.z !== utils_1.fgCache) {
      return;
    }
    scroller_1.keyIsDown && (key === isCmdTriggered || isCmdTriggered < 2) && scroller_1.scrollTick(0);
    exports.isCmdTriggered = isCmdTriggered = 0 /* kKeyCode.None */;
    isWaitingAccessKey &&  exports.resetAnyClickHandler_cr();
    insert_1.suppressType && dom_utils_1.getSelection_().type !== insert_1.suppressType && insert_1.setupSuppress();
    if (utils_1.keydownEvents_[key] && key) {
      utils_1.keydownEvents_[key] = 0;
      keyboard_utils_1.prevent_(event);
    } else {
      onPassKey && onPassKey(event);
    }
  };
  exports.onKeyup = onKeyup;
});
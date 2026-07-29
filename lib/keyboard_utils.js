"use strict";
__filename = "lib/keyboard_utils.js";
define([ "require", "exports", "./utils" ], (require, exports, utils_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.removeHandler_ = exports.suppressTail_ = exports.whenNextIsEsc_ = exports.replaceOrSuppressMost_ = exports.prevent_ = exports.isEscape_ = exports.consumeKey_mac = exports.isRepeated_ = exports.getKeyStat_ = exports.hasShift_ff = exports.keybody_ = exports.char_ = exports.set_keyIdCorrectionOffset_old_cr_ = exports.set_getMappedKey = exports.SPC = exports.BSP = exports.DEL = exports.handler_stack = exports.getMappedKey = exports.keyNames_ = exports.MODIFIER = exports.ENTER = void 0;
  const DEL = "delete" /* kChar.delete */ , BSP = "backspace" /* kChar.backspace */ , SP = "space" /* kChar.space */;
  exports.DEL = DEL;
  exports.BSP = BSP;
  exports.SPC = SP;
  const ENT = "enter" /* kChar.enter */ , MDF = "modifier" /* kChar.Modifier */;
  exports.ENTER = ENT;
  exports.MODIFIER = MDF;
  /** readonly kChar[9] */  const keyNames_ = [ SP, "pageup" /* kChar.pageup */ , "pagedown" /* kChar.pagedown */ , "end" /* kChar.end */ , "home" /* kChar.home */ , "left" /* kChar.left */ , "up" /* kChar.up */ , "right" /* kChar.right */ , "down" /* kChar.down */ ];
  exports.keyNames_ = keyNames_;
  let keyIdCorrectionOffset_old_cr_ = 0;
  const _codeCorrectionMap = [ "Semicolon", "Equal", "Comma", "Minus", "Period", "Slash", "Backquote", "BracketLeft", "Backslash", "BracketRight", "Quote", "IntlBackslash" ];
  const kCrct = ";=,-./`[\\]'\\:+<_>?~{|}\"|" /* kChar.CharCorrectionList */;
  const _modifierKeys = {
    __proto__: null,
    Alt: 1,
    AltGraph: 1,
    Control: 1,
    Meta: 1,
    OS: 1,
    Shift: 1
  };
  const handler_stack = [];
  exports.handler_stack = handler_stack;
  let getMappedKey;
  exports.getMappedKey = getMappedKey;
  function set_getMappedKey(_newGetMappedKey) {
    exports.getMappedKey = getMappedKey = _newGetMappedKey;
  }
  exports.set_getMappedKey = set_getMappedKey;
  function set_keyIdCorrectionOffset_old_cr_(_newKeyIdCorrectionOffset) {
    keyIdCorrectionOffset_old_cr_ = _newKeyIdCorrectionOffset;
  }
  exports.set_keyIdCorrectionOffset_old_cr_ = set_keyIdCorrectionOffset_old_cr_;
  /** only return lower-case long string */  const _getKeyName = event => {
    let s, i = event.keyCode;
    return i > 31 && i < 47 /* kKeyCode.minNotDelete */ ? i < 41 /* kKeyCode.minNotDown */ ? i < 33 && (s = event.key).length > 1 ? utils_1.Lower(s) : keyNames_[i - 32 /* kKeyCode.space */ ] : i > 45 /* kKeyCode.insert */ ? DEL : i < 45 /* kKeyCode.insert */ ? "" /* kChar.None */ : "insert" /* kChar.insert */ : i < 47 /* kKeyCode.minNotDelete */ || i === 91 /* kKeyCode.metaKey */ || i === 93 /* kKeyCode.osRight_mac */ && !utils_1.os_ ? i === 8 /* kKeyCode.backspace */ ? BSP : i === 27 /* kKeyCode.esc */ ? "esc" /* kChar.esc */ : i === 9 /* kKeyCode.tab */ ? "tab" /* kChar.tab */ : i === 13 /* kKeyCode.enter */ ? ENT : (i < 19 ? i > 15 : i > 90 /* kKeyCode.maxNotMetaKey */) && utils_1.fgCache.l > 63 && utils_1.fgCache.l >> 6 /* kKeyLayout.MapModifierOffset */ === event.location ? MDF : "" /* kChar.None */ : i === 93 /* kKeyCode.menuKey */ ? "contextmenu" /* kChar.Menu */ : ((s = event.key) ? /^F\d/.test(s) : i > 111 /* kKeyCode.maxNotFn */ && i < 132 /* kKeyCode.minNotFn */) ? s ? utils_1.Lower(s) : "f" + (i - 111 /* kKeyCode.maxNotFn */) : s && s.length > 1 && !_modifierKeys[s] ? utils_1.Lower(s) : "" /* kChar.None */;
  };
  /** return single characters which only depend on `shiftKey` (CapsLock is ignored) */  
  /**
     * * return `"space"` for the <Space> key - in most code it needs to be treated as a long key
     */
  const char_ = (eventWrapper, forceASCII) => {
    let event = eventWrapper.e;
    const shiftKey = event.shiftKey;
    // on macOS, Alt+T can cause `.key === "Unidentified"`
        let mapped, key = event.key, isDeadKey = key === "Dead" || key === "Unidentified";
    if (utils_1.fgCache.l & 1 /* kKeyLayout.alwaysIgnore */ || utils_1.fgCache.l & 8 /* kKeyLayout.ignoreIfAlt */ && event.altKey || isDeadKey || forceASCII && (forceASCII |= key > "~" /* kChar.maxASCII */ && key.length === 1, 
    forceASCII & 1)) {
      /** return strings of 1-N characters and CapsLock is ignored */
      let code = event.code, prefix = code.slice(0, 3), isKeyShort = key.length < 2 || isDeadKey;
      if (prefix !== "Num") {
        // not (Numpad* or NumLock)
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
        prefix !== "Key" && prefix !== "Dig" && prefix !== "Arr" || (code = code.slice(code < "K" ? 5 : 3));
        // Note: <Alt+P> may generate an upper-case '\u013b' on Mac,
        // so for /^Key[A-Z]/, can assume the status of CapsLock.
        // https://github.com/philc/vimium/issues/2161#issuecomment-225813082
                key = code.length === 1 && isKeyShort ? !shiftKey || code < "0" || code > "9" ? code : ")!@#$%^&*(" /* kChar.EnNumTrans */ [+code] : _modifierKeys[key] ? utils_1.fgCache.l > 63 && utils_1.fgCache.l >> 6 /* kKeyLayout.MapModifierOffset */ === event.location ? MDF : "" : key === "Escape" ? "esc" : code.length < 2 || !isKeyShort ? key.startsWith("Arrow") && key.slice(5) || key : (mapped = _codeCorrectionMap.indexOf(code)) < 0 ? code : kCrct[mapped + 12 * +shiftKey];
      }
      key = shiftKey && key.length < 2 ? key : utils_1.Lower(key);
    } else if (key.length > 1 || key === " ") {
      key =  _getKeyName(event);
    } else {
      key = utils_1.fgCache.l & 16 /* kKeyLayout.ignoreCaps */ ? shiftKey ? key.toUpperCase() : utils_1.Lower(key) : key;
      if (!utils_1.os_ && shiftKey && key < "~" /* kChar.maxASCII */) {
        // "~" is upper-case
        mapped = exports.getKeyStat_(event, 1);
        const kSpecialModifier = 6;
        key = mapped & kSpecialModifier ? (mapped = kCrct.indexOf(key)) >= 0 ? kCrct[mapped % 12 + 12] : key > "/" /* kChar.maxNotNum */ && key < ":" /* kChar.minNotNum */ ? ")!@#$%^&*(" /* kChar.EnNumTrans */ [+key] : key : mapped & 1 || utils_1.fgCache.l & 16 /* kKeyLayout.ignoreCaps */ || !event.getModifierState("CapsLock") ? key : utils_1.Lower(key);
      }
    }
    return forceASCII === 5 ? key : eventWrapper.c = key;
  };
  exports.char_ = char_;
  const keybody_ = key => key.slice(key.lastIndexOf("-") + 1) || key && "-" /* kChar.minus */;
  exports.keybody_ = keybody_;
  exports.hasShift_ff = 0;
  const getKeyStat_ = (event, ignoreShift) => event.altKey | event.ctrlKey * 2 | event.metaKey * 4 | (ignoreShift ? 0 : event.shiftKey * 8);
  exports.getKeyStat_ = getKeyStat_;
  const isRepeated_ = event => {
    const repeat = event.e.repeat;
    return repeat;
  };
  exports.isRepeated_ = isRepeated_;
  const consumeKey_mac = (keyToConsume, eventToConsume) => {
    !utils_1.os_ && eventToConsume.metaKey || (utils_1.keydownEvents_[keyToConsume] = 1);
  };
  exports.consumeKey_mac = consumeKey_mac;
  const isEscape_ = key => key === "esc" /* kChar.esc */ ? 7 /* HandlerResult.AdvancedEsc */ : key === "c-[" /* kChar.bracketLeft */ ? 6 /* HandlerResult.PlainEsc */ : 0 /* HandlerResult.Nothing */;
  exports.isEscape_ = isEscape_;
  /** handler section */  const prevent_ = event => {
    event.preventDefault();
    utils_1.Stop_(event);
  };
  exports.prevent_ = prevent_;
  exports.replaceOrSuppressMost_ = (id, newHandler) => {
    exports.removeHandler_(id);
    handler_stack.push(newHandler || (event => {
      exports.isEscape_(getMappedKey(event, id)) && exports.removeHandler_(id);
      return event.i === 123 /* kKeyCode.f12 */ || event.i === 116 /* kKeyCode.f5 */ ? 1 /* HandlerResult.Suppress */ : 2 /* HandlerResult.Prevent */;
    }), id);
  };
  const whenNextIsEsc_ = (id, modeId, onEsc) => {
    exports.replaceOrSuppressMost_(id, event => {
      const key = getMappedKey(event, modeId);
      key && exports.removeHandler_(id);
      return exports.isEscape_(key) ? (onEsc(), 2 /* HandlerResult.Prevent */ /* HandlerResult.Nothing */) : 0;
    });
  };
  exports.whenNextIsEsc_ = whenNextIsEsc_;
  /**
     * if not timeout, then only suppress repeated keys; otherwise wait until no new keys for a while
     *
     * @argument callback can only be true if `timeout`; 0 means not to reset timer on a new key
     */  exports.suppressTail_ = (timeout, callback) => {
    let now, timer = 0 /* TimerID.None */ , func = event => {
      if (!timeout) {
        if (exports.isRepeated_(event)) {
          return 2 /* HandlerResult.Prevent */;
        }
        exit();
        return 0 /* HandlerResult.Nothing */;
      }
      if (event && (utils_1.abs_(utils_1.getTime() - now) > timeout || exports.isEscape_(getMappedKey(event, 0 /* kModeId.Plain */)) || event.e.z === utils_1.fgCache)) {
        exit();
        return 0 /* HandlerResult.Nothing */;
      }
      if (!timer || callback !== 0) {
        utils_1.clearTimeout_(timer);
        now = utils_1.getTime();
        timer = utils_1.timeout_(exit, timeout);
      }
      return 2 /* HandlerResult.Prevent */;
    }, exit = () => {
      exports.removeHandler_(func);
      callback && utils_1.isAlive_ && callback();
    };
    timeout && func();
    callback || handler_stack.push(func, func);
    return func;
  };
  const removeHandler_ = id => {
    const i = handler_stack.lastIndexOf(id);
    i > 0 && handler_stack.splice(i - 1, 2);
  };
  exports.removeHandler_ = removeHandler_;
  /** misc section */});
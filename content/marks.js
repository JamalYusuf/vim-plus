"use strict";
__filename = "content/marks.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "./port", "./hud", "../lib/keyboard_utils", "./scroller" ], (require, exports, utils_1, dom_utils_1, port_1, hud_1, keyboard_utils_1, scroller_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.goToMark_ = exports.scrollToMark = exports.activate = exports.setPreviousMarkPosition = exports.dispatchMark = void 0;
  // [1..9]
    let previous = [];
  exports.dispatchMark = (mark, global) => {
    let oldStr, newStr, match, newMark, a = dom_utils_1.createElement_("a");
    mark && dom_utils_1.textContent_s(a, oldStr = mark + "");
    global || (a.dataset.local = "");
    newMark = dom_utils_1.dispatchEvent_(window, dom_utils_1.newEvent_("vimiumMark", 0, 0, 0, {
      relatedTarget: a
    }, FocusEvent)) ? (newStr = dom_utils_1.textContent_s(a)) === oldStr ? mark : (match = newStr.split(",")).length > 1 ? [ ~~match[0], ~~match[1] ].concat(match.slice(2)) : mark : null;
    return mark ? newMark : newMark || [ scrollX | 0, scrollY | 0 ];
  };
  const setPreviousMarkPosition = idx => {
    const arr = exports.dispatchMark();
    arr.length === 2 && arr.push(utils_1.loc_.hash);
    previous[idx] = arr;
  };
  exports.setPreviousMarkPosition = setPreviousMarkPosition;
  const activate = (options, count) => {
    hud_1.hudShow(1 /* kTip.raw */ , options.t);
    keyboard_utils_1.replaceOrSuppressMost_(5 /* kHandler.marks */ , event => {
      let storage, local;
      if (event.i === 229 /* kKeyCode.ime */) {
        return 0 /* HandlerResult.Nothing */;
      }
      let keyChar = keyboard_utils_1.getMappedKey(event, 5 /* kModeId.Marks */);
      let tempPos;
      if (keyChar.length !== 1 && !keyboard_utils_1.isEscape_(keyChar)) {
        return 1 /* HandlerResult.Suppress */;
      }
      keyboard_utils_1.removeHandler_(5 /* kHandler.marks */);
      keyChar < ":" /* kChar.minNotNum */ && keyChar > "/" /* kChar.maxNotNum */ && options.n && (count = +keyChar || 10, 
      keyChar = "'");
      if (keyboard_utils_1.isEscape_(keyChar)) {
        hud_1.hudHide();
      } else if ("`'".includes(keyChar)) {
        if (options.a) {
          exports.setPreviousMarkPosition(count);
        } else {
          tempPos = previous[count];
          exports.setPreviousMarkPosition(tempPos ? 1 : count);
          tempPos && exports.scrollToMark(exports.dispatchMark(tempPos));
        }
        port_1.post_({
          H: 44 /* kFgReq.didLocalMarkTask */ ,
          c: options,
          i: count,
          n: !tempPos
        });
      } else {
        local = event.e.shiftKey !== options.s;
        port_1.post_({
          H: 21 /* kFgReq.marks */ ,
          c: options,
          l: local,
          k: event.i,
          n: keyChar,
          s: options.a ? exports.dispatchMark(0, !local) : local && (storage = localStorage) ? storage.getItem(`vimiumMark|${utils_1.locHref().split("#", 1)[0]}|${keyChar}`) : 0,
          u: utils_1.locHref()
        });
        utils_1.timeout_(() => {
          hud_1.hud_tipTimer || hud_1.hudHide();
        }, 100);
      }
      return 2 /* HandlerResult.Prevent */;
    });
  };
  exports.activate = activate;
  const scrollToMark = scroll => {
    scroll && (scroll[1] === 0 && scroll[2] && scroll[0] === 0 ? utils_1.loc_.hash = scroll[2] : scroller_1.makeElementScrollBy_(dom_utils_1.scrollingEl_(1), scroll[0] - scrollX, scroll[1] - scrollY));
  };
  exports.scrollToMark = scrollToMark;
  const goToMark_ = options => {
    const cb = () => {
      options.t && exports.setPreviousMarkPosition(1);
      exports.scrollToMark(exports.dispatchMark(options.s, options.g));
      hud_1.hudTip(1 /* kTip.raw */ , options.g + 1, options.t);
      port_1.runFallbackKey(options.f, 0);
    };
    options.w ? dom_utils_1.OnDocLoaded_(utils_1.timeout_.bind(0, cb, options.w), 1) : cb();
  };
  exports.goToMark_ = goToMark_;
});
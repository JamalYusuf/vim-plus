"use strict";
__filename = "content/frontend.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "../lib/rect", "./port", "./dom_ui", "./insert", "./key_handler", "./link_hints", "./scroller", "./mode_find", "./pagination", "./request_handlers", "./commands", "./extend_click", "./hud", "./page_enhance" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, rect_1, port_1, dom_ui_1, insert_1, key_handler_1, link_hints_1, scroller_1, mode_find_1, pagination_1, request_handlers_1, commands_1, extend_click_1, hud_1, page_enhance_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  const docReadyListeners = [];
  let completeListeners = [];
  dom_utils_1.set_OnDocLoaded_((callback, onloaded) => {
    utils_1.readyState_ > "l" || utils_1.readyState_ > "i" && onloaded ? (onloaded ? completeListeners : docReadyListeners).push(callback) : callback();
  });
  dom_utils_1.set_onReadyState_(event => {
    utils_1.set_readyState_(event && event !== 9 /* TimerType.fake */ ? utils_1.doc.readyState : "c");
    if (utils_1.readyState_ < "l") {
      docReadyListeners.forEach(utils_1.callFunc);
      docReadyListeners.length = 0;
      if (utils_1.readyState_ < "i") {
        completeListeners.forEach(utils_1.callFunc);
        completeListeners = docReadyListeners;
        utils_1.setupEventListener(0, commands_1.RSC, dom_utils_1.onReadyState_, 1, 1);
      }
    }
  });
  port_1.set_safeDestroy(silent => {
    if (!utils_1.isAlive_) {
      return;
    }
    utils_1.set_isEnabled_(false);
    utils_1.set_VTr(utils_1.locHref);
    port_1.hookOnWnd(3 /* HookAction.Destroy */);
    port_1.contentCommands_[7 /* kFgCmd.insertMode */ ]({
      r: 2
    });
    utils_1.vApi.e && utils_1.vApi.e(6 /* kContentCmd.Destroy */);
    dom_ui_1.ui_box && dom_ui_1.adjustUI(2);
    try {
      page_enhance_1.destroyPageEnhance();
    } catch (_a) {}
    utils_1.set_esc(null);
    VApi = null;
    utils_1.injector || define.noConflict();
    if (port_1.runtime_port) {
      try {
        port_1.runtime_port.disconnect();
      } catch (_b) {}
    }
    silent || utils_1.recordLog("Vim+ on %o has been destroyed at %o.")();
  });
  utils_1.set_vApi(VApi = {
    a: utils_1.setupKeydownEvents,
    b: link_hints_1.coreHints,
    c: scroller_1.executeScroll,
    d: port_1.safeDestroy,
    e: null,
    f: request_handlers_1.focusAndRun,
    g: pagination_1.filterTextToGoNext,
    h: hud_1.hudTip,
    i: 0,
    j: pagination_1.jumpToNextLink,
    k: scroller_1.scrollTick,
    l: dom_ui_1.learnCSS,
    n: 0,
    p: port_1.post_,
    q: port_1.requestHandlers[15 /* kBgReq.refreshPort */ ],
    r: utils_1.isAsContent || [ port_1.send_, port_1.safePost, (task, arg) => {
      task < 1 ? (arg = key_handler_1.currentKeys,  utils_1.esc(0 /* HandlerResult.Nothing */)) : task < 2 ? utils_1.set_clickable_(arg) : utils_1.set_VTr(arg);
      return arg;
    }, keyboard_utils_1.getMappedKey ],
    s: keyboard_utils_1.suppressTail_,
    t: port_1.requestHandlers[11 /* kBgReq.showHUD */ ],
    u: utils_1.locHref,
    v: dom_utils_1.runJS_,
    x: dom_ui_1.flash_,
    y() {
      return {
        b: mode_find_1.find_box,
        c: utils_1.clickable_,
        k: scroller_1.keyIsDown,
        r: dom_ui_1.ui_root,
        f: mode_find_1.find_input,
        m: [ key_handler_1.keyFSM, key_handler_1.mappedKeys, key_handler_1.mapKeyTypes, utils_1.fgCache || null ]
      };
    },
    z: null,
    $: scroller_1.$sc
  });
  if (!utils_1.isTop && !utils_1.injector) {
    const scoped_parApi = dom_ui_1.getParentVApi();
    if (scoped_parApi) {
      const state = scoped_parApi.y();
      // if not `vfind`, then a parent may have destroyed for unknown reasons
            if (state.b === dom_utils_1.frameElement_()) {
        port_1.safeDestroy(1);
        scoped_parApi.n();
      } else {
        utils_1.set_clickable_(state.c);
                key_handler_1.inheritKeyMappings(state);
      }
    } else if (insert_1.grabBackFocus) {
      request_handlers_1.set_needToRetryParentClickable(1);
      utils_1.set_clickable_(new Set);
    }
  }
  if (utils_1.isAlive_) {
    utils_1.set_clickable_(utils_1.clickable_ || new WeakSet);
    // here we call it before vPort.connect, so that the code works well even if runtime.connect is sync
        port_1.hookOnWnd(0 /* HookAction.Install */);
    port_1.runtimeConnect();
    utils_1.isAsContent && extend_click_1.ec_main_not_ff();
    utils_1.readyState_ < "i" || utils_1.setupEventListener(0, commands_1.RSC, dom_utils_1.onReadyState_, 0, 1);
  }
  port_1.contentCommands_.forEach((x, i) => x || alert(`Assert error: missing contentCommands_[${i}]`));
  port_1.requestHandlers.forEach((x, i) => x || i === 2 /* kBgReq.injectorRun */ || alert(`Assert error: missing requestHandlers[${i}]`));
});
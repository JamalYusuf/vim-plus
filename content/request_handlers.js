"use strict";
__filename = "content/request_handlers.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "../lib/rect", "./port", "./dom_ui", "./hud", "./key_handler", "./link_hints", "./marks", "./mode_find", "./insert", "./scroller", "./omni" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, rect_1, port_1, dom_ui_1, hud_1, key_handler_1, link_hints_1, marks_1, mode_find_1, insert_1, scroller_1, omni_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports._weakRef_old_ff = exports.focusAndRun = exports.showFrameMask = exports.set_needToRetryParentClickable = void 0;
  let frame_mask;
  let needToRetryParentClickable = 0;
  /** require `WeakSet` MUST exist; should ensure `clickable_.forEach` MUST exist */  function set_needToRetryParentClickable(_newNeeded) {
    needToRetryParentClickable = _newNeeded;
  }
  exports.set_needToRetryParentClickable = set_needToRetryParentClickable;
  port_1.set_requestHandlers([ 
  /* kBgReq.init: */ request => {
    utils_1.set_fgCache(utils_1.vApi.z = request.c || utils_1.vApi.z);
    utils_1.set_chromeVer_(utils_1.fgCache.v);
    utils_1.set_os_(utils_1.fgCache.o);
    rect_1.WithOldZoom && rect_1.set_isOldZoom_(utils_1.chromeVer_ < 128 /* BrowserVer.MinNewZoom */);
    if (request.f) {
      insert_1.set_grabBackFocus(insert_1.grabBackFocus && !(request.f & 4 /* Frames.Flags.userActed */));
      utils_1.set_isLocked_(request.f & 3 /* Frames.Flags.MASK_LOCK_STATUS */);
    }
    utils_1.inherited_ ? utils_1.esc(0 /* HandlerResult.Nothing */) : port_1.requestHandlers[9 /* kBgReq.keyFSM */ ](request);
    port_1.requestHandlers[1 /* kBgReq.reset */ ](request, 1);
    if (!utils_1.vApi.e && utils_1.isAsContent) {
      /*#__ENABLE_SCOPED__*/
      const t = utils_1.timeout_, i = utils_1.interval_, ct = utils_1.clearTimeout_;
      t(() => {
         utils_1.setupTimerFunc_cr_mv3(t, i, ct);
      }, 0);
            port_1.setupBackupTimer_cr();
      port_1.send_(37 /* kFgReq.wait */ , 0, () => utils_1.timeout_ !== t && utils_1.recordLog(112 /* kTip.logNotWorkOnSandboxed */)());
    }
    if (utils_1.isEnabled_) {
      utils_1.set_keydownEvents_(utils_1.safeObj(null));
      insert_1.insertInit(utils_1.injector ? utils_1.injector.$g : utils_1.fgCache.g && insert_1.grabBackFocus, 1);
      utils_1.isIFrameInAbout_ && !utils_1.vApi.e && utils_1.timeout_(port_1.hookOnWnd.bind(0, 0 /* HookAction.Install */), 1e3);
    } else {
      insert_1.set_grabBackFocus(false);
      port_1.hookOnWnd(2 /* HookAction.Suppress */);
      utils_1.vApi.e && utils_1.vApi.e(5 /* kContentCmd.SuppressClickable */);
    }
    dom_utils_1.MayWoPopover && dom_utils_1.withoutPopover_() && utils_1.setupEventListener(0, "toggle", dom_ui_1.onToggle, 1);
    port_1.requestHandlers[0 /* kBgReq.init */ ] = null;
    request.d && port_1.set_port_(null);
 // in case `port.onDisconnect` was not triggered
        dom_utils_1.OnDocLoaded_(() => {
      utils_1.set_onWndFocus(port_1.safePost.bind(0, {
        H: 9
 /* kFgReq.onFrameFocused */      }));
      utils_1.isTop || dom_utils_1.docHasFocus_() && utils_1.onWndFocus();
      utils_1.isTop || utils_1.timeout_(() => {
        const parApi = dom_ui_1.getParentVApi(), oldSet = utils_1.clickable_, parHints = parApi && parApi.b;
        if (needToRetryParentClickable) {
          if (parApi) {
            let count = 0;
            utils_1.set_clickable_(parApi.y().c);
            oldSet.forEach(el => {
              utils_1.clickable_.has(el) || (utils_1.clickable_.add(el), count++);
            });
            console.log(`Vim+: extend click: ${count ? "add " + count : "no"} local items sent to the parent's set.`);
          } else {
            utils_1.set_clickable_(new WeakSet(oldSet));
          }
        }
        const manager = parHints && parHints.p || parHints;
        manager && manager.h && utils_1.abs_(utils_1.getTime() - utils_1.abs_(manager.h)) < 1200 && manager.i(1);
      }, 330);
    });
    utils_1.isAsContent || (utils_1.injector || utils_1.vApi).$r(4 /* InjectorTask.extInited */);
  }, 
  /* kBgReq.reset: */ (request, initing) => {
    const newPassKeys = request.p, old = utils_1.isEnabled_;
    utils_1.set_isEnabled_(newPassKeys !== "");
    if (newPassKeys) {
      key_handler_1.set_isPassKeysReversed(newPassKeys[0] === "^" && newPassKeys.length > 2);
      const arr = (key_handler_1.isPassKeysReversed ? newPassKeys.slice(2) : newPassKeys).split(" ");
      key_handler_1.set_passKeys(new Set(arr));
    } else {
      key_handler_1.set_passKeys(newPassKeys);
    }
    if (initing) {
      return;
    }
    utils_1.esc(3 /* HandlerResult.ExitNormalMode */);
 // for passNextKey#normal
        utils_1.set_isLocked_(request.f);
    // if true, recover listeners on shadow roots;
    // otherwise listeners on shadow roots will be removed on next blur events
        if (utils_1.isEnabled_) {
      utils_1.set_keydownEvents_(utils_1.keydownEvents_ || utils_1.safeObj(null));
      old || insert_1.insertInit();
      old && !utils_1.isLocked_ || port_1.hookOnWnd(0 /* HookAction.Install */);
      // here should not return even if old - a url change may mean the fullscreen mode is changed
        } else {
      port_1.contentCommands_[7 /* kFgCmd.insertMode */ ]({
        r: 1
      });
    }
    dom_utils_1.onReadyState_();
    dom_ui_1.ui_box && dom_ui_1.adjustUI(+utils_1.isEnabled_ ? 1 : 2);
  }, 
  /* kBgReq.injectorRun: */ utils_1.injector && utils_1.injector.$m, 
  /* kBgReq.url: */ request => {
    delete request.N;
    request.u = (request.U & 1 ? utils_1.vApi.u : utils_1.locHref)();
    request.U & 2 && (request.s = marks_1.dispatchMark(0, !request.l));
    port_1.post_(request);
  }, 
  /* kBgReq.msg: */ port_1.onPortRes_, 
  /* kBgReq.eval: */ dom_ui_1.evalIfOK, 
  /* kBgReq.settingsUpdate: */ ({d: delta, v: newConfVersion}) => {
    utils_1.safer(delta);
    for (const i in delta) {
      utils_1.fgCache[i] = delta[i];
      const i2 = "_" + i;
      i2 in utils_1.fgCache && delete utils_1.safer(utils_1.fgCache)[i2];
    }
    delta.d != null && hud_1.hud_box && dom_utils_1.toggleClass_s(hud_1.hud_box, "D", !!delta.d);
    newConfVersion && utils_1.set_confVersion(newConfVersion);
  }, 
  /* kBgReq.focusFrame: */ req => {
    // Note: .c, .S are ensured to exist
    let div, mask = req.m;
    req.H && dom_ui_1.setUICSS(req.H);
    if (mask === 4 /* FrameMaskType.NormalNext */ && (dom_ui_1.checkHidden() || utils_1.doc.body && dom_utils_1.hasTag_("frameset", utils_1.doc.body) && (div = dom_utils_1.querySelector_unsafe_("div"), 
    !div || div === dom_ui_1.ui_box && !keyboard_utils_1.handler_stack.length))) {
      port_1.post_({
        H: 11 /* kFgReq.nextFrame */ ,
        k: req.k,
        f: req.f
      });
      return;
    }
    mask === 1 /* FrameMaskType.onOmniHide */ ? (omni_1.hide(0), utils_1.vApi.f()) : (mask || req.c) && utils_1.timeout_(() => {
      utils_1.vApi.f(req.c, req.a, req.n);
      utils_1.isAlive_ && port_1.runFallbackKey(req.f, mask === 3 /* FrameMaskType.OnlySelf */ ? 2 : 0);
    }, 1);
    utils_1.keydownEvents_[req.k] = 1;
    mask === 3 /* FrameMaskType.OnlySelf */ && req.f.$else || exports.showFrameMask(mask);
  }, 
  /* kBgReq.exitGrab: */ insert_1.exitGrab, 
  /* kBgReq.keyFSM: */ request => {
    utils_1.safer(key_handler_1.set_keyFSM(request.k || key_handler_1.keyFSM));
    key_handler_1.set_mapKeyTypes(request.t);
    key_handler_1.set_mappedKeys(request.m);
    key_handler_1.mappedKeys && utils_1.safer(key_handler_1.mappedKeys);
    utils_1.set_confVersion(request.v);
    utils_1.esc(0 /* HandlerResult.Nothing */);
 // so that passNextKey#normal refreshes nextKeys to the new keyFSM
    }, 
  /* kBgReq.execute: */ request => {
    request.H && dom_ui_1.setUICSS(request.H);
    utils_1.esc(0 /* HandlerResult.Nothing */);
    const options = request.a;
    utils_1.isEnabled_ && // in case of $then / $else
    port_1.contentCommands_[request.c](utils_1.safer(options || {}), request.n);
  }, 
  /* kBgReq.showHUD: */ req => {
    if (req.H) {
      dom_ui_1.setUICSS(req.H);
      if (req.f) {
        mode_find_1.set_findCSS(req.f);
        mode_find_1.styleInHUD && dom_ui_1.createStyle(req.f.i, mode_find_1.styleInHUD);
        mode_find_1.styleSelColorIn && (dom_ui_1.createStyle(req.f.c, mode_find_1.styleSelColorIn), 
        dom_ui_1.createStyle(req.f.c, mode_find_1.styleSelColorOut));
        mode_find_1.deactivate && mode_find_1.toggleSelectableStyle(1);
      }
    }
    req.k && hud_1.hudTip(req.k, req.d, req.t);
    req.l && hud_1.hud_box && dom_utils_1.toggleClass_s(hud_1.hud_box, "HL", 1);
  }, 
  /* kBgReq.count: */ request => {
    let n = key_handler_1.currentKeys === "-" ? -1 : parseInt(key_handler_1.currentKeys, 10) || 1, count2 = 0;
    utils_1.esc(0 /* HandlerResult.Nothing */);
    insert_1.exitGrab();
    if (request.m) {
      port_1.post_({
        H: 23 /* kFgReq.beforeCmd */ ,
        i: request.i
      });
      const now = utils_1.getTime(), result = utils_1.safeCall(confirm, request.m);
      count2 = utils_1.abs_(utils_1.getTime() - now) > 9 ? result ? 3 : 1 : 2;
    }
    port_1.post_({
      H: 24 /* kFgReq.cmd */ ,
      n,
      i: request,
      r: count2
    });
  }, 
  /* kBgReq.queryForRunAs: */ request => {
    const lock = insert_1.insert_Lock_() || dom_utils_1.deepActiveEl_unsafe_(1);
    port_1.post_({
      H: 35 /* kFgReq.respondForRunKey */ ,
      r: request,
      e: dom_utils_1.getElDesc_(lock)
    });
  }, 
  /* kBgReq.suppressForAWhile: */ request => {
    keyboard_utils_1.suppressTail_(request.t);
  }, 
  /* kBgReq.refreshPort: */ (req, updates) => {
    (req = req || updates & -513 /* PortType.refreshInBatch */) && port_1.runtime_port && port_1.runtime_port.disconnect();
    !req && port_1.runtime_port || port_1.runtimeConnect(updates);
  } ]);
  const showFrameMask = mask => {
    if (!utils_1.isTop && mask === 4 /* FrameMaskType.NormalNext */) {
      let docEl = dom_utils_1.docEl_unsafe_();
      docEl && dom_utils_1.scrollIntoView_(docEl);
    }
    if (mask < 3 /* FrameMaskType.minWillMask */ || !dom_utils_1.isHTML_()) {
      return;
    }
    if (frame_mask && utils_1.timeout_ !== utils_1.interval_) {
      frame_mask = 2;
      return;
    }
    let framemask_node, framemask_fmTimer;
    framemask_node = dom_utils_1.createElement_("div");
    dom_utils_1.setClassName_s(framemask_node, "R Frame" + (mask === 3 /* FrameMaskType.OnlySelf */ ? " One" : ""));
    framemask_fmTimer = utils_1.interval_(() => {
      if (frame_mask === 2) {
        frame_mask = 1;
        return;
      }
      frame_mask = 0;
      utils_1.clearTimeout_(framemask_fmTimer);
      dom_utils_1.removeEl_s(framemask_node);
    }, utils_1.isTop ? 200 : 350);
    frame_mask = 1;
    dom_ui_1.addUIElement(framemask_node, 1 /* AdjustType.DEFAULT */);
  };
  exports.showFrameMask = showFrameMask;
  port_1.set_hookOnWnd(action => {
    let f = action ? removeEventListener : addEventListener, t = true;
    f(dom_utils_1.BU, insert_1.onBlur, t);
    f(dom_utils_1.CLK, key_handler_1.anyClickHandler, t);
    f(dom_utils_1.DAC, scroller_1.onActivate, t);
    if (action !== 2 /* HookAction.Suppress */) {
      f("focus", insert_1.onFocus, t);
      // https://developer.chrome.com/blog/page-lifecycle-api/
            f("freeze", port_1.onFreezePort, t);
      // bfcache restore: reconnect the extension port without console noise
            f("pageshow", port_1.onPageShowPort, t);
      f("toggle", dom_ui_1.onToggle, t);
    }
    f("keydown", key_handler_1.onKeydown, t);
    f("keyup", key_handler_1.onKeyup, t);
  });
  const focusAndRun = (cmd, options, count, showBorder, childFrame) => {
    insert_1.exitGrab();
    let oldOnWndFocus = utils_1.onWndFocus, failed = true;
    utils_1.set_onWndFocus(() => {
      failed = false;
    });
    focus();
    /** Maybe a `doc.open()` has been called
         * Step 8 of https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#document-open-steps
         * https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/dom/doc.cc?q=Document::open&l=3107
         */    (failed || !utils_1.isEnabled_) && port_1.hookOnWnd(0 /* HookAction.Install */);
    // the line below is always necessary: see https://github.com/philc/vimium/issues/2551#issuecomment-316113725
        utils_1.set_onWndFocus(oldOnWndFocus);
    oldOnWndFocus();
    if (utils_1.isAlive_) {
      utils_1.esc(0 /* HandlerResult.Nothing */);
      scroller_1.setNewScrolling(childFrame || null);
      cmd && port_1.contentCommands_[cmd](options, count, showBorder);
      showBorder & 1 && exports.showFrameMask(5 /* FrameMaskType.ForcedSelf */);
    }
  };
  exports.focusAndRun = focusAndRun;
  exports._weakRef_old_ff = null;
});
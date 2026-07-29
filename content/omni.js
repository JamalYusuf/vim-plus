"use strict";
__filename = "content/omni.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "../lib/rect", "./scroller", "./dom_ui", "./link_hints", "./insert", "./hud", "./port" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, rect_1, scroller_1, dom_ui_1, link_hints_1, insert_1, hud_1, port_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.postToOmni = exports.activate = exports.hide = exports.omni_dialog_wo_pop_ = exports.omni_status = exports.omni_box = void 0;
  let box = null;
  exports.omni_box = box;
  let portToOmni = null;
  let status = -1 /* Status.NotInited */;
  exports.omni_status = status;
  let omniOptions = null;
  let secondActivateWithNewOptions = null;
  let timer_ = 0 /* TimerID.None */;
  let omni_dialog_wo_pop_;
  exports.omni_dialog_wo_pop_ = omni_dialog_wo_pop_;
  exports.hide = fromInner => {
    const oldIsActive = status > 0 /* Status.Inactive */;
    status < 0 /* Status.Inactive */ || (exports.omni_status = status = 0 /* Status.Inactive */);
    dom_ui_1.setupExitOnClick(10 /* kExitOnClick.REMOVE */);
    keyboard_utils_1.removeHandler_(8 /* kHandler.omni */);
    if (!fromInner) {
      oldIsActive && fromInner !== 0 && exports.postToOmni(1 /* VomnibarNS.kCReq.hide */);
      return;
    }
    dom_utils_1.setDisplaying_s(dom_utils_1.MayWoPopover && omni_dialog_wo_pop_ ? (omni_dialog_wo_pop_.close(), 
    omni_dialog_wo_pop_) : box);
    box.style.height = "";
    dom_ui_1.set_usePopover_(dom_ui_1.usePopover_ & -3);
  };
  exports.activate = (options, count) => {
    const init = ({k: secret, v: page, t: type, i: inner}) => {
      const reload = () => {
        type = 0 /* VomnibarNS.PageType.inner */;
        dom_utils_1.setOrRemoveAttr_s(el, kRef);
        // not skip the line below: in case main world JS adds some sandbox attributes
                dom_utils_1.setOrRemoveAttr_s(el, "sandbox");
        el.src = page = inner;
        omniOptions && (omniOptions.t = type);
      };
      const el = dom_utils_1.createElement_("iframe"), kRef = "referrerPolicy";
      dom_utils_1.setClassName_s(el, "R UI Omnibar");
      type !== 2 /* VomnibarNS.PageType.web */ || (utils_1.timeout_ === utils_1.interval_ && (utils_1.VTr(101 /* kTip.nonLocalhostRe */) && !utils_1.createRegExp(101 /* kTip.nonLocalhostRe */ , "i").test(page) || /^http:/.test(utils_1.locHref())) ? el[kRef] = "no-referrer" : 
      // not allowed by Chrome; recheck because of `tryNestedFrame`
      reload());
      el.src = page;
      let slowLoadTimer, loaded = 0, initMsgInterval = 0 /* TimerID.None */;
      el.onload = () => {
        loaded = 1;
        utils_1.clearTimeout_(slowLoadTimer);
 // safe even if undefined
                if (!utils_1.isAlive_) {
          return;
        }
        if (type !== 0 /* VomnibarNS.PageType.inner */ && utils_1.safeCall(isAboutBlank_throwable)) {
          utils_1.recordLog(111 /* kTip.logOmniFallback */)();
          reload();
          return;
        }
        !utils_1.isAsContent || utils_1.timeout_(() => {
          // Note: if JavaScript is disabled on `chrome://settings/content/siteDetails`,
          // then the iframe will always fail if only when DevTools is open
          utils_1.clearTimeout_(initMsgInterval);
          if (!utils_1.isAlive_ || status !== 1 /* Status.Initing */) {
            // only clear `onload` when receiving `VomnibarNS.kFReq.iframeIsAlive`, to avoid checking `i`
            utils_1.isAlive_ && secondActivateWithNewOptions && secondActivateWithNewOptions();
            return;
          }
          if (type !== 0 /* VomnibarNS.PageType.inner */) {
            reload();
            return;
          }
          resetWhenBoxExists();
          focus();
          exports.omni_status = status = -2 /* Status.BrokenOnce */;
          exports.activate(utils_1.safer({}), 1);
          exports.omni_status = status = -1 /* Status.NotInited */;
          hud_1.hudTip(21 /* kTip.omniFrameFail */ , 2);
        }, 400);
        const doPostMsg = postMsgStat => {
          const wnd = el.contentWindow, isFile = page.startsWith("file:");
          if (status !== 1 /* Status.Initing */ || !wnd || postMsgStat !== 1 && utils_1.safeCall(isAboutBlank_throwable) || isFile && el.src !== page) {
            return;
          }
          const channel = new MessageChannel;
          portToOmni = channel.port1;
          portToOmni.onmessage = onOmniMessage;
          const sec = [ "VimiumPlus", secret, omniOptions ];
          wnd.postMessage(sec, isFile ? "*" : new URL(page).origin, [ channel.port2 ]);
        };
        type === 2 /* VomnibarNS.PageType.web */ ? initMsgInterval = utils_1.interval_(doPostMsg, 66) : doPostMsg(1);
      };
      if (dom_utils_1.MayWoPopover && useDialog) {
        exports.omni_dialog_wo_pop_ = omni_dialog_wo_pop_ = dom_utils_1.createElement_("dialog");
        dom_utils_1.setClassName_s(omni_dialog_wo_pop_, "R DLG");
        dom_utils_1.appendNode_s(omni_dialog_wo_pop_, el);
      }
      exports.omni_box = box = el;
      dom_ui_1.addUIElement(dom_utils_1.MayWoPopover && omni_dialog_wo_pop_ || el, 2 /* AdjustType.MustAdjust */ , hud_1.hud_box);
      slowLoadTimer = type !== 0 /* VomnibarNS.PageType.inner */ ? utils_1.timeout_(i => {
        utils_1.clearTimeout_(initMsgInterval);
        loaded || i || reload();
      }, 2e3) : 0 /* TimerID.None */;
    };
    const resetWhenBoxExists = redo => {
      const oldStatus = status;
      if (oldStatus === -1 /* Status.NotInited */) {
        return;
      }
      exports.omni_status = status = -1 /* Status.NotInited */;
      portToOmni && portToOmni.close();
      dom_utils_1.removeEl_s(dom_utils_1.MayWoPopover && omni_dialog_wo_pop_ || box);
      portToOmni = exports.omni_box = box = omniOptions = null;
      dom_utils_1.MayWoPopover && (exports.omni_dialog_wo_pop_ = omni_dialog_wo_pop_ = null);
      refreshKeyHandler();
 // just for safer code
            secondActivateWithNewOptions ? secondActivateWithNewOptions() : redo && oldStatus > 1 && port_1.post_({
        H: 16 /* kFgReq.vomnibar */ ,
        r: 9,
        i: 1
      });
    };
    const isAboutBlank_throwable = () => {
      const doc = box.contentDocument;
      return doc && doc.URL === "about:blank";
    };
    const onOmniMessage = msg => {
      const data = msg.data;
      switch (data.N) {
       case 3 /* VomnibarNS.kFReq.iframeIsAlive */ :
        exports.omni_status = status = 2 /* Status.ToShow */;
        portToOmni = msg.target;
        !data.o && omniOptions && exports.postToOmni(omniOptions);
        box.onload = omniOptions = null;
        break;

       case 2 /* VomnibarNS.kFReq.style */ :
        const style = box.style, zoom = rect_1.docZoom_;
        const height2 = utils_1.math.ceil(data.h / zoom) + "px";
        style.height !== height2 && (style.height = height2);
        if (status === 2 /* Status.ToShow */) {
          exports.omni_status = status = 3 /* Status.Showing */;
          dom_utils_1.MayWoPopover && omni_dialog_wo_pop_ && (omni_dialog_wo_pop_.open || omni_dialog_wo_pop_.showModal());
          // on C118+U22, `box.focus()` may make contentWindow blur while the although itself does become "activeElement"
                    dom_ui_1.focusIframeContentWnd_(box, 0);
          utils_1.clearTimeout_(timer1);
          utils_1.timeout_(refreshKeyHandler, 160);
        }
        break;

       case 1 /* VomnibarNS.kFReq.focus */ :
        utils_1.vApi.f();
        utils_1.keydownEvents_[data.l] = 1;
        break;

       case 0 /* VomnibarNS.kFReq.hide */ :
        exports.hide(1);
        break;

       case 6 /* VomnibarNS.kFReq.scroll */ :
        scroller_1.beginScroll(0, data.k, data.b);
        break;

       case 7 /* VomnibarNS.kFReq.scrollGoing */ :
 // no break;
               case 8 /* VomnibarNS.kFReq.stopScroll */ :
        scroller_1.scrollTick(8 /* VomnibarNS.kFReq.stopScroll */ - data.N);
        break;

       case 5 /* VomnibarNS.kFReq.evalJS */ :
        dom_ui_1.evalIfOK(data);
        break;

       case 9 /* VomnibarNS.kFReq.broken */ :
        focus();

 // no break;
               case 10 /* VomnibarNS.kFReq.unload */ :
        utils_1.isAlive_ && resetWhenBoxExists(data.N === 9 /* VomnibarNS.kFReq.broken */);
        break;

       case 4 /* VomnibarNS.kFReq.hud */ :
        hud_1.hudTip(data.k);
        break;

       case 11 /* VomnibarNS.kFReq.scaled_old_cr */ :
        break;

       default:
        break;
      }
    };
    const refreshKeyHandler = () => {
      status < 3 /* Status.Showing */ ? status < 1 && keyboard_utils_1.removeHandler_(8 /* kHandler.omni */) : (keyboard_utils_1.replaceOrSuppressMost_(8 /* kHandler.omni */ , event => {
        if (insert_1.insert_Lock_()) {
          return 0 /* HandlerResult.Nothing */;
        }
        event = keyboard_utils_1.getMappedKey(event, 0 /* kModeId.Plain */);
        if (keyboard_utils_1.isEscape_(event)) {
          exports.hide();
          return 2 /* HandlerResult.Prevent */;
        }
        if (event === "f1" /* kChar.f1 */ || event === "f2" /* kChar.f2 */) {
          exports.postToOmni(2 /* VomnibarNS.kCReq.focus */);
          return 2 /* HandlerResult.Prevent */;
        }
        return 0 /* HandlerResult.Nothing */;
      }), link_hints_1.isHintsActive && keyboard_utils_1.replaceOrSuppressMost_(4 /* kHandler.linkHints */ , link_hints_1.coreHints.n));
    };
    const timer1 = utils_1.timeout_(refreshKeyHandler, 200 /* GlobalConsts.TimeOfSuppressingTailKeydownEvents */), oldTimer = timer_;
    const scale = rect_1.wndSize_(2), screenHeight = rect_1.wndSize_();
 // unit: logic pixel if not (C<52) else physical pixel
        const notInFullScreen = !dom_utils_1.fullscreenEl_unsafe_();
    const maxOutHeight = options.h / utils_1.min_(1, scale), topVH = 50 - maxOutHeight / screenHeight * 60;
    let url = options.url, upper = 0;
    // hide all further key events to wait iframe loading and focus changing from JS
        keyboard_utils_1.replaceOrSuppressMost_(8 /* kHandler.omni */);
    secondActivateWithNewOptions = null;
    timer_ = 0 /* TimerID.None */;
    utils_1.clearTimeout_(oldTimer);
    if (status === -2 /* Status.BrokenOnce */) {
      return;
    }
    if (dom_ui_1.checkHidden(6 /* kFgCmd.vomnibar */ , options, count)) {
      return;
    }
    if (!options || !options.k || !options.v) {
      return;
    }
    if (status === -1 /* Status.NotInited */ && utils_1.readyState_ > "l" && !oldTimer) {
      utils_1.clearTimeout_(timer1);
      timer_ = utils_1.timeout_(exports.activate.bind(0, options, count), 500);
      return;
    }
    (url === true || count !== 1 && url == null) && (options.url = url = url ? dom_ui_1.getSelectionText() : "") && options.newtab == null && (options.newtab = 1);
    let parApi;
    if (!utils_1.isTop && !options.$forced && notInFullScreen) {
      // check $forced to avoid dead loops
      parent === top && (parApi = dom_ui_1.getParentVApi()) ? parApi.f(6 /* kFgCmd.vomnibar */ , options, count, 0, dom_utils_1.frameElement_()) : port_1.post_({
        H: 28 /* kFgReq.gotoMainFrame */ ,
        f: 0,
        c: 6 /* kFgCmd.vomnibar */ ,
        n: count,
        a: options
      });
      return;
    }
    if (!dom_utils_1.isHTML_()) {
      return;
    }
    omniOptions = null;
    rect_1.getViewBox_();
    const woPopover = dom_utils_1.MayWoPopover ? dom_utils_1.withoutPopover_() : 0;
    dom_ui_1.set_usePopover_(!woPopover && (!notInFullScreen || rect_1.dScale_ !== 1 || rect_1.docZoomNew_ !== 1 || dom_ui_1.usePopover_ > 7 || rect_1.paintBox_ || dom_utils_1.hasInCSSFilter_()) ? dom_ui_1.usePopover_ | 2 : dom_ui_1.usePopover_ & -3);
    options.u = options.u || utils_1.vApi.u();
    box && !(utils_1.chromeVer_ > 124 && dom_utils_1.ElementProto_not_ff.moveBefore) && dom_ui_1.adjustUI();
    const useDialog = dom_utils_1.MayWoPopover ? !!omni_dialog_wo_pop_ || woPopover && status === -1 /* Status.NotInited */ && !(dom_utils_1.MayWoTopLevel && dom_utils_1.withoutToplevel_()) && ((rect_1.WithOldZoom && rect_1.isOldZoom_ ? rect_1.dScale_ : rect_1.dScale_ / rect_1.docZoomNew_) !== 1 || !!rect_1.paintBox_ || dom_utils_1.hasInCSSFilter_()) : 0;
    // `canUseVW` is computed for the gulp-built version of vomnibar.html
        const canUseVW = woPopover ? dom_ui_1.usePopover_ & 2 || useDialog || notInFullScreen && (rect_1.WithOldZoom && rect_1.isOldZoom_ ? rect_1.docZoom_ === 1 && rect_1.dScale_ === 1 : rect_1.docZoomNew_ === 1) : dom_ui_1.usePopover_ & 2;
    const width = canUseVW ? rect_1.wndSize_(1) : (rect_1.prepareCrop_(), rect_1.WithOldZoom ? rect_1.viewportRight * rect_1.docZoom_ * rect_1.bZoom_ : rect_1.viewportRight);
    options.w = [ width, screenHeight, scale ];
    if (status === -1 /* Status.NotInited */) {
      options.$forced || (// re-check it for safety
      options.$forced = 1);
      if (link_hints_1.tryNestedFrame(6 /* kFgCmd.vomnibar */ , options, count)) {
        return;
      }
      exports.omni_status = status = 1 /* Status.Initing */;
      init(options);
    } else {
      if (utils_1.safeCall(isAboutBlank_throwable)) {
        secondActivateWithNewOptions = exports.activate.bind(0, options, count);
        status > 1 && resetWhenBoxExists();
        return;
      }
      if (status === 0 /* Status.Inactive */) {
        exports.omni_status = status = 2 /* Status.ToShow */;
        dom_utils_1.setDisplaying_s(dom_utils_1.MayWoPopover && omni_dialog_wo_pop_ || box, 1);
      } else if (status > 2 /* Status.ToShow */) {
        exports.postToOmni(2 /* VomnibarNS.kCReq.focus */);
        exports.omni_status = status = 2 /* Status.ToShow */;
      }
    }
    const style = box.style;
    dom_utils_1.toggleClass_s(box, "O2", !canUseVW);
    style.top = topVH > 6400 / screenHeight ? topVH.toFixed(1) + (canUseVW ? "vh" : "%") : "";
    status !== 3 /* Status.Showing */ && (style.height = utils_1.math.ceil(maxOutHeight / rect_1.docZoom_) + "px");
    style.zoom = (dom_ui_1.usePopover_ & 2 || useDialog) && rect_1.docZoomNew_ - 1 ? 1 / rect_1.docZoomNew_ + "" : "";
    (dom_utils_1.MayWoPopover && omni_dialog_wo_pop_ || options.e) && dom_ui_1.setupExitOnClick(2 /* kExitOnClick.vomnibar */);
    if (url != null) {
      url = options.url = url || options.u;
      upper = count > 1 ? 1 - count : count < 0 ? -count : 0;
    }
    options.N = 0 /* VomnibarNS.kCReq.activate */;
    options.k = options.v = options.i = options.u = "";
    if (!url || !url.includes("://")) {
      options.p = "";
      status > 1 /* Status.Initing */ ? exports.postToOmni(options) : omniOptions = options;
      return;
    }
    port_1.send_(4 /* kFgReq.parseSearchUrl */ , {
      t: options.s,
      p: upper,
      u: url
    }, ((options2, search) => {
      options2.p = search;
      status > 1 /* Status.Initing */ ? exports.postToOmni(options2) : omniOptions = options2;
    }).bind(0, options));
  };
  const postToOmni = msg => {
    portToOmni.postMessage(msg);
  };
  exports.postToOmni = postToOmni;
});
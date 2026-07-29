"use strict";
__filename = "content/async_dispatcher.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "../lib/keyboard_utils", "../lib/rect", "./insert", "./port", "./dom_ui", "./link_hints", "./scroller" ], (require, exports, utils_1, dom_utils_1, keyboard_utils_1, rect_1, insert_1, port_1, dom_ui_1, link_hints_1, scroller_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.showPicker_ = exports.select_ = exports.click_async = exports.wrap_enable_bubbles = exports.unhover_async = exports.hover_async = exports.touch_cr_ = exports.setupIDC_cr = exports.catchAsyncErrorSilently = exports.__asyncAwaiter = exports.__asyncGenerator = exports.set_evIDC_cr = exports.set_lastBubbledHovered_ = exports.set_lastHovered_ = exports.evIDC_cr = exports.lastHovered_ = void 0;
  let evIDC_cr;
  exports.evIDC_cr = evIDC_cr;
  let lastHovered_;
  exports.lastHovered_ = lastHovered_;
  let lastBubbledHovered_;
  let enableBubblesForEnterLeave_;
  function set_lastHovered_(_newHovered) {
    exports.lastHovered_ = lastHovered_ = _newHovered;
  }
  exports.set_lastHovered_ = set_lastHovered_;
  function set_lastBubbledHovered_(_newBH) {
    return lastBubbledHovered_ = _newBH;
  }
  exports.set_lastBubbledHovered_ = set_lastBubbledHovered_;
  function set_evIDC_cr(_newIDC) {
    exports.evIDC_cr = evIDC_cr = _newIDC;
  }
  exports.set_evIDC_cr = set_evIDC_cr;
  /** util functions */  // used by `{ ...init }`
  const __generator = 0;
  exports.__asyncGenerator = __generator;
  const __awaiter = 0;
  exports.__asyncAwaiter = __awaiter;
  const catchAsyncErrorSilently = __pFromAsync => __pFromAsync.catch(e => {
    console.log("Vim+: unexpected error\n", e);
  });
  exports.catchAsyncErrorSilently = catchAsyncErrorSilently;
  /** sync dispatchers */  const mouse_ = (element, type, center, modifiers, relatedTarget, button, isTouch, forceToBubble, alsoPointerUpDown) => {
    const kUpgradeClick = true;
    const doc1 = element.ownerDocument, view = doc1.defaultView || window, tyKey = type.charAt(5), 
    // is: down | up | (click) | dblclick | auxclick
    detail = !"dui".includes(tyKey) || button === 1 /* kClickButton.auxiliary */ && tyKey === "u" ? 0 : button & 4 /* kClickButton.primaryAndTwice */ ? 2 : 1, cancelable = tyKey !== "e" && tyKey !== "l", // not (enter | leave)
    x = center[0], y = center[1], altKey = !!modifiers && modifiers[0], ctrlKey = !!modifiers && modifiers[1], metaKey = !!modifiers && modifiers[2], shiftKey = !!modifiers && modifiers[3];
    button &= 3;
    relatedTarget = relatedTarget && relatedTarget.ownerDocument === doc1 ? relatedTarget : null;
    let mouseEvent, pointerEvent, init2;
    let type2;
    // note: there seems no way to get correct screenX/Y of an element
        {
      // Note: The `composed` here may require Shadow DOM support
      const init = {
        bubbles: cancelable || !!forceToBubble,
        cancelable,
        composed: cancelable,
        view,
        detail,
        screenX: x,
        screenY: y,
        clientX: x,
        clientY: y,
        ctrlKey,
        altKey,
        shiftKey,
        metaKey,
        button,
        buttons: tyKey === "d" ? button - 1 ? button || 1 : 4 : 0,
        relatedTarget
      };
      if (alsoPointerUpDown || kUpgradeClick && type < "d") {
        type2 = !kUpgradeClick || alsoPointerUpDown ? `pointer${type.slice(5)}` : type;
        init2 = Object.assign(Object.assign({}, init), {
          detail: +!tyKey,
          isPrimary: !kUpgradeClick || !!alsoPointerUpDown,
          pointerId: 1,
          pointerType: isTouch ? "touch" : "mouse",
          pressure: tyKey === "d" ? .5 : isTouch = 0
        });
      }
      const init2ForUpgrading = kUpgradeClick && !alsoPointerUpDown && init2;
      exports.setupIDC_cr(init2ForUpgrading || init);
      init2 && (pointerEvent = new PointerEvent(type2, init2));
      mouseEvent = init2ForUpgrading || init2 && alsoPointerUpDown > 1 ? pointerEvent : new MouseEvent(type, init);
    }
    const ret = dom_utils_1.dispatchAsync_(element, pointerEvent || mouseEvent);
    return pointerEvent && mouseEvent !== pointerEvent ? ret.then().then(notPrevented => notPrevented ? isTouch ? 3 : dom_utils_1.dispatchAsync_(element, mouseEvent) : 2) : ret;
  };
  exports.setupIDC_cr = init => {
    init.sourceCapabilities = exports.evIDC_cr = evIDC_cr = evIDC_cr || new InputDeviceCapabilities({
      fireTouchEvents: false
    });
  };
  exports.touch_cr_ = (element, [x, y], end) => {
    const touchObj = new Touch({
      identifier: 99,
      target: element,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      pageX: x + scrollX,
      pageY: y + scrollY,
      radiusX: 8,
      radiusY: 8,
      force: 1
    }), touches = end ? [] : [ touchObj ], touchEvent = dom_utils_1.newEvent_(end ? "touchend" : "touchstart", 1, 0, 0, {
      touches,
      targetTouches: touches,
      changedTouches: [ touchObj ]
    }, TouchEvent);
    return dom_utils_1.dispatchAsync_(element, touchEvent);
  };
  /** async dispatchers */
  /** note: will NOT skip even if newEl == @lastHovered */  exports.hover_async = async (newEl, center, doesFocus, allowScroll) => {
    // if center is affected by zoom / transform, then still dispatch mousemove
    let elFromPoint = dom_utils_1.elFromPoint_(center, newEl), canDispatchMove = !newEl || elFromPoint === newEl || !elFromPoint || !dom_utils_1.IsAInB_(newEl, elFromPoint), last = dom_utils_1.derefInDoc_(lastHovered_), forceToBubble = lastBubbledHovered_ === lastHovered_, N = exports.lastHovered_ = lastHovered_ = lastBubbledHovered_ = null;
    const notSame = newEl !== last;
    if (last) {
      // MS Edge 90 dispatches mouseout and mouseleave if only a target element is in doc
      await mouse_(last, "mouseout", [ 0, 0 ], N, notSame ? newEl : N);
      if ((!newEl || notSame && !dom_utils_1.IsAInB_(newEl, last, 1)) && dom_utils_1.IsAInB_(last, utils_1.doc)) {
        await mouse_(last, "mouseleave", [ 0, 0 ], N, newEl, 0 /* kClickButton.none */ , false, forceToBubble || enableBubblesForEnterLeave_);
        doesFocus && dom_utils_1.IsAInB_(last) && // always blur even when moved to another document
        dom_utils_1.blur_unsafe(last);
      }
      last = notSame ? last : N;
      await 0;
 // should keep function effects stable - not related to what `newEl` is
        } else {
      last = N;
    }
    if (newEl && dom_utils_1.IsAInB_(newEl)) {
      // then center is not null
      await mouse_(newEl, "mouseover", center, N, last);
      if (dom_utils_1.IsAInB_(newEl)) {
        await mouse_(newEl, "mouseenter", center, N, last, 0 /* kClickButton.none */ , false, enableBubblesForEnterLeave_);
        canDispatchMove && dom_utils_1.IsAInB_(newEl) && await mouse_(newEl, "mousemove", center);
        exports.lastHovered_ = lastHovered_ = dom_utils_1.IsAInB_(newEl) ? utils_1.weakRef_not_ff(newEl) : N;
        lastBubbledHovered_ = enableBubblesForEnterLeave_ && lastHovered_;
        notSame && doesFocus && lastHovered_ && await dom_utils_1.dispatchAsync_(newEl, 2 /* kDispatch.focusFn */ , {
          preventScroll: !allowScroll
        });
      }
    }
    // here always ensure lastHovered_ is "in DOM" or null
    };
  exports.unhover_async = async element => {
    const old = dom_utils_1.derefInDoc_(lastHovered_), active = element || old;
    old !== (element || null) && await exports.hover_async();
    exports.lastHovered_ = lastHovered_ = utils_1.weakRef_not_ff(element);
    await exports.hover_async();
    dom_utils_1.blur_unsafe(active);
  };
  const wrap_enable_bubbles = (opts, func, args) => {
    const bubbles = opts && opts.bubbles && (enableBubblesForEnterLeave_ = 1), p = func.apply(0, args);
    return bubbles ? p.then(val => (enableBubblesForEnterLeave_ = 0, val)) : p;
  };
  exports.wrap_enable_bubbles = wrap_enable_bubbles;
  /** if `addFocus`, then `element` must has `.focus` */  exports.click_async = async (element, rect, addFocus, modifiers, action, button, /** default: false */ touchMode, /** default: true */ pointerEvents, noXY) => {
    const kMenu = "contextmenu", kMU = "mouseup";
    const userOptions = link_hints_1.isHintsActive && !(link_hints_1.hintManager || link_hints_1.coreHints).$().k.c ? link_hints_1.hintOptions : null;
    const xy = userOptions && !noXY && userOptions.xy || button === 2 /* kClickButton.second */ && userOptions[kMenu] !== false && {
      x: 20,
      y: -4
    } || null;
    const center = rect_1.center_(rect || (rect = rect_1.getVisibleClientRect_(element)), xy);
    const sedIf = userOptions && userOptions.sedIf;
    let result = utils_1.max_((action |= 0) - 8 /* kClickAction.BaseMayInteract */ , 0);
    const tag = dom_utils_1.htmlTag_(element);
    const initialStat = result & 2 /* ActionType.interact */ && result < 7 /* ActionType.NothingSpecial */ ? result & 1 /* ActionType.dblClick */ ? tag === "video" && dom_utils_1.fullscreenEl_unsafe_() : element.paused : 0;
    const isTouch = touchMode === true || !!touchMode && dom_utils_1.isInTouchMode_cr_();
    if (isTouch) {
      await exports.touch_cr_(element, center);
      dom_utils_1.IsAInB_(element) && await exports.touch_cr_(element, center, 1);
      if (!dom_utils_1.IsAInB_(element)) {
        return;
      }
    }
    if (element !== utils_1.deref_(lastHovered_)) {
      await exports.wrap_enable_bubbles(userOptions, exports.hover_async, [ element, center ]);
      if (!lastHovered_) {
        return;
      }
    }
    let alsoPointerUpDown = pointerEvents === false ? 0 : isTouch && (button & 3 /* kClickButton.second */ || result < 7 /* ActionType.NothingSpecial */ && result & 1 /* ActionType.dblClick */) ? 2 : 1;
    let pointerdownNotPrevented = await mouse_(element, dom_utils_1.MDW, center, modifiers, 0, button, isTouch, 0, alsoPointerUpDown);
    await 0;
    if (!dom_utils_1.IsAInB_(element)) {
      return;
    }
    if (pointerdownNotPrevented === 3) {
      await mouse_(element, kMU, center, modifiers, 0, button, isTouch, alsoPointerUpDown = 0, 3);
      await 0;
      pointerdownNotPrevented = await mouse_(element, dom_utils_1.MDW, center, modifiers, 0, button);
      await 0;
    }
    // Note: here we can check doc.activeEl only when @click is used on the current focused document
        if (addFocus && pointerdownNotPrevented & 1 && element !== dom_utils_1.getRootNode_mounted(element).activeElement && !element.disabled) {
      await dom_utils_1.dispatchAsync_(element, 2 /* kDispatch.focusFn */);
      if (!dom_utils_1.IsAInB_(element)) {
        return;
      }
      await 0;
    }
    await mouse_(element, kMU, center, modifiers, 0, button, isTouch, 0, alsoPointerUpDown && alsoPointerUpDown | pointerdownNotPrevented);
    await 0;
    if (!dom_utils_1.IsAInB_(element) || button & 1 /* kClickButton.auxiliary */) {
      return;
    }
    if (button & 2 /* kClickButton.second */) {
      // if button is the right, then auxclick can be triggered even if element.disabled
      await mouse_(element, "auxclick", center, modifiers, 0, button, isTouch);
      await mouse_(element, kMenu, center, modifiers, 0, button, isTouch);
      return;
    }
    if (element.disabled) {
      return;
    }
    const isColorInput = dom_utils_1.editableTypes_[tag] === 5 /* EditableType.Input */ && dom_utils_1.uneditableInputs_[element.type] === 4;
    let url;
    let parentAnchor, sedIfRe;
    if (!utils_1.vApi.e && utils_1.isAsContent && isColorInput) {
      return;
    }
    result = result ? result - 7 /* ActionType.NothingSpecial */ ? result : 0 /* ActionType.OnlyDispatch */ : (action || sedIf) && (parentAnchor = dom_utils_1.findAnchor_(element)) && (url = dom_utils_1.attr_s(parentAnchor, "href")) && url[0] !== "#" ? sedIf && (sedIfRe = utils_1.tryCreateRegExp(sedIf)) && sedIfRe.test(parentAnchor.href) ? 9 /* ActionType.OpenTabButNotDispatch */ : utils_1.isJSUrl(url) || action < 4 ? 0 /* ActionType.OnlyDispatch */ : 9 /* ActionType.OpenTabButNotDispatch */ /* ActionType.OnlyDispatch */ : isColorInput || dom_utils_1.editableTypes_[tag] === 2 /* EditableType.Select */ ? 5 /* ActionType.ShowPicker */ : 0 /* ActionType.OnlyDispatch */;
    const isCommonClick = result < 9 /* ActionType.OpenTabButNotDispatch */ && button !== 4 /* kClickButton.primaryAndTwice */ && !(modifiers && modifiers[0]);
    isCommonClick && scroller_1.setNewScrolling(element);
 // DOMActivate is not triggered if a click event is cancelled (prevented)
        if ((result > 8 || await await mouse_(element, dom_utils_1.CLK, center, modifiers, 0, button, isTouch) && result || result & 1 /* ActionType.dblClick */) && rect_1.getVisibleClientRect_(element)) {
      // require element is still visible
      isCommonClick && scroller_1.set_cachedScrollable(scroller_1.currentScrolling);
      if (result < 8 /* ActionType.MinOpenUrl */) {
        (!(result & 1 /* ActionType.dblClick */ && result < 4) || element.disabled || (// use old rect
        await exports.click_async(element, rect, 0, modifiers, 0 /* kClickAction.none */ , 4 /* kClickButton.primaryAndTwice */ , isTouch, pointerEvents, noXY), 
        rect_1.getVisibleClientRect_(element) && await await mouse_(element, "dblclick", center, modifiers, 0, 4 /* kClickButton.primaryAndTwice */) && rect_1.getVisibleClientRect_(element))) && (result & 2 /* ActionType.interact */ ? result & 1 /* ActionType.dblClick */ ? initialStat !== false && initialStat === dom_utils_1.fullscreenEl_unsafe_() && (initialStat ? utils_1.doc.exitFullscreen() : element.requestFullscreen()) : element.paused === initialStat && (initialStat ? element.play() : element.pause()) : result & 4 /* ActionType.hasPicker */ && exports.showPicker_(element, dom_utils_1.editableTypes_[tag]));
        return;
      }
      // use latest attributes ; now result > 0, so hintOptions and specialAction exists
      /** ignore {@link #BrowserVer.Min$TargetIsBlank$Implies$Noopener}, since C91 and FF88 always set openerTabId */      (link_hints_1.hintApi ? link_hints_1.hintApi.p : port_1.post_)({
        H: 8 /* kFgReq.openUrl */ ,
        u: parentAnchor.href,
        f: true,
        o: userOptions && utils_1.parseOpenPageUrlOptions(userOptions),
        r: action === 3 /* kClickAction.plainInNewWindow */ ? 2 /* ReuseType.newWnd */ : action > 5 || !action ? 0 /* ReuseType.current */ : (action === 4 /* kClickAction.forceToOpenInLastWnd */ ? -4 /* ReuseType.OFFSET_LAST_WINDOW */ : 0) + ((link_hints_1.mode1_ & 3 /* HintMode.mask_focus_new */) - 2 /* HintMode.newTab */ ? -1 /* ReuseType.newFg */ : -2 /* ReuseType.newBg */)
      });
      return 1;
    }
  };
  const select_ = (element, rect, show_flash, action, suppressRepeated) => {
    const y = scrollY;
    const sel = dom_utils_1.getEditableType_(element) == 3 /* EditableType.ContentEditable */ && dom_ui_1.getSelected();
    const range = sel && rect_1.selRange_(sel);
    const focusedRange = range && range.cloneRange();
    const focusedRect = focusedRange && dom_ui_1.getSelectionBoundingBox_(focusedRange.collapse(false), 0, focusedRange);
    return exports.catchAsyncErrorSilently(exports.click_async(element, !focusedRect || rect && !rect_1.isContaining_(rect, focusedRect) ? rect : focusedRect, 1)).then(() => {
      rect_1.view_(element, !show_flash, y);
      // re-compute rect of element, in case that an input is resized when focused
            show_flash && dom_ui_1.flash_(element);
      if (element !== insert_1.insert_Lock_()) {
        return;
      }
      // then `element` is always safe
            try {
        dom_ui_1.moveSel_s_throwable(element, action);
      } catch (e) {
        console.log("Vim+: failed in moving caret.", e);
      }
      suppressRepeated && keyboard_utils_1.suppressTail_();
    });
  };
  exports.select_ = select_;
  const showPicker_ = (element, type) => {
    utils_1.vApi.e ? utils_1.vApi.e(3 /* kContentCmd.ShowPicker_cr_mv3 */ , element) : type < 5 /* EditableType.Input */ && utils_1.isAsContent || utils_1.safeCall(() => element.showPicker());
  };
  exports.showPicker_ = showPicker_;
});
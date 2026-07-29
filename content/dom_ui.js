"use strict";
__filename = "content/dom_ui.js";
define([ "require", "exports", "../lib/utils", "../lib/keyboard_utils", "../lib/dom_utils", "../lib/rect", "./scroller", "./mode_find", "./link_hints", "./port", "./insert", "./key_handler", "./omni", "./local_links", "./async_dispatcher" ], (require, exports, utils_1, keyboard_utils_1, dom_utils_1, rect_1, scroller_1, mode_find_1, link_hints_1, port_1, insert_1, key_handler_1, omni_1, local_links_1, async_dispatcher_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.onToggle = exports.filterOutInert = exports.checkHidden = exports.evalIfOK = exports.set_getParentVApi = exports.getParentVApi = exports.set_getWndVApi_ff = exports.getWndVApi_ff = exports.focusIframeContentWnd_ = exports.doExitOnClick_ = exports.setupExitOnClick = exports.flash_ = exports.getRect = exports.collpaseSelection = exports.moveSel_s_throwable = exports.selectNode_ = exports.selectAllOfNode = exports.resetSelectionToDocStart = exports.removeSelection = exports.maySelectRight_ = exports.doesSelectRightInEditableLock = exports.getSelectionText = exports.getSelectionBoundingBox_ = exports.getSelectionParent_unsafe = exports.getSelected = exports.getSelectionOf = exports.hasGetSelection = exports.checkDocSelectable = exports.learnCSS = exports.setUICSS = exports.createStyle = exports.ensureBorder = exports.adjustUI = exports.addElementList = exports.getBoxTagName_old_cr = exports.addUIElement = exports.removeDialog_ = exports.set_usePopover_ = exports.set_helpBox = exports.set_hideHelp = exports.toExitOnClick_ = exports.hideHelp = exports.helpBox = exports.usePopover_ = exports.ourDialogEl_ = exports.lastFlashEl = exports.style_ui = exports.ui_root = exports.ui_box = void 0;
  let box_ = null;
  exports.ui_box = box_;
  let styleIn_ = null;
  exports.style_ui = styleIn_;
  let root_ = null;
  exports.ui_root = root_;
  let uiParent_;
  let cssPatch_ = null;
  let lastFlashEl = null;
  exports.lastFlashEl = lastFlashEl;
  let toExitOnClick_ = 0 /* kExitOnClick.NONE */;
  exports.toExitOnClick_ = toExitOnClick_;
  let ourDialogEl_;
  exports.ourDialogEl_ = ourDialogEl_;
  let usePopover_ = 0;
  exports.usePopover_ = usePopover_;
  let helpBox;
  exports.helpBox = helpBox;
  let hideHelp;
  exports.hideHelp = hideHelp;
  function set_hideHelp(_newHide) {
    exports.hideHelp = hideHelp = _newHide;
  }
  exports.set_hideHelp = set_hideHelp;
  function set_helpBox(_newHelpBox) {
    exports.helpBox = helpBox = _newHelpBox;
  }
  exports.set_helpBox = set_helpBox;
  function set_usePopover_(_newUsePopover) {
    exports.usePopover_ = usePopover_ = _newUsePopover;
  }
  exports.set_usePopover_ = set_usePopover_;
  const removeDialog_ = () => {
    ourDialogEl_ && (dom_utils_1.removeEl_s(ourDialogEl_), exports.ourDialogEl_ = ourDialogEl_ = null);
  };
  exports.removeDialog_ = removeDialog_;
  exports.addUIElement = (element, adjust_type) => {
    exports.ui_box = box_ = dom_utils_1.createElement_("div");
    uiParent_ = exports.ui_root = root_ = dom_utils_1.attachShadow_(box_);
    // listen "load" so that safer if shadowRoot is open
    // it doesn't matter to check `.mode == "closed"`, but not `.attachShadow`
        (!dom_utils_1.MayWoPopover || !dom_utils_1.withoutPopover_()) && dom_utils_1.appendNode_s(root_, uiParent_ = dom_utils_1.createElement_("span"));
 // should use a listener in active mode: https://www.chromestatus.com/features/5745543795965952
        exports.addUIElement = (element2, adjust2, before) => {
      const doesAdjustFirst = box_.isConnected && element2 !== ourDialogEl_;
      adjust2 && doesAdjustFirst && exports.adjustUI();
      uiParent_.insertBefore(element2, before === true ? uiParent_.firstChild : before || null);
      adjust2 && !doesAdjustFirst && exports.adjustUI();
    };
    exports.setUICSS = innerCSS => {
      const S = "style";
      exports.style_ui = styleIn_ = dom_utils_1.createElement_(S);
      exports.setUICSS = css => {
        exports.createStyle(cssPatch_ ? cssPatch_[1](css) : css, styleIn_);
      };
      exports.setUICSS(innerCSS);
      dom_utils_1.appendNode_s(uiParent_, styleIn_);
      /**
             * Note: Tests on C35, 38, 41, 44, 47, 50, 53, 57, 60, 63, 67, 71, 72 confirmed
             *        that el.sheet has been valid when promise.then, even on XML pages.
             * `AdjustType.NotAdjust` must be used before a certain, clear normal adjusting
             */
      // enforce webkit to build the style attribute node, and then we can remove it totally
            box_.hasAttribute(S) && dom_utils_1.setOrRemoveAttr_s(box_, S);
      if (adjust_type) {
        exports.adjustUI();
        adjust_type = 1 /* AdjustType.DEFAULT */;
 // erase info about what's a first command
            }
    };
    dom_utils_1.appendNode_s(uiParent_, element);
    if (styleIn_) {
      exports.setUICSS(styleIn_);
    } else {
      dom_utils_1.setDisplaying_s(box_);
      adjust_type > 1 && exports.adjustUI();
      port_1.post_({
        H: 15
 /* kFgReq.css */      });
    }
  };
  exports.getBoxTagName_old_cr = 0;
  const addElementList = (array, offset, onTop) => {
    const kMaxSlice = 2048, needToSlice = array.length > kMaxSlice;
    const useDialog = dom_utils_1.MayWoPopover ? onTop && (onTop === 4 || dom_utils_1.withoutPopover_()) : onTop === 4;
    const parent = dom_utils_1.createElement_(useDialog ? "dialog" : "div");
    const style = parent.style;
    const cls = "R HM" + utils_1.fgCache.d, zoom = (rect_1.WithOldZoom ? rect_1.bZoom_ : 1) / (onTop ? rect_1.docZoomNew_ : rect_1.dScale_);
    let innerBox = parent;
    let i = 0;
    dom_utils_1.setClassName_s(parent, useDialog ? cls + " DLG" : cls);
    for (;i < array.length; i += kMaxSlice) {
      var slice = (needToSlice ? array.slice(i, i + kMaxSlice) : array).map(el => el.m);
      innerBox.append(...slice);
    }
    useDialog ? exports.ourDialogEl_ = ourDialogEl_ = parent : onTop && (exports.usePopover_ = usePopover_ |= onTop & 5);
    offset = onTop ? "00" : offset;
    const left = offset[0] + "px", top = offset[1] + "px";
    style.left = left;
    style.top = top;
    zoom - 1 && (style.zoom = zoom);
    dom_utils_1.fullscreenEl_unsafe_() && (style.position = "fixed");
    exports.addUIElement(parent, 1 /* AdjustType.DEFAULT */ , lastFlashEl);
    return parent;
  };
  exports.addElementList = addElementList;
  const adjustUI = event => {
    // Before Firefox 64, the mozFullscreenChangeEvent.target is document
    // so here should only use `fullscreenEl_unsafe_`
    const el = dom_utils_1.fullscreenEl_unsafe_(), disableUI = event === 2, moveBefore = utils_1.chromeVer_ > 124 && dom_utils_1.IsAInB_(box_) && dom_utils_1.ElementProto_not_ff.moveBefore, 
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element
    isReplacedEl = el && utils_1.createRegExp(116 /* kTip.ReplacedHtmlTags */ , "").test(dom_utils_1.htmlTag_(el)), el2 = !el || isReplacedEl || root_.contains(el) || dom_utils_1.contains_s(box_, el) ? dom_utils_1.docEl_unsafe_() : el;
    // Chrome also always remove node from its parent since 58 (just like Firefox), which meets the specification
    // doc: https://dom.spec.whatwg.org/#dom-node-appendchild
        disableUI ? dom_utils_1.removeEl_s(box_) : el2 === dom_utils_1.parentNode_unsafe_s(box_) && (!box_.nextElementSibling || !moveBefore && (omni_1.omni_box && omni_1.omni_status > 0 /* OmniStatus.Inactive */ || ourDialogEl_)) || (moveBefore ? moveBefore.call(el2, box_, null) : (0, 
    dom_utils_1.append_not_ff)(el2, box_));
    const sin = styleIn_, s = sin && sin.sheet;
    s && (s.disabled = false);
    if (disableUI) {} else if (usePopover_ || isReplacedEl && (!dom_utils_1.MayWoPopover || !dom_utils_1.withoutPopover_())) {
      // refresh to ensure it's topmost;
      uiParent_.popover = "manual";
      dom_utils_1.setClassName_s(uiParent_, "PO");
      uiParent_.togglePopover(false);
      uiParent_.showPopover();
    } else if (uiParent_.popover) {
      uiParent_.popover = null;
      dom_utils_1.setClassName_s(uiParent_, "");
    } else if (ourDialogEl_) {
      // if box_ has been re-added, then `.open` is true and `.showModal()` throws without a `.close()`
      ourDialogEl_.open && ourDialogEl_.close();
      ourDialogEl_.showModal();
    }
    if (el || event) {
      const removeEL = !el || disableUI, FS = "fullscreenchange";
      utils_1.setupEventListener(0, "webkit" +  FS, exports.adjustUI, removeEL);
      utils_1.chromeVer_ > 60 && utils_1.setupEventListener(0,  FS, exports.adjustUI, removeEL);
      link_hints_1.isHintsActive && removeEL && (// not need to check isAlive_
      link_hints_1.hintManager || link_hints_1.reinitLinkHintsIn(50 /* GlobalConsts.MinCancelableInBackupTimer */));
    }
  };
  exports.adjustUI = adjustUI;
  const ensureBorder = () => {
    const dPR = rect_1.WithOldZoom ? utils_1.max_(rect_1.wndSize_(2), 1) : 1;
    const zoom = rect_1.WithOldZoom ? rect_1.wdZoom_ / rect_1.dScale_ * dPR : rect_1.wndSize_(2) / rect_1.dScale_;
    if (!cssPatch_ && (!(zoom >= 1) || zoom < 2)) {
      return;
    }
    let width = zoom >= 2 && zoom <= 4 ? 1 : zoom < 2 ? .01 : ("" + (zoom > 4 ? 4 : .51) / zoom).slice(0, 5);
    cssPatch_ || (cssPatch_ = [ 0, css => css.replace(utils_1.createRegExp(98 /* kTip.css0d01OrDPI */ , "g"), "/*!DPI*/" + cssPatch_[0]) ]);
    if (cssPatch_[0] === width) {
      return;
    }
    cssPatch_[0] = width;
    utils_1.vApi.l(styleIn_, 1);
  };
  exports.ensureBorder = ensureBorder;
  const createStyle = (text, css) => {
    css = css || dom_utils_1.createElement_("style");
    dom_utils_1.textContent_s(css, text);
    return css;
  };
  exports.createStyle = createStyle;
  let setUICSS = innerCSS => {
    exports.style_ui = styleIn_ = innerCSS;
  };
  exports.setUICSS = setUICSS;
  const learnCSS = (srcStyleIn, force) => {
    if (!styleIn_ || force) {
      const css = srcStyleIn && (utils_1.isTY(srcStyleIn) ? srcStyleIn : dom_utils_1.textContent_s(srcStyleIn));
      css && exports.setUICSS(css);
    }
  };
  exports.learnCSS = learnCSS;
  const checkDocSelectable = () => {
    let st, sout = mode_find_1.styleSelectable, gcs = dom_utils_1.getComputedStyle_, mayTrue = !sout || !dom_utils_1.parentNode_unsafe_s(sout);
    if (mayTrue && (sout = utils_1.doc.body)) {
      st = gcs(sout);
      mayTrue = st.userSelect !== dom_utils_1.NONE;
    }
    dom_utils_1.set_docSelectable_(mayTrue && (st = gcs(dom_utils_1.docEl_unsafe_()), 
    st.userSelect) !== dom_utils_1.NONE);
  };
  exports.checkDocSelectable = checkDocSelectable;
  const hasGetSelection = node => utils_1.isTY(node.getSelection, 2 /* kTY.func */);
  exports.hasGetSelection = hasGetSelection;
  const getSelectionOf = node => node.getSelection();
  exports.getSelectionOf = getSelectionOf;
  const getSelected = notExpectCount => {
    let el, sel;
    let sr2, sr = null;
    if (el = dom_utils_1.derefInDoc_(scroller_1.currentScrolling)) {
      el = dom_utils_1.getRootNode_mounted(el);
      if (el !== utils_1.doc && dom_utils_1.isNode_(el, 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) && exports.hasGetSelection(el)) {
        sel = exports.getSelectionOf(el);
        sel && (notExpectCount || dom_utils_1.rangeCount_(sel)) && (sr = el);
      }
    }
    sel = sr ? sel : dom_utils_1.getSelection_();
    let sel2 = sel;
    while (sel2) {
      el = dom_utils_1.singleSelectionElement_unsafe(sel);
      sel2 = el && (sr2 = dom_utils_1.TryGetShadowRoot_(el)) && exports.getSelectionOf(sr2);
      sel2 && (sr = sr2, sel = sel2);
    }
    notExpectCount && (notExpectCount.r = sr);
    return sel;
  };
  exports.getSelected = getSelected;
  /** return HTMLElement if there's only Firefox */  exports.getSelectionParent_unsafe = (sel, re) => {
    let text, selected, match, range = rect_1.selRange_(sel), result = 0, par = range && range.commonAncestorContainer, lastPar = par;
    while (par && !dom_utils_1.isNode_(par, 1 /* kNode.ELEMENT_NODE */)) {
      par = dom_utils_1.parentNode_unsafe_s(par);
    }
    // now par is Element or null, and may be a <form> / <frameset>
        if (re && par && range && !range.collapsed && (selected = range + "")) {
      if (dom_utils_1.isNode_(lastPar, 3 /* kNode.TEXT_NODE */) && lastPar.data.trim().length <= selected.length) {
        while (par && (text = par.innerText, utils_1.isTY(text)) && selected.length >= text.length) {
          par = dom_utils_1.GetParent_unsafe_(lastPar = par, 1 /* PNType.DirectElement */);
        }
      }
      const left = range.cloneRange(), right = range.cloneRange();
      left.collapse(true), right.collapse(false);
      left.setStart(par || lastPar, 0), right.setEndAfter(par || lastPar);
      const prefix = left + "", wanted = prefix.length, total = prefix + selected + right;
      result = 1;
      for (re.lastIndex = 0; (match = re.exec(total)) && (result = match.index - wanted) < 0; ) {}
    }
    return result ? 0 : par !== dom_utils_1.docEl_unsafe_() ? par : null;
  };
  const getSelectionBoundingBox_ = (sel, ensured, range0) => {
    const range = range0 || rect_1.selRange_(sel || exports.getSelected(), ensured), bcr = range && range.getBoundingClientRect(), rect = bcr && rect_1.padClientRect_(bcr, range0 ? 1 : 3);
    return rect && rect.b > rect.t ? rect : null;
  };
  exports.getSelectionBoundingBox_ = getSelectionBoundingBox_;
  /** `type`: 0 means to trim; always check focused `<input>` on Firefox and blurred inputs on Chrome */  const getSelectionText = (type, sel) => {
    sel = sel || dom_utils_1.getSelection_();
    let node, s = "" + sel;
    s && !insert_1.insert_Lock_() && (node = dom_utils_1.singleSelectionElement_unsafe(sel)) && dom_utils_1.getEditableType_(node) > 3 /* EditableType.MaxNotTextBox */ && !exports.getSelectionBoundingBox_(sel, 1) && (s = "");
    return type ? s : s.trim();
  };
  exports.getSelectionText = getSelectionText;
  const doesSelectRightInEditableLock = () => insert_1.raw_insert_lock.selectionDirection !== dom_utils_1.kDir[0];
  exports.doesSelectRightInEditableLock = doesSelectRightInEditableLock;
  const maySelectRight_ = sel => insert_1.insert_Lock_() && dom_utils_1.getEditableType_(insert_1.raw_insert_lock) > 3 /* EditableType.MaxNotTextBox */ ? exports.doesSelectRightInEditableLock() : !!dom_utils_1.getDirectionOfNormalSelection(sel, dom_utils_1.getAccessibleSelectedNode(sel), dom_utils_1.getAccessibleSelectedNode(sel, 1));
  exports.maySelectRight_ = maySelectRight_;
  exports.removeSelection = root => {
    const sel = root ? exports.getSelectionOf(root) : dom_utils_1.getSelection_();
    const ret = sel && rect_1.isSelARange(sel) && dom_utils_1.getAccessibleSelectedNode(sel);
    ret && exports.collpaseSelection(sel);
    return !!ret;
  };
  const resetSelectionToDocStart = (sel, range) => {
    (sel || dom_utils_1.getSelection_()).removeAllRanges();
    range && sel.addRange(range);
  };
  exports.resetSelectionToDocStart = resetSelectionToDocStart;
  const selectAllOfNode = node => {
    dom_utils_1.getSelection_().selectAllChildren(node);
  };
  exports.selectAllOfNode = selectAllOfNode;
  const selectNode_ = element => {
    if (dom_utils_1.getEditableType_(element) > 2 /* EditableType.MaxNotEditableElement */) {
      element.select();
    } else {
      const range = utils_1.doc.createRange();
      range.selectNode(element);
      exports.resetSelectionToDocStart(dom_utils_1.getSelection_(), range);
    }
  };
  exports.selectNode_ = selectNode_;
  const moveSel_s_throwable = (element, action) => {
    let type = dom_utils_1.getEditableType_(element);
    const isBox = type === 4 /* EditableType.TextArea */ || type === 3 /* EditableType.ContentEditable */ && dom_utils_1.textContent_s(element).includes("\n"), gotoStart = action === "start", gotoEnd = !action || action === "end" || isBox && (action + "")[3] === "-";
    let doesCollpase = gotoEnd || gotoStart;
    let str, len;
    if (!type) {
      return;
    }
    if (isBox && gotoEnd && rect_1.dimSize_(element, 3 /* kDim.elClientH */) + 12 < rect_1.dimSize_(element, 5 /* kDim.scrollH */)) {
      return;
    }
    // not need `this.getSelection_()`
        if (type === 3 /* EditableType.ContentEditable */) {
      action && doesCollpase || !dom_utils_1.contains_s(element, dom_utils_1.getAccessibleSelectedNode(exports.getSelected()) || utils_1.doc) ? exports.selectAllOfNode(element) : doesCollpase = 0;
    } else {
      len = element.value.length;
      const start = dom_utils_1.textOffset_(element), end = dom_utils_1.textOffset_(element, 1);
      !len || start == null || start && start < len || end && end < len || (gotoEnd ? start : gotoStart ? !end : !start && end) || !action && end ? doesCollpase = 0 : element.select();
    }
    doesCollpase && exports.collpaseSelection(dom_utils_1.getSelection_(), gotoEnd);
    (dom_utils_1.getEditableType_(element) === 5 /* EditableType.Input */ ? !len && (str = element.autocomplete) && str !== "off" || element.list : // in case it change .type
    dom_utils_1.hasTag_("input", element) && dom_utils_1.uneditableInputs_[element.type] === 4) && async_dispatcher_1.showPicker_(element, 5 /* EditableType.Input */);
  };
  exports.moveSel_s_throwable = moveSel_s_throwable;
  const collpaseSelection = (sel, toEnd, fix_input) => {
    if (fix_input && insert_1.raw_insert_lock && dom_utils_1.getEditableType_(insert_1.raw_insert_lock) > 3 /* EditableType.MaxNotTextBox */) {
      fix_input = dom_utils_1.textOffset_(insert_1.raw_insert_lock, toEnd);
      dom_utils_1.inputSelRange(insert_1.raw_insert_lock, fix_input, fix_input, 1 /* VisualModeNS.kDir.right */);
    } else {
      toEnd ? sel.collapseToEnd() : sel.collapseToStart();
    }
  };
  exports.collpaseSelection = collpaseSelection;
  const getRect = (clickEl, refer) => {
    const tag = dom_utils_1.htmlTag_(clickEl);
    if (refer) {
      return rect_1.getClientRectsForAreas_(refer, [], [ clickEl ]);
    }
    if (tag === "a") {
      const preferred = local_links_1.getPreferredRectOfAnchor(clickEl);
      if (preferred) {
        return preferred;
      }
    } else if (tag === "input") {
      return rect_1.getVisibleBoundingRect_(clickEl, 1);
    }
    const rect = rect_1.getVisibleClientRect_(clickEl), bcr = rect_1.padClientRect_(rect_1.getBoundingClientRect_(clickEl), 3), rect2 = rect && !rect_1.isContaining_(bcr, rect) ? rect : rect_1.cropRectS_(bcr) ? bcr : null;
    return rect2 && rect_1.getCroppedRect_(clickEl, rect2);
  };
  exports.getRect = getRect;
  exports.flash_ = (el, rect, lifeTime, classNames, knownViewOffset) => {
    rect || (rect_1.getZoom_(el), rect_1.prepareCrop_(), rect = exports.getRect(el));
    if (!rect) {
      return;
    }
    const flashEl = dom_utils_1.createElement_("div"), nfs = knownViewOffset ? 2 : +!dom_utils_1.fullscreenEl_unsafe_();
    dom_utils_1.setClassName_s(flashEl, "R Flash" + (classNames || "") + (rect_1.setBoundary_(flashEl.style, rect, nfs, knownViewOffset, 8) ? " AbsF" : ""));
    rect_1.WithOldZoom && rect_1.bZoom_ !== 1 && nfs && (flashEl.style.zoom = "" + rect_1.bZoom_);
    exports.addUIElement(flashEl, 1 /* AdjustType.DEFAULT */);
    exports.lastFlashEl = lastFlashEl = flashEl;
    const remove = () => {
      lastFlashEl === flashEl && (exports.lastFlashEl = lastFlashEl = null);
      dom_utils_1.removeEl_s(flashEl);
    };
    // link_actions.ts requires `flash_(, , -1)`
        lifeTime < 0 || utils_1.timeout_(remove, (lifeTime || 400 /* GlobalConsts.DefaultRectFlashTime */) * (+utils_1.fgCache.m + 1));
    return remove;
  };
  /** key: 1 := help dialog; 2 := vomnibar; -1: remove for help dialog; -2: remove for vomnibar */  const setupExitOnClick = key => {
    key = key & 8 /* kExitOnClick.REMOVE */ ? toExitOnClick_ & ~key : toExitOnClick_ | key;
    if (key !== toExitOnClick_) {
      exports.toExitOnClick_ = toExitOnClick_ = key;
      key_handler_1.resetAnyClickHandler_cr(key_handler_1.isWaitingAccessKey);
    }
  };
  exports.setupExitOnClick = setupExitOnClick;
  const doExitOnClick_ = event => {
    if (event && (// simulated events generated by page code
    !event.isTrusted || !event.detail && !event.clientY || !dom_utils_1.parentNode_unsafe_s(box_) || event.target === box_ && (!dom_utils_1.MayWoPopover || !omni_1.omni_dialog_wo_pop_ || omni_1.omni_status != 3 /* OmniStatus.Showing */ || root_.activeElement))) {
      return;
    }
    event && keyboard_utils_1.prevent_(event);
    toExitOnClick_ & 1 /* kExitOnClick.helpDialog */ && hideHelp();
    toExitOnClick_ & 2 /* kExitOnClick.vomnibar */ && omni_1.hide();
  };
  exports.doExitOnClick_ = doExitOnClick_;
  const focusIframeContentWnd_ = (iframe, res) => {
    if (res) {
      return;
    }
    iframe === omni_1.omni_box && res !== 0 ? omni_1.omni_status < 3 /* OmniStatus.Showing */ || omni_1.postToOmni(2 /* VomnibarNS.kCReq.focus */) : iframe.contentWindow.focus();
  };
  exports.focusIframeContentWnd_ = focusIframeContentWnd_;
  /** must be called only if having known anotherWindow is "in a same origin" */  exports.getWndVApi_ff = 0;
  function set_getWndVApi_ff(_newGetWndVApi) {
    exports.getWndVApi_ff = _newGetWndVApi;
  }
  exports.set_getWndVApi_ff = set_getWndVApi_ff;
  /**
     * Return a valid `ContentWindowCore`
     * only if is a child which in fact has a same origin with its parent frame (ignore `document.domain`).
     *
     * So even if it returns a valid object, `parent.***` may still be blocked
     */  exports.getParentVApi = () => dom_utils_1.frameElement_() && parent.VApi;
  function set_getParentVApi(_newGetParVApi) {
    exports.getParentVApi = _newGetParVApi;
  }
  exports.set_getParentVApi = set_getParentVApi;
  const evalIfOK = req => {
    const url = utils_1.isTY(req) ? req : req.u;
    if (!utils_1.isJSUrl(url)) {
      return false;
    }
    let str = url.slice(11).trim();
    let el;
    if (utils_1.createRegExp(100 /* kTip.voidJS */ , "").test(str)) {} else if (utils_1.isAsContent && dom_utils_1.parentNode_unsafe_s(el = dom_utils_1.runJS_(utils_1.VTr(89 /* kTip.removeEventScript */), 0))) {
      dom_utils_1.removeEl_s(el);
      port_1.post_({
        H: 27 /* kFgReq.evalJSFallback */ ,
        u: url
      });
    } else {
      str = utils_1.safeCall(decodeURIComponent, str) || str;
      utils_1.timeout_(() => {
        utils_1.vApi.v(str);
        utils_1.isTY(req) || req.f && port_1.runFallbackKey(req.f, 0);
      }, 0);
    }
    return true;
  };
  exports.evalIfOK = evalIfOK;
  exports.checkHidden = (cmd, options, count) => {
    if (utils_1.isTop) {
      return 0;
    }
    // here should not use the cache frameElement, because `getComputedStyle(frameElement).***` might break
        const curFrameElement = dom_utils_1.frameElement_(), el = curFrameElement || dom_utils_1.docEl_unsafe_();
    let box, parEvents, defaultToPar = utils_1.isIFrameInAbout_ && cmd === 18 /* kFgCmd.framesGoBack */ , 
    // use client{Width,Height} in case an <iframe> has border (e.g.: is blocked so its CSS is never added)
    result = defaultToPar || rect_1.dimSize_(curFrameElement, 3 /* kDim.elClientH */) < 4 || rect_1.dimSize_(curFrameElement, 2 /* kDim.elClientW */) < 4 || !!el && !dom_utils_1.isStyleVisible_(el);
    if (cmd) {
      // if in a forced cross-origin env (by setting doc.domain),
      // then par.self.innerHeight works, but this behavior is undocumented,
      // so here only use `parApi.innerHeight_()` in case
      if (curFrameElement && (result || (box = rect_1.boundingRect_(curFrameElement)).b <= 0 || box.t > parent.innerHeight)) {
        parEvents = exports.getParentVApi();
        if (parEvents && !parEvents.a(utils_1.keydownEvents_)) {
          parEvents.f(cmd, options, count, +!defaultToPar);
          result = 1;
        }
      }
      result === true && (// if there's a same-origin parent, use it instead of top
      // here not suppress current cmd, in case of malformed pages;
      // the worst result is doing something in a hidden frame,
      options.$forced ? result = 0 : port_1.post_({
        H: 28 /* kFgReq.gotoMainFrame */ ,
        f: 1,
        c: cmd,
        n: count,
        a: options
      }));
    }
    return +result;
  };
  const filterOutInert = hints => {
    let i = dom_utils_1.isHTML_() ? hints.length : 0;
    while (0 <= --i) {
      dom_utils_1.isInert_(hints[i][0]) && hints.splice(i, 1);
    }
  };
  exports.filterOutInert = filterOutInert;
  const onToggle = event => {
    const newState = event.newState, target = event.target;
    if (event.isTrusted && dom_utils_1.isNode_(target, 1 /* kNode.ELEMENT_NODE */) && !dom_utils_1.hasTag_("details", target)) {
      exports.usePopover_ = usePopover_ = utils_1.max_(usePopover_ & 7, usePopover_ + (newState > "o" ? 8 : -8));
      root_ && usePopover_ && exports.adjustUI();
    }
  };
  exports.onToggle = onToggle;
});
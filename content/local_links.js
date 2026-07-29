"use strict";
__filename = "content/local_links.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "../lib/rect", "./mode_find", "./omni", "./link_hints", "./scroller", "./dom_ui", "./hint_filters" ], (require, exports, utils_1, dom_utils_1, rect_1, mode_find_1, omni_1, link_hints_1, scroller_1, dom_ui_1, hint_filters_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.checkNestedFrame = exports.initTestRegExps = exports.getVisibleElements = exports.filterOutNonReachable = exports.excludeHints = exports.traverse = exports.getEditable = exports.getPreferredRectOfAnchor = exports.set_frameNested_ = exports.localLinkClear = exports.extraClickable_ = exports.closableClasses_ = exports.maxRight_ = exports.maxTop_ = exports.maxLeft_ = exports.ngEnabled_ = exports.frameNested_ = void 0;
  let frameNested_ = false;
  exports.frameNested_ = frameNested_;
  let extraClickable_ = null;
  exports.extraClickable_ = extraClickable_;
  // let withClickableAttrs_: BareElementSet | null
    let clickTypeFilter_ = 0;
  let ngEnabled_ = 2;
  exports.ngEnabled_ = ngEnabled_;
  let jsaEnabled_ = 0;
  let maxLeft_ = 0;
  exports.maxLeft_ = maxLeft_;
  let maxTop_ = 0;
  exports.maxTop_ = maxTop_;
  let maxRight_ = 0;
  exports.maxRight_ = maxRight_;
  let clickableClasses_;
  let closableClasses_;
  exports.closableClasses_ = closableClasses_;
  let clickableRoles_;
  let buttonOrATags_;
  const localLinkClear = () => exports.maxLeft_ = maxLeft_ = exports.maxTop_ = maxTop_ = exports.maxRight_ = maxRight_ = 0;
  exports.localLinkClear = localLinkClear;
  function set_frameNested_(_newNestedFrame) {
    exports.frameNested_ = frameNested_ = _newNestedFrame;
  }
  exports.set_frameNested_ = set_frameNested_;
  /**
     * Must ensure only call {@link scroller.ts#VSc.shouldScroll_s_} during {@link #getVisibleElements_}
     */  const getClickable = (hints, element) => {
    let arr, s, anotherEl, isClickable = null, type = 0 /* ClickType.Default */ , clientSize = 0;
    const tag = element.localName;
    switch (tag) {
     case "a":
      arr = rect_1.getVisibleClientRect_(element, null);
      arr = arr && exports.getPreferredRectOfAnchor(element) || arr;
      isClickable = !!arr;
      break;

     case "audio":
     case "video":
      isClickable = true;
      break;

     case "frame":
     case "iframe":
      if (isClickable = element !== mode_find_1.find_box) {
        arr = rect_1.getIFrameRect(element);
        if (element !== omni_1.omni_box) {
          isClickable = link_hints_1.addChildFrame_ && dom_utils_1.isIFrameElement(element) ? link_hints_1.addChildFrame_(link_hints_1.coreHints, element, arr) : !!arr;
                    detectCloseBtn(element);
        } else if (arr) {
          arr.l += 12;
          arr.t += 9;
        }
      }
      type = 7 /* ClickType.frame */;
      break;

     case "input":
     case "textarea":
      // on C75, a <textarea disabled> is still focusable
      if (element.disabled && link_hints_1.mode1_ < 34) {} else if (tag > "t" || !dom_utils_1.uneditableInputs_[s = element.type]) {
        isClickable = (!element.readOnly || link_hints_1.mode1_ > 31) && (link_hints_1.mode1_ < 38 /* HintMode.min_string */ || link_hints_1.mode1_ > 43 /* HintMode.max_string */ || extraClickable_ && extraClickable_.has(element) || !!hint_filters_1.generateHintText([ element ]).t);
      } else if (s !== "hidden") {
        const st = dom_utils_1.getComputedStyle_(element);
        isClickable = st.opacity > 0;
        if (isClickable || st.zIndex > 0 || !element.labels.length) {
          arr = rect_1.getVisibleBoundingRect_(element, +!isClickable, st);
          isClickable = !!arr;
        }
      }
      type = 1 /* ClickType.edit */;
      break;

     case "details":
      isClickable = isNotReplacedBy(dom_utils_1.queryHTMLChild_(element, "summary"), hints);
      break;

     case "dialog":
      element.open && element !== dom_ui_1.ourDialogEl_ && (link_hints_1.coreHints.d = 3);
      isClickable = false;
      break;

     case "label":
      isClickable = isNotReplacedBy(element.control);
      break;

     case "button":
     case "select":
      isClickable = !element.disabled || link_hints_1.mode1_ > 33 /* HintMode.max_mouse_events */;
      break;

     case "object":
     case "embed":
      s = element.type;
      isClickable = !!s && s.endsWith("x-shockwave-flash");
      !isClickable && tag > "o" && element.useMap && rect_1.getClientRectsForAreas_(element, hints);
      break;

     case "img":
      element.useMap && rect_1.getClientRectsForAreas_(element, hints);
      (!link_hints_1.forHover_ || (anotherEl = element.parentElement) && dom_utils_1.hasTag_("a", anotherEl)) && !((s = element.style.cursor) ? s !== "default" : (s = dom_utils_1.getComputedStyle_(element).cursor) && (s.includes("zoom") || s.startsWith("url"))) || (isClickable = true);
      break;

     case "code":
     case "pre":
      link_hints_1.mode1_ > 33 /* HintMode.max_mouse_events */ && (tag < "p" || dom_utils_1.getComputedStyle_(element).display === "block") && (!(anotherEl = dom_utils_1.GetParent_unsafe_(element, 1 /* PNType.DirectElement */)) || !hints.length || hints[hints.length - 1][0] !== anotherEl || !dom_utils_1.hasTag_("pre", anotherEl) && !dom_utils_1.hasTag_("code", anotherEl)) && (isClickable = true);

      // no break
           case "aside":
     case "div":
     case "nav":
     case "ol":
     case "table":
     case "tbody":
     case "ul":
      clientSize = 1;
      break;
    }
    if (isClickable === null) {
      type = (s = element.contentEditable) !== "inherit" && s !== "false" ? 1 /* ClickType.edit */ : element.getAttribute("onclick") || (s = element.role) && clickableRoles_.test(s) && (!s.startsWith("menu") || !dom_utils_1.queryHTMLChild_(element, "ul") || isNotReplacedBy(dom_utils_1.queryHTMLChild_(element, "div"), hints)) || extraClickable_ !== null && extraClickable_.has(element) || ngEnabled_ === 1 && dom_utils_1.attr_s(element, "ng-click") || element.getAttribute("onmousedown") || link_hints_1.forHover_ === 1 && dom_utils_1.attr_s(element, "onmouseover") || jsaEnabled_ === 1 && (s = dom_utils_1.attr_s(element, "jsaction")) && checkJSAction(s) ? 2 /* ClickType.attrListener */ : utils_1.clickable_.has(element) && link_hints_1.isClickListened_ &&  inferTypeOfListener(element, tag) ? 3 /* ClickType.codeListener */ : (s = element.getAttribute("tabindex")) && parseInt(s, 10) >= 0 && !dom_utils_1.GetShadowRoot_(element, 1) && element !== dom_ui_1.helpBox ? 5 /* ClickType.tabindex */ : clientSize !== 0 && (clientSize = element.clientHeight) > 49 && clientSize + 5 < element.scrollHeight ? 9 /* ClickType.scrollY */ : clientSize > /* scrollbar:12 + font:9 */ 20 && (clientSize = element.clientWidth) > 49 && clientSize + 5 < element.scrollWidth ? 8 /* ClickType.scrollX */ : ((s = element.className) && clickableClasses_.test(s) ? type = 4 /* ClickType.classname */ : tag === "li") && (!(anotherEl = element.parentElement) || (type ? (s = dom_utils_1.htmlTag_(anotherEl), 
      !s.includes("button") && s !== "a") : utils_1.clickable_.has(anotherEl) && dom_utils_1.hasTag_("ul", anotherEl) && !s.includes("active"))) || element.ariaSelected !== null || element.getAttribute("data-tab") ? 4 /* ClickType.classname */ : 0 /* ClickType.Default */;
      isClickable = type > 0 /* ClickType.Default */;
    }
    isClickable === true && (arr = tag === "img" ? rect_1.getVisibleBoundingRect_(element, 1) : arr || rect_1.getVisibleClientRect_(element, null)) !== null && (dom_utils_1.isAriaFalse_(element, 0 /* kAria.hidden */) || extraClickable_ && extraClickable_.has(element)) && (link_hints_1.mode1_ > 31 || dom_utils_1.isAriaFalse_(element, 1 /* kAria.disabled */)) && (type < 3 /* ClickType.codeListener */ || type > 4 /* ClickType.classname */ || !(s = element.getAttribute("unselectable")) || s.toLowerCase() !== "on") && (0 === clickTypeFilter_ || clickTypeFilter_ & 1 << type) && hints.push([ element, arr, type ]);
  };
  const checkJSAction = str => {
    for (let jsaStr of str.split(";")) {
      jsaStr = jsaStr.trim();
      jsaStr = jsaStr.startsWith("click:") ? jsaStr.slice(6) : jsaStr && !jsaStr.includes(":") ? jsaStr : dom_utils_1.NONE;
      if (jsaStr !== dom_utils_1.NONE && !/\._\b(?![\$\.])/.test(jsaStr)) {
        return true;
      }
    }
    return false;
  };
  /** Note: should be as pure as possible */  const getPreferredRectOfAnchor = anchor => {
    // for Google search result pages
    let mayBeSearchResult = !!(anchor.rel || dom_utils_1.attr_s(anchor, "onmousedown") || (dom_utils_1.attr_s(anchor, "href") || "").startsWith("/url?") || anchor.ping || anchor.dataset.jsarwt), // on MS Edge 97
    el = mayBeSearchResult && dom_utils_1.querySelector_unsafe_("h3,h4", anchor) || (mayBeSearchResult || anchor.childElementCount === 1) && anchor.firstElementChild || null, tag = el && dom_utils_1.htmlTag_(el);
    return el && (mayBeSearchResult ? /^h\d$/.test(tag) && isNotReplacedBy(el) ? rect_1.getVisibleClientRect_(el) : null : tag !== "img" || rect_1.dimSize_(anchor, 3 /* kDim.elClientH */) ? null : rect_1.getVisibleBoundingRect_(el, 1));
  };
  exports.getPreferredRectOfAnchor = getPreferredRectOfAnchor;
  const isNotReplacedBy = (element, isExpected) => {
    const arr2 = [], clickListened = link_hints_1.isClickListened_;
    if (element) {
      if (!isExpected && element.disabled) {
        return false;
      }
      isExpected && (utils_1.clickable_.add(element), link_hints_1.set_isClickListened_(true));
      getClickable(arr2, element);
      link_hints_1.set_isClickListened_(clickListened);
      if (!clickListened && isExpected && arr2.length && arr2[0][2] === 3 /* ClickType.codeListener */) {
        getClickable(arr2, element);
        (arr2.length < 2 || arr2[1][2] > 6 /* ClickType.MaxNotBox */) && // note: excluded during normal logic
        isExpected.push(arr2[0]);
      }
    }
    return element ? !arr2.length : !!isExpected || null;
  };
  const inferTypeOfListener = (el, tag) => {
    // Note: should avoid nested calling to isNotReplacedBy_
    let el2, D = "div";
    return tag !== D && tag !== "li" ? tag === "tr" ? ((el2 = el.firstElementChild) && dom_utils_1.hasTag_("td", el2) && (el2 = dom_utils_1.queryHTMLChild_(el2, "input")), 
    !(!el2 || dom_utils_1.uneditableInputs_[el2.type] !== 3 || !isNotReplacedBy(el2))) : tag !== "table" : !(el2 = el.firstElementChild) || !((tag = dom_utils_1.htmlTag_(el2), 
    !el.className && !el.id && el.localName === D || tag === D || tag === "span") && utils_1.clickable_.has(el2) && el2.getClientRects().length || (tag !== D || (el2 = el2.firstElementChild, 
    tag = el2 ? dom_utils_1.htmlTag_(el2) : "")) && /^h\d$/.test(tag) && (el2 = el2.firstElementChild) && dom_utils_1.hasTag_("a", el2));
  };
  const detectCloseBtn = element => {
    const next = element.nextElementSibling;
    next && dom_utils_1.isSafeEl_(next) && next.textContent === "x" && utils_1.clickable_.add(next);
  };
  const getEditable = (hints, element) => {
    let s = element.localName, asClickable = extraClickable_ && extraClickable_.has(element);
    (s === dom_utils_1.INP || s === "textarea" ? !(s < "t" && dom_utils_1.uneditableInputs_[element.type] || element.disabled || element.readOnly) || asClickable : dom_utils_1.isSafeEl_(element) && ((s = element.contentEditable) !== "inherit" && s !== "false" || asClickable)) && getIfOnlyVisible(hints, element);
  };
  exports.getEditable = getEditable;
  const getIfOnlyVisible = (hints, element) => {
    const arr = rect_1.getVisibleClientRect_(element, null);
    arr && hints.push([ element, dom_utils_1.hasTag_("a", element) && exports.getPreferredRectOfAnchor(element) || arr, 0 /* ClickType.Default */ ]);
  };
  exports.traverse = (selector, options, filter, notWantVUI, wholeDoc, acceptNonHTML) => {
    const matchSafeElements = (selector1, rootNode, udSelector, mayBeUnsafe) => {
      let list = udSelector !== " " ? dom_utils_1.querySelectorAll_unsafe_(udSelector || selector1, rootNode, mayBeUnsafe) : [];
      return udSelector ? list && [].filter.call(list, dom_utils_1.isSafeEl_) : list;
    };
    const createElementSet = list => {
      let set;
      set = list.length ? new Set(list) : null;
      return set;
    };
    const addExtraVisibleToHints = (hints, element) => {
      for (const hint of hints) {
        if (hint[0] === element) {
          return;
        }
      }
      dom_utils_1.isSafeEl_(element) && getIfOnlyVisible(hints, element);
    };
    const addChildTrees = (parts, allNodes) => {
      const local_addChildFrame_ = link_hints_1.addChildFrame_, hosts = [];
      const localOnFirefox = false;
      for (let i = 0, len = allNodes.length; i < len; i++) {
        let el = allNodes[i];
        (localOnFirefox ? el.openOrClosedShadowRoot : "lang" in el && dom_utils_1.GetShadowRoot_(el, noClosedShadow) !== null && dom_utils_1.isSafeEl_(el)) ? hosts.push(el) : dom_utils_1.isIFrameElement(el) && local_addChildFrame_ && local_addChildFrame_(link_hints_1.coreHints, el, rect_1.getIFrameRect(el));
      }
      if (!hosts.length) {
        return parts;
      }
      parts = [].slice.call(parts);
      const set = new Set(parts);
      return parts.concat(hosts.filter(el => !set.has(el)));
    };
    const isOtherClickable = (hints, element) => {
      const tabIndex = element.tabIndex, tag = element.localName;
      let arr, s, par, hasTabIdx;
      let type = utils_1.clickable_.has(element) || extraClickable_ !== null && extraClickable_.has(element) || (hasTabIdx = tabIndex !== void 0) && (dom_utils_1.attr_s(element, "onclick") || dom_utils_1.attr_s(element, "onmousedown")) || link_hints_1.mode1_ > 37 && link_hints_1.mode1_ < 44 && tag.endsWith("text") || (s = element.role) && clickableRoles_.test(s) || ngEnabled_ === 1 && dom_utils_1.attr_s(element, "ng-click") || jsaEnabled_ === 1 && (s = dom_utils_1.attr_s(element, "jsaction")) && checkJSAction(s) ? 2 /* ClickType.attrListener */ : hasTabIdx && tabIndex >= 0 ? tag === "a" ? 2 /* ClickType.attrListener */ : 5 /* ClickType.tabindex */ : !(((s = dom_utils_1.attr_s(element, "class")) && clickableClasses_.test(s) || tag === "svg" && dom_utils_1.getComputedStyle_(element).cursor === "pointer") && (par = dom_utils_1.GetParent_unsafe_(element, 1 /* PNType.DirectElement */)) && dom_utils_1.htmlTag_(par)) || tag === "svg" && dom_utils_1.getComputedStyle_(par).cursor === "pointer" || hints.length && dom_utils_1.contains_s(hints[hints.length - 1][0], element) ? 0 /* ClickType.Default */ : 4 /* ClickType.classname */;
      type !== 0 /* ClickType.Default */ && (link_hints_1.mode1_ < 35 /* HintMode.min_media */ || tag !== "path") && (arr = rect_1.getVisibleClientRect_(element, null)) !== null && (dom_utils_1.isAriaFalse_(element, 0 /* kAria.hidden */) || extraClickable_ && extraClickable_.has(element)) && (link_hints_1.mode1_ > 31 || dom_utils_1.isAriaFalse_(element, 1 /* kAria.disabled */)) && (0 === clickTypeFilter_ || clickTypeFilter_ & 1 << type) && hints.push([ element, arr, type ]);
    };
    const wantClickable = filter === getClickable, localOldBZoom = rect_1.WithOldZoom ? rect_1.bZoom_ : 1, isInAnElement = !!wholeDoc && wholeDoc !== 1 && wholeDoc.tagName != null, traverseRoot = wholeDoc ? isInAnElement && wholeDoc || null : dom_utils_1.fullscreenEl_unsafe_();
    let matchSelector = options.match || null, textFilter = options.textFilter, matchAll = selector === link_hints_1.kSafeAllSelector && !matchSelector, rawClosedShadow_cr = options.closedShadow, noClosedShadow = rawClosedShadow_cr ? 0 : 1, clickableSelector = dom_utils_1.joinValidSelectors(matchAll && dom_utils_1.findSelectorByHost(options.clickable), matchAll && dom_utils_1.findSelectorByHost(options.clickableOnHost) || dom_utils_1.findSelectorByHost(118 /* kTip.DefaultClickableOnHost */)), output = [], cur_arr = matchSafeElements(filter !== exports.getEditable ? selector : (matchAll = false, 
    selector = utils_1.VTr(87 /* kTip.editableSelector */) + (clickableSelector ? "," + clickableSelector : "")), traverseRoot, matchSelector, 1) || (matchSelector = " ", 
    []);
    const docBody_cr = utils_1.doc.body, may_nextToBody_cr = matchAll && noClosedShadow && !wholeDoc && !traverseRoot && localOldBZoom === 1 && rawClosedShadow_cr == null && docBody_cr && dom_utils_1.isSafeEl_(docBody_cr) && docBody_cr.nextElementSibling, nextToBody_cr = may_nextToBody_cr && (may_nextToBody_cr !== dom_ui_1.ui_box || may_nextToBody_cr.nextElementSibling) ? may_nextToBody_cr : null;
    utils_1.set_evenHidden_(options.evenIf | (options.scroll === "force" ? 2 /* kHidden.OverflowHidden */ : 0));
    exports.initTestRegExps();
    if (wantClickable) {
      scroller_1.getPixelScaleToScroll();
      clickTypeFilter_ = options.typeFilter | 0;
    }
    if (matchSelector) {
      wholeDoc || (filter = getIfOnlyVisible);
    } else if (matchAll && ngEnabled_ > 1) {
      exports.ngEnabled_ = ngEnabled_ = dom_utils_1.querySelector_unsafe_(".ng-scope") ? 1 : 0;
      jsaEnabled_ = dom_utils_1.querySelector_unsafe_("[jsaction]") ? 1 : 0;
    }
    cur_arr = !wholeDoc && link_hints_1.tooHigh_ && !traverseRoot && cur_arr.length >= 15e3 /* GlobalConsts.LinkHintPageHeightLimitToCheckViewportFirst */ && matchAll ? (ori_list => {
      const centerPath = utils_1.doc.elementsFromPoint(rect_1.wndSize_(1) / 2, rect_1.wndSize_() / 2);
      const result = [], height = rect_1.wndSize_(), len = ori_list.length;
      let lastChild, j2, i = 1;
      while (i < len) {
        // skip docEl
        const el = ori_list[i++];
        const cr = rect_1.getBoundingClientRect_(el);
        if (cr.bottom > 0 && cr.top < height) {
          result.push(el);
        } else if (lastChild = el.lastElementChild) {
          j2 = centerPath.includes(el) ? 0 : ori_list.indexOf(lastChild, i);
          i = j2 > 0 ? j2 : i;
 // keep the last element, to iter deeply into boxes
                }
      }
      return result.length > 12 ? result : ori_list;
    })([].slice.call(cur_arr)) : cur_arr;
    const kIframes_EdgeOnly = 0;
    cur_arr = matchAll ? cur_arr : addChildTrees(cur_arr, dom_utils_1.querySelectorAll_unsafe_(kIframes_EdgeOnly || link_hints_1.kSafeAllSelector, traverseRoot, 1));
    isInAnElement && !matchSelector && dom_utils_1.isSafeEl_(traverseRoot) && (cur_arr = [].slice.call(cur_arr)).unshift(traverseRoot);
    const checkNonHTML = wantClickable ? matchSelector ? filter : isOtherClickable : acceptNonHTML ? filter : null;
    // const cssClickableAttrs: string = !wantClickable ? "" : `[onclick],[tabindex],[contenteditable],[role]${
        const tree_scopes = [ [ cur_arr, 0, clickableSelector && createElementSet(dom_utils_1.querySelectorAll_unsafe_(clickableSelector, traverseRoot, 1)) ] ];
    let cur_scope, cur_tree, cur_ind;
    for (;cur_scope = tree_scopes.pop(); ) {
      for (cur_tree = cur_scope[0], cur_ind = cur_scope[1], exports.extraClickable_ = extraClickable_ = cur_scope[2]; cur_ind < cur_tree.length; ) {
        const el = cur_tree[cur_ind++];
        if (el === nextToBody_cr) {
          noClosedShadow = 0;
          if (localOldBZoom !== 1 && !traverseRoot) {
            rect_1.set_bZoom_(1);
            rect_1.prepareCrop_(1);
          }
        }
        if ("lang" in el) {
          filter(output, el);
          const shadow = noClosedShadow === 1 ? el.shadowRoot : dom_utils_1.GetShadowRoot_(el, 0);
          if (shadow !== null) {
            if (filter === getIfOnlyVisible) {
              const last = output.pop();
              last === void 0 || last[0] === el && !dom_utils_1.testMatch(matchSelector, last[0]) || output.push(last);
            }
            tree_scopes.push([ cur_tree, cur_ind, extraClickable_ ]);
            cur_tree = matchSafeElements(selector, shadow, matchSelector);
            cur_tree = matchAll ? cur_tree : addChildTrees(cur_tree, dom_utils_1.querySelectorAll_unsafe_(kIframes_EdgeOnly || link_hints_1.kSafeAllSelector, shadow));
            cur_ind = 0;
            exports.extraClickable_ = extraClickable_ = clickableSelector && createElementSet(dom_utils_1.querySelectorAll_unsafe_(clickableSelector, shadow));
          }
        } else {
          checkNonHTML !== null && checkNonHTML(output, el);
        }
      }
      extraClickable_ && !wantClickable && extraClickable_.forEach(addExtraVisibleToHints.bind(0, output));
    }
    cur_scope = exports.extraClickable_ = extraClickable_ = cur_tree = cur_arr = null;
    utils_1.set_evenHidden_(0 /* kHidden.None */);
    while (output.length && (output[0][0] === dom_utils_1.docEl_unsafe_() || !link_hints_1.hintManager && output[0][0] === docBody_cr)) {
      output.shift();
    }
    if (wholeDoc && !isInAnElement) {
      // this requires not detecting scrollable elements if wholeDoc
      (wantClickable || isInAnElement) && console.log("Assert error: `!wantClickable if wholeDoc` in VHints.traverse_");
    } else {
      wantClickable && !matchSelector && (list => {
        const D = "div";
        let k, s, notRemoveParents, i = list.length, j = 0;
        let element, prect, crect, splice = 0;
        let shadowRoot;
        for (;j < i; ) {
          k = list[j][2];
          k > 7 && scroller_1.shouldScroll_s(list[j][0], k - 8 /* ClickType.scrollX */ + (utils_1.evenHidden_ & 2 /* kHidden.OverflowHidden */), 0) < 1 ? (list.splice(j, 1), 
          i--) : j++;
        }
        scroller_1.scrolled === 1 && scroller_1.suppressScroll();
        while (0 <= --i) {
          k = list[i][2];
          notRemoveParents = k === 4 /* ClickType.classname */;
          if ((notRemoveParents || k === 3 /* ClickType.codeListener */) && (shadowRoot = dom_utils_1.TryGetShadowRoot_(list[i][0], 1)) && i + 1 < list.length && list[j = i + 1][0].parentNode === shadowRoot && rect_1.isContaining_(list[i][1], list[j][1]) && dom_utils_1.querySelectorAll_unsafe_(utils_1.VTr(99 /* kTip.visibleElementsInScopeChildren */), shadowRoot).length === 1) {
            notRemoveParents = 0 < ++splice;
          } else if (notRemoveParents) {
            i + 1 < list.length && list[j = i + 1][2] < 2 /* ClickType.MinWeak */ && isDescendant(element = list[j][0], list[i][0], 0) && (list[j][2] > 0 || buttonOrATags_.test(element.localName)) ? ++splice : (j = i - 1, 
            i < 1 || (k = list[j][2]) > 5 /* ClickType.MaxWeak */ || !isDescendant(element = list[i][0], list[j][0], 1) ? k < 6 /* ClickType.MinNotWeak */ && k > 1 /* ClickType.MaxNotWeak */ && i && list[j][0].localName === "ul" && isDescendant(element, list[j][0], 0) && element.localName === "li" && (splice = i--) : (notRemoveParents = k < 2 /* ClickType.MinWeak */) && (splice = +rect_1.isContaining_(list[j][1], list[i][1])));
          } else {
            if (k === 3 /* ClickType.codeListener */) {
              (s = (element = list[i][0]).localName, s === "i" || s === D) && (notRemoveParents = i > 0 && buttonOrATags_.test(list[i - 1][0].localName) ? (s < "i" || !element.firstChild) && isDescendant(element, list[i - 1][0], +(s < "i")) : !!(element = element.parentElement) && dom_utils_1.hasTag_("button", element) && element.disabled) && 
              // icons: button > i; button > div@mousedown; (button[disabled] >) div@mousedown
              ++splice;
              if (s[0] === "h" && /^h\d$/.test(s)) {
                i > 0 && (k = list[i - 1][2]) < 7 && k !== 1 /* ClickType.edit */ && (element = list[i - 1][0]).childElementCount === 1 && dom_utils_1.getComputedStyle_(element).display === "inline" && isDescendant(list[i][0], element, 0) && (splice = i--);
              } else if (s === D && !splice && (j = i + 1) < list.length && (s = list[j][0].localName, 
              s === D || s === "a")) {
                prect = list[i][1];
                crect = list[j][1];
                (notRemoveParents = crect.l < prect.l + 19 && crect.t < prect.t + 9 && crect.l > prect.l - 4 && crect.t > prect.t - 4 && crect.b > prect.b - 9 && (s !== "a" || dom_utils_1.contains_s(element, list[j][0]))) && 
                // the `<a>` is a single-line box's most left element and the first clickable element,
                // so think the box is just a layout container
                // for [i] is `<div>`, not limit the height of parent `<div>`,
                // if there's more content, it should have hints for itself
                ++splice;
              }
            } else if (k === 5 /* ClickType.tabindex */ && (element = list[i][0]).childElementCount === 1 && i + 1 < list.length) {
              element = element.firstElementChild;
              prect = list[i][1];
              crect = dom_utils_1.isSafeEl_(element) ? rect_1.getVisibleClientRect_(element) : null;
              crect && rect_1.isContaining_(crect, prect) && dom_utils_1.htmlTag_(element) && (dom_utils_1.parentNode_unsafe_s(list[i + 1][0]) !== element ? list[i] = [ element, crect, 5 /* ClickType.tabindex */ ] : list[i + 1][2] === 3 /* ClickType.codeListener */ && 
              // [tabindex] > :listened, then [i] is only a layout container
              ++splice);
            } else {
              (notRemoveParents = k === 1 /* ClickType.edit */ && i > 0 && (element = list[i - 1][0]) === dom_utils_1.parentNode_unsafe_s(list[i][0]) && element.childElementCount < 2 && dom_utils_1.hasTag_("a", element) && !element.innerText) && (
              // a rare case that <a> has only a clickable <input>
              splice = i--);
            }
            j = i;
          }
          splice && (list.splice(i, 1), splice = 0);
          if (notRemoveParents) {
            continue;
          }
          for (;j > i - 3 && 0 < j && (k = list[j - 1][2]) > 1 /* ClickType.MaxNotWeak */ && k < 6 /* ClickType.MinNotWeak */ && isDescendant(list[j][0], list[j - 1][0], 1); j--) {}
          if (j < i) {
            list.splice(j, i - j);
            i = j;
          }
        }
      })(output);
      frameNested_ === null || (wantClickable ? exports.checkNestedFrame(output) : output.length > 0 && (exports.frameNested_ = frameNested_ = null));
    }
    output = exports.excludeHints(output, options, wantClickable);
    if (textFilter) {
      cur_ind = (textFilter += "").lastIndexOf("/");
      textFilter = cur_ind > 1 && textFilter[0] === "/" && utils_1.tryCreateRegExp(textFilter.slice(1, cur_ind), textFilter.slice(cur_ind + 1).replace("g", ""));
      textFilter && (output = output.filter(hint => {
        let text;
        return hint.length > 2 && (hint[2] === 1 /* ClickType.edit */ || hint[2] > 6 /* ClickType.MaxNotBox */) || textFilter.test((text = hint[0].innerText) !== void 0 ? text : hint[0].textContent);
      }));
    }
    if (dom_ui_1.ui_root && !wholeDoc && noClosedShadow && !notWantVUI && dom_ui_1.ui_root.mode === "closed") {
      if (localOldBZoom !== 1 && !traverseRoot) {
        rect_1.set_bZoom_(1);
        rect_1.prepareCrop_(1);
      }
      cur_arr = dom_utils_1.querySelectorAll_unsafe_(selector, dom_ui_1.ui_root);
      for (const i of cur_arr) {
        dom_utils_1.htmlTag_(i) && filter(output, i);
      }
      rect_1.WithOldZoom && rect_1.set_bZoom_(localOldBZoom);
    }
    clickTypeFilter_ = 0;
    return output;
  };
  const excludeHints = (output, options, wantClickable) => {
    const excl2 = dom_utils_1.findSelectorByHost(options.excludeOnHost) || wantClickable && link_hints_1.mode1_ < 32 /* HintMode.min_job */ && !options.match && /^\/s($|earch)/.test(utils_1.loc_.pathname) && dom_utils_1.findSelectorByHost(108 /* kTip.searchResults */);
    const excludedSelector = dom_utils_1.joinValidSelectors(dom_utils_1.findSelectorByHost(options.exclude), excl2);
    return excludedSelector && output.filter(hint => !dom_utils_1.testMatch(excludedSelector, hint[0])) || output;
  };
  exports.excludeHints = excludeHints;
  const isDescendant = (c, p, sc) => {
    // Note: currently, not compute normal shadowDOMs / even <slot>s (too complicated)
    let f, i = 3;
    while (0 < i-- && c !== null && (c = dom_utils_1.GetParent_unsafe_(c, 1 /* PNType.DirectElement */)) !== null && c !== p) {}
    if (c !== p || sc === 0 || buttonOrATags_.test(p.localName)) {
      return c === p;
    }
    for (;c.childElementCount === 1 && (!dom_utils_1.isNode_(f = c.firstChild, 3 /* kNode.TEXT_NODE */) || !f.data.trim()) && ++i < 3; c = c.firstElementChild) {}
    return i > 2;
  };
  const filterOutNonReachable = (list, notForAllClickable, useMatch) => {
    const zoom = rect_1.WithOldZoom ? rect_1.docZoom_ * rect_1.bZoom_ : 1, zoomD2 = rect_1.WithOldZoom ? zoom / 2 : .5, start = utils_1.getTime(), body = utils_1.doc.body, docEl = dom_utils_1.docEl_unsafe_(), 
    // note: exclude the case of `fromPoint.contains(el)`, to exclude invisible items in lists
    does_hit = (x, y) => {
      fromPoint = root.elementFromPoint(x, y);
      return !fromPoint || el === fromPoint || dom_utils_1.contains_s(el, fromPoint);
    };
    let el, root, fromPoint, temp, i = list.length, now = start;
    exports.initTestRegExps();
 // in case of `isDescendant(..., ..., 1)`
        const hasInert = dom_utils_1.isHTML_();
    let hasTable;
    while (0 <= --i && now - start < 1e3 /* GlobalConsts.ElementsFromPointTakesTooSlow */) {
      i & 63 || (now = utils_1.getTime());
      el = list[i][0];
      root = dom_utils_1.getRootNode_mounted(el);
      const nodeType = root.nodeType, area = list[i][1], cx = (area.l + area.r) * zoomD2, cy = (area.t + area.b) * zoomD2;
      if (does_hit(cx, cy) || nodeType !== 9 /* kNode.DOCUMENT_NODE */ && nodeType !== 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) {
        continue;
      }
      if (nodeType === 11 /* kNode.DOCUMENT_FRAGMENT_NODE */ && (temp = el.lastElementChild) && dom_utils_1.hasTag_("slot", temp) && dom_utils_1.contains_s(root.host, fromPoint)) {
        continue;
      }
      const tag = dom_utils_1.htmlTag_(el), mediaTag = dom_utils_1.getMediaTag(tag);
      if (mediaTag === 0 /* kMediaTag.img */ ? isDescendant(el, fromPoint, 0) : tag === "area" ? fromPoint === list[i][4] : tag === dom_utils_1.INP ? (!dom_utils_1.hasTag_("label", fromPoint) && dom_utils_1.isSafeEl_(fromPoint) && fromPoint.parentElement || fromPoint).control === el && (notForAllClickable || (i < 1 || list[i - 1][0] !== el) && (i + 2 > list.length || list[i + 1][0] !== el)) : mediaTag === 1 /* kMediaTag.otherMedias */ || !tag && el.ownerSVGElement) {
        continue;
      }
      if (tag === "label" && dom_utils_1.hasTag_(dom_utils_1.INP, fromPoint) && el.control === fromPoint) {
        useMatch || (list[i][0] = fromPoint);
        continue;
      }
      if (hasInert && dom_utils_1.isInert_(el)) {
        continue;
      }
      const small = area.r - area.l < 17 || area.b - area.t < 17;
      hasTable || (hasTable = dom_utils_1.querySelector_unsafe_("table") ? 2 : 1);
      if ((small || hasTable === 2 && el.closest("table")) && dom_utils_1.isSafeEl_(fromPoint) && !dom_utils_1.contains_s(fromPoint, el)) {
        list.splice(i, 1);
        continue;
      }
      now = i & 3 ? now : utils_1.getTime();
      let index2 = 0;
      const stack = root.elementsFromPoint(cx, cy), elPos = stack.indexOf(el);
      if (elPos < 0 && small) {
        list.splice(i, 1);
      } else if (elPos < 1 ? elPos < 0 : (index2 = stack.lastIndexOf(fromPoint, elPos - 1)) >= 0 || dom_utils_1.isSafeEl_(stack[0]) && dom_utils_1.contains_s(stack[0], fromPoint) && (index2 = 0, 
      1)) {
        if (elPos < 0) {
          for (temp = el; (temp = dom_utils_1.GetParent_unsafe_(temp, 3 /* PNType.RevealSlot */)) && temp !== body && temp !== docEl; ) {
            if (dom_utils_1.getComputedStyle_(temp).zoom !== "1") {
              temp = el;
              break;
            }
          }
        } else {
          while (temp = stack[index2], index2++ < elPos && dom_utils_1.isSafeEl_(temp) && (!dom_utils_1.isAriaFalse_(temp, 0 /* kAria.hidden */) || dom_utils_1.contains_s(temp, el))) {}
          temp = temp !== fromPoint && dom_utils_1.contains_s(el, temp) ? el : temp;
        }
        temp === el || !small && (does_hit(cx, rect_1.WithOldZoom ? (area.t + 2) * zoom : area.t + 2) || does_hit(cx, rect_1.WithOldZoom ? (area.b - 4) * zoom : area.b - 4) || does_hit(rect_1.WithOldZoom ? (area.l + 2) * zoom : area.l + 2, cy) || does_hit(rect_1.WithOldZoom ? (area.r - 4) * zoom : area.r - 4, cy)) || list.splice(i, 1);
      }
    }
    return i < 0;
  };
  exports.filterOutNonReachable = filterOutNonReachable;
  const getVisibleElements = view => {
    let subtractor, subtracted, r2 = null;
    const subtractSequence = rect1 => {
      let x1, x2, rect2 = subtractor, y1 = rect1.t > rect2.t ? rect1.t : rect2.t, y2 = rect1.b < rect2.b ? rect1.b : rect2.b;
      if (y1 >= y2 || (x1 = rect1.l > rect2.l ? rect1.l : rect2.l) >= (x2 = rect1.r < rect2.r ? rect1.r : rect2.r)) {
        subtracted.push(rect1);
      } else {
        const x0 = rect1.l, x3 = rect1.r, y0 = rect1.t, y3 = rect1.b;
 // [1 2 3; 4 ~ 5; 6 7 8]
                x0 < x1 && subtracted.push({
          l: x0,
          t: y0,
          r: x1,
          b: y3
        });
        y0 < y1 && subtracted.push({
          l: x1,
          t: y0,
          r: x3,
          b: y1
        });
        y2 < y3 && subtracted.push({
          l: x1,
          t: y2,
          r: x3,
          b: y3
        });
        x2 < x3 && subtracted.push({
          l: x2,
          t: y1,
          r: x3,
          b: y2
        });
      }
    };
    let _i = link_hints_1.mode1_, B = "[style*=background]", reachable = link_hints_1.hintOptions.reachable, visibleElements = _i > 34 && _i < 38 ? exports.traverse(`a[href],img,svg,div${B},span${B},[data-src]` + link_hints_1.kSafeAllSelector + (_i - 35 /* HintMode.DOWNLOAD_MEDIA */ ? "" : ",video,audio"), link_hints_1.hintOptions, (hints, element) => {
      const tag = dom_utils_1.htmlTag_(element);
      if (!tag) {
        element.localName === "svg" && "ownerSVGElement" in element && link_hints_1.mode1_ - 36 /* HintMode.COPY_IMAGE */ && getIfOnlyVisible(hints, element);
        return;
      }
      const mediaTag = dom_utils_1.getMediaTag(tag);
      let cr, str = dom_utils_1.getMediaUrl(element, mediaTag < 2 /* kMediaTag.MIN_NOT_MEDIA_EL */);
      if (mediaTag) {
        if (mediaTag > 1 && !utils_1.isImageUrl(str)) {
          str = element.style.backgroundImage;
          str = str && /^url\(/i.test(str) ? str : "";
        }
        str && getIfOnlyVisible(hints, element);
      } else /* aka. mediaTag == kMediaTag.img */
      if (str) {
        let r = rect_1.boundingRect_(element), l = r.l, t = r.t, w = r.r - l, h = r.b - t;
        if (w < 8 && h < 8) {
          w = h = w === h && (w ? w === 3 : l || t) ? 8 : 0;
        } else {
          !(w > 3) && (w = 3);
          !(h > 3) && (h = 3);
        }
        cr = rect_1.cropRectToVisible_(l, t, l + w, t + h);
        if (cr && (dom_utils_1.isStyleVisible_(element) || utils_1.evenHidden_ & 1 /* kHidden.VisibilityHidden */)) {
          cr = dom_utils_1.hasTag_("a", element) && exports.getPreferredRectOfAnchor(element) || rect_1.getCroppedRect_(element, cr);
          cr && hints.push([ element, cr, 0 /* ClickType.Default */ ]);
        }
      }
    }, 1, 0, 1) : _i > 41 && _i < 65 ? exports.traverse("a,[role=link]" + link_hints_1.kSafeAllSelector, link_hints_1.hintOptions, (hints, element) => {
      const h = element.localName === "a" && dom_utils_1.attr_s(element, "href"), a = h !== "#" && h || element.dataset.vimUrl;
      a === void 0 || a === "#" || utils_1.isJSUrl(a) || getIfOnlyVisible(hints, element);
    }) : exports.traverse(link_hints_1.kSafeAllSelector, link_hints_1.hintOptions, _i - 67 /* HintMode.FOCUS_EDITABLE */ ? _i - 66 /* HintMode.ENTER_VISUAL_MODE */ && !link_hints_1.hintOptions.anyText ? getClickable : (hints, element) => {
      if (dom_utils_1.isIFrameElement(element)) {
        link_hints_1.addChildFrame_ && element !== omni_1.omni_box && element !== mode_find_1.find_box && link_hints_1.addChildFrame_(link_hints_1.coreHints, element, rect_1.getIFrameRect(element));
        return;
      }
      const arr = element.childNodes;
      for (const node of arr) {
        if (dom_utils_1.isNode_(node, 3 /* kNode.TEXT_NODE */) && node.data.trim().length > 2) {
          getIfOnlyVisible(hints, element);
          break;
        }
      }
    } : exports.getEditable);
    (reachable != null ? reachable : (_i < 34 || _i === 67 /* HintMode.FOCUS_EDITABLE */) && utils_1.fgCache.e) && visibleElements.length <= (utils_1.isTY(reachable, 3 /* kTY.num */) ? reachable : 400 /* GlobalConsts.DefaultMaxElementCountToDetectPointer */) && exports.filterOutNonReachable(visibleElements, _i > 33 /* HintMode.max_mouse_events */ , link_hints_1.hintOptions.match) || _i === 67 /* HintMode.FOCUS_EDITABLE */ && dom_ui_1.filterOutInert(visibleElements);
    exports.maxLeft_ = maxLeft_ = view[2], exports.maxTop_ = maxTop_ = view[3];
    visibleElements.reverse();
    let t, reason, visibleElement;
    for (let _len = visibleElements.length, _j = utils_1.max_(0, _len - 16); 0 < --_len; ) {
      _j > 0 && --_j;
      visibleElement = visibleElements[_len];
      if (visibleElement[2] > 6 /* ClickType.MaxNotBox */) {
        continue;
      }
      let r = visibleElement[1];
      for (_i = _len; _j <= --_i; ) {
        t = visibleElements[_i][1];
        if (r.b > t.t && r.r > t.l && r.l < t.r && r.t < t.b && visibleElements[_i][2] < 7) {
          subtracted = [];
          subtractor = t;
          r2 !== null ? r2.forEach(subtractSequence) : subtractSequence(r);
          if ((r2 = subtracted).length === 0) {
            break;
          }
        }
      }
      if (r2 === null) {
        continue;
      }
      if (r2.length > 0) {
        t = r2[0];
        t.t > maxTop_ && t.t > r.t || t.l > maxLeft_ && t.l > r.l || r2.length === 1 && (t.b - t.t < 3 || t.r - t.l < 3) || (visibleElement[1] = t);
      } else if ((reason = visibleElement[2]) > 1 /* ClickType.MaxNotWeak */ && reason < 6 /* ClickType.MinNotWeak */ && dom_utils_1.contains_s(visibleElement[0], visibleElements[_i][0])) {
        visibleElements.splice(_len, 1);
      } else {
        visibleElement.length > 3 && (r = visibleElement[3][0]);
        for (let _k = _len; _i <= --_k; ) {
          t = visibleElements[_k][1];
          if (r.l >= t.l && r.t >= t.t && r.l < t.l + 10 && r.t < t.t + 8) {
            const offset = [ r, visibleElement.length > 3 ? visibleElement[3][1] + 13 : 13 ];
            visibleElements[_k][3] = offset;
            _k = 0;
          }
        }
      }
      r2 = null;
    }
    return visibleElements.reverse();
  };
  exports.getVisibleElements = getVisibleElements;
  const initTestRegExps = () => {
    if (!clickableClasses_) {
      clickableClasses_ = utils_1.createRegExp(92 /* kTip.newClickableClasses */ , "");
      clickableRoles_ = utils_1.createRegExp(94 /* kTip.clickableRoles */ , "i");
      buttonOrATags_ = utils_1.createRegExp(103 /* kTip.buttonOrA */ , "");
      exports.closableClasses_ = closableClasses_ = utils_1.createRegExp(104 /* kTip.closableClasses */ , "");
    }
  };
  exports.initTestRegExps = initTestRegExps;
  const checkNestedFrame = output => {
    let len = output ? output.length : 0;
    let res, rect, rect2, element;
    if (len > 1) {
      res = null;
    } else if (frames.length && dom_utils_1.isHTML_()) {
      if (dom_utils_1.fullscreenEl_unsafe_()) {
        res = 0;
      } else {
        if (output == null || clickTypeFilter_) {
          output = [];
          exports.initTestRegExps();
          for (let arr = dom_utils_1.querySelectorAll_unsafe_(utils_1.VTr(90 /* kTip.mayNotANestedFrame */)), i = arr.length; (len = output.length) < 2 && i-- > 0; ) {
            "lang" in arr[i] && getClickable(output, arr[i]);
          }
        }
        res = len - 1 ? len > 0 && null : dom_utils_1.isIFrameElement(element = output[0][0]) && (rect = rect_1.boundingRect_(element), 
        rect2 = rect_1.boundingRect_(dom_utils_1.docEl_unsafe_()), rect.t - rect2.t < 20 && rect.l - rect2.l < 20 && rect2.r - rect.r < 20 && rect2.b - rect.b < 20) && dom_utils_1.isStyleVisible_(element) ? element : null;
      }
    } else {
      res = false;
    }
    exports.frameNested_ = frameNested_ = res === false && utils_1.readyState_ < "i" ? null : res;
  };
  exports.checkNestedFrame = checkNestedFrame;
});
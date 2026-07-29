"use strict";
__filename = "content/pagination.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "../lib/rect", "./link_hints", "./local_links", "./mode_find", "./omni", "./dom_ui", "./async_dispatcher", "./port" ], (require, exports, utils_1, dom_utils_1, rect_1, link_hints_1, local_links_1, mode_find_1, omni_1, dom_ui_1, async_dispatcher_1, port_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.jumpToNextLink = exports.findNextInRel = exports.findNextInText = exports.filterTextToGoNext = exports.isInteractiveInPage = void 0;
  let iframesToSearchForNext;
  const isInteractiveInPage = element => {
    let {width: w, height: h} = rect_1.getBoundingClientRect_(element);
    return (w > 2 && h > 2 || !w !== !h) && (dom_utils_1.isStyleVisible_(element) || !!(utils_1.evenHidden_ & 1 /* kHidden.VisibilityHidden */)) || !!(utils_1.evenHidden_ & 4 /* kHidden.Size0 */);
  };
  exports.isInteractiveInPage = isInteractiveInPage;
  const filterTextToGoNext = (candidates, names, options, maxLen) => {
    // Note: this traverser should not need a prepareCrop before being called
    const fromMatchSelector = !!options.match;
    const excOnHost = dom_utils_1.findSelectorByHost(109 /* kTip.excludeWhenGoNext */);
    const links = utils_1.isAlive_ ? local_links_1.traverse(link_hints_1.kSafeAllSelector, options, (hints, element) => {
      let s;
      if (dom_utils_1.isIFrameElement(element)) {
        const rect = rect_1.getBoundingClientRect_(element), childApi = rect.width > 99 && rect.height > 15 && dom_utils_1.isStyleVisible_(element) && link_hints_1.detectUsableChild(element);
        childApi && iframesToSearchForNext.push(childApi);
      } else {
        (fromMatchSelector || (s = dom_utils_1.htmlTag_(element)) && (s === "a" || s === "img" || (s === "button" ? !element.disabled : s === "input" && dom_utils_1.uneditableInputs_[element.type] === 2)) || utils_1.clickable_.has(element) || local_links_1.extraClickable_ && local_links_1.extraClickable_.has(element) || dom_utils_1.attr_s(element, "onclick") || ((s = element.role) ? /^(button|link)$/i.test(s) : local_links_1.ngEnabled_ === 1 && dom_utils_1.attr_s(element, "ng-click"))) && (dom_utils_1.isAriaFalse_(element, 1 /* kAria.disabled */) && dom_utils_1.isAriaFalse_(element, 2 /* kAria.hasPopup */) || fromMatchSelector) && exports.isInteractiveInPage(element) && hints.push([ element ]);
      }
    }, 1, 1, 1) : [], isNext = options.n, lenLimits = options.l, totalMax = options.m, quirk = isNext ? ">>" : "<<", quirkIdx = names.indexOf(quirk), rel = isNext ? "next" : "prev", relIdx = names.indexOf(rel), detectQuirk = quirkIdx > 0 ? names.lastIndexOf(quirk[0], quirkIdx) : -1, wsRe = /\s+/, refusedStr = isNext ? "<" : ">";
    let i = utils_1.isAlive_ ? 0 : 201;
    let index = links.length;
    links.push([ utils_1.doc ]);
    for (;i < names.length; i++) {
      if (".#[:" /* GlobalConsts.SelectorPrefixesInPatterns */ .includes(names[i][0])) {
        const arr = dom_utils_1.querySelectorAll_unsafe_(names[i]);
        if (arr && arr[0] && dom_utils_1.isSafeEl_(arr[0])) {
          candidates.push([ arr[0], utils_1.vApi, i << 23, "" ]);
          names.length = i + 1;
        }
      }
    }
    let ch, s, len;
    for (;0 <= --index; ) {
      const link = links[index][0];
      s = "lang" in link ? (s = link.innerText, s.length > 2 && dom_utils_1.hasTag_("a", link) && link.childElementCount === 1 && (ch = link.ariaLabel) && link.firstElementChild.innerText === s ? ch : s) : link.textContent.trim();
      if (s.length > totalMax || dom_utils_1.contains_s(link, links[index + 1][0]) && s.length > 2) {
        continue;
      }
      if (s = s.length > 2 ? s : !s && (ch = link.value) && utils_1.isTY(ch) && ch || link.ariaLabel || link.title || dom_utils_1.hasTag_("img", link) && link.alt || s) {
        if (s.length > totalMax) {
          continue;
        }
        s = utils_1.Lower(s);
        for (i = 0; i < names.length; i++) {
          if (s.length < lenLimits[i] && s.includes(names[i])) {
            if (!s.includes(refusedStr) && (len = (s = s.trim()).split(wsRe).length) <= maxLen && (!excOnHost || !dom_utils_1.testMatch(excOnHost, link)) && (s !== "back" ? s !== "more" || !link.ariaHasPopup : link.closest("a"))) {
              maxLen > len && (maxLen = len + 1);
              let i2 = names.indexOf(s, i);
              if (i2 >= 0) {
                i = i2;
                len = 0;
              } else if (detectQuirk === i && s.includes(quirk)) {
                i = quirkIdx;
                len = 1;
              }
              // requires GlobalConsts.MaxNumberOfNextPatterns <= 255
                            candidates.push([ link, utils_1.vApi, i << 23 | len << 16, s ]);
            }
            break;
          }
        }
      } else {
        fromMatchSelector && candidates.push([ link, utils_1.vApi, names.length - 1 << 23, "" ]);
        // for non-English pages like www.google.co.jp
            }
      s.length < 5 && relIdx >= 0 && (ch = link.id) && ch.includes(rel) && candidates.push([ link, utils_1.vApi, relIdx << 23 | (4 + ch.length & 63) << 16, rel ]);
    }
    return maxLen;
  };
  exports.filterTextToGoNext = filterTextToGoNext;
  const findNextInText = (names, options) => {
    const wordRe = /\b/;
    let officer, candidate, array = [], maxLen = options.m;
    let curLenLimit;
    iframesToSearchForNext = [ utils_1.vApi ];
    while (officer = iframesToSearchForNext.pop()) {
      try {
        maxLen = officer.g(array, names, options, maxLen);
      } catch (_a) {}
      curLenLimit = maxLen + 1 << 16;
      array = array.filter(a => (a[2] & 8388607) < curLenLimit);
    }
    iframesToSearchForNext = null;
    array = array.sort((a, b) => a[2] - b[2]);
    let best;
    for (let i = array.length ? array[0][2] >> 23 : 200 /* GlobalConsts.MaxNumberOfNextPatterns */; i < names.length; ) {
      const s = names[i++];
      const re = utils_1.tryCreateRegExp(wordRe.test(s[0]) || wordRe.test(s.slice(-1)) ? `\\b${utils_1.escapeAllForRe(s)}\\b` : utils_1.escapeAllForRe(s));
      for (candidate of array) {
        if (candidate[2] > i << 23) {
          i = best ? 200 /* GlobalConsts.MaxNumberOfNextPatterns */ : i;
          break;
        }
        candidate[3] && !re.test(candidate[3]) || (best = (candidate[1] !== utils_1.vApi || rect_1.isNotInViewport(candidate[0])) && best || candidate);
      }
    }
    return best;
  };
  exports.findNextInText = findNextInText;
  const findNextInRel = options => {
    const notFiltered = false /* BrowserVer.MinEnsuredCaseInSensitiveAttrSelector */ /* BrowserVer.MinEnsuredCaseInSensitiveAttrSelector */;
    let query = utils_1.VTr(85 /* kTip.isWithRel */ , notFiltered ? "" : options.r);
    let elements = dom_utils_1.querySelectorAll_unsafe_(query);
    let s;
    let matched, tag, invisible = 9;
    const re1 = /\s/;
    for (const element of elements) {
      if ((tag = dom_utils_1.htmlTag_(element)) && (!notFiltered || (s = element.rel) && utils_1.Lower(s).split(re1).indexOf(options.r) >= 0) && ((s = element.href) || tag < "aa") && (tag > "b" || exports.isInteractiveInPage(element))) {
        if (matched && s && !utils_1.urlSameIgnoringHash(s, matched.href || s)) {
          return null;
        }
        if (!matched || (invisible < 9 ? invisible : invisible = rect_1.isNotInViewport(matched)) || !options.n && !rect_1.isNotInViewport(element)) {
          invisible = !matched || invisible ? 9 : 0 /* kInvisibility.Visible */;
          matched = element;
        }
      }
    }
    if (matched && (invisible < 9 ? invisible : rect_1.isNotInViewport(matched)) > 1 /* kInvisibility.OutOfView */) {
      s = matched.href;
      options.match = `a[href*="${CSS.escape(s.slice(new URL(s).origin.length))}"]`;
      const res = local_links_1.traverse("a", options, (hints, element) => {
        if (element.href === s && exports.isInteractiveInPage(element)) {
          rect_1.isNotInViewport(element) && (hints.length = 0);
          hints.push([ element ]);
        }
      }, 1, 1)[0];
      matched = res ? res[0] : matched;
    }
    return matched && [ matched, utils_1.vApi ];
  };
  exports.findNextInRel = findNextInRel;
  const jumpToNextLink = (linkElement, options) => {
    const invisible = options.a ? 3 /* kInvisibility.NoSpace */ : rect_1.isNotInViewport(linkElement);
    const avoidClick = invisible > 1 /* kInvisibility.OutOfView */;
    const url = (avoidClick || invisible && !options.v) && (linkElement.href || (dom_utils_1.findAnchor_(linkElement) || linkElement).href);
    url && utils_1.vApi.t({
      k: 1 /* kTip.raw */ ,
      t: url.slice(0, 256),
      d: 2,
      l: 1
    });
    if (avoidClick && url) {
      port_1.contentCommands_[18 /* kFgCmd.framesGoBack */ ](utils_1.safer({
        r: 1,
        u: url
      }), 1);
    } else {
      options.v && invisible === 1 /* kInvisibility.OutOfView */ && rect_1.view_(linkElement, 1);
      dom_ui_1.flash_(linkElement);
 // here calls getRect -> preparCrop_
            utils_1.timeout_(() => {
        async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.click_async(linkElement));
      }, 100);
    }
    port_1.runFallbackKey(options, 0);
  };
  exports.jumpToNextLink = jumpToNextLink;
});
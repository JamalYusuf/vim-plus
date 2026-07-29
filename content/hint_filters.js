"use strict";
__filename = "content/hint_filters.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "./link_hints", "../lib/rect", "../lib/keyboard_utils", "./local_links", "./dom_ui", "./omni" ], (require, exports, utils_1, dom_utils_1, link_hints_1, rect_1, keyboard_utils_1, local_links_1, dom_ui_1, omni_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.matchHintsByKey = exports.initAlphabetEngine = exports.renderMarkers = exports.getMatchingHints = exports.generateHintText = exports.initFilterEngine = exports.rotate1 = exports.adjustMarkers_old_cr_edge = exports.createHint = exports.hintFilterReset = exports.set_maxPrefixLen_ = exports.set_zIndexes_ = exports.zIndexes_ = exports.activeHint_ = void 0;
  const kNumbers = "0123456789";
  let activeHint_;
  exports.activeHint_ = activeHint_;
  let nonMatchedRe_;
  let maxPrefixLen_ = 0;
  let pageNumberHintArray;
  let zIndexes_;
  exports.zIndexes_ = zIndexes_;
  function set_zIndexes_(_newZIndexes) {
    exports.zIndexes_ = zIndexes_ = _newZIndexes;
  }
  exports.set_zIndexes_ = set_zIndexes_;
  function set_maxPrefixLen_(_newMaxPrefixLen) {
    maxPrefixLen_ = _newMaxPrefixLen;
  }
  exports.set_maxPrefixLen_ = set_maxPrefixLen_;
  const hintFilterReset = () => {
    pageNumberHintArray = exports.zIndexes_ = zIndexes_ = exports.activeHint_ = activeHint_ = null;
  };
  exports.hintFilterReset = hintFilterReset;
  const createHint = link => {
    let i = link.length < 4 ? link[1].l : link[3][0].l + link[3][1];
    const marker = dom_utils_1.createElement_("span"), st = marker.style, isBox = link[2] > 6 /* ClickType.MaxNotBox */ , P = "px";
    marker.className = isBox ? "LH BH" : "LH";
    st.left = i + P;
    i = link[1].t;
    st.top = i + P;
    return {
      a: "",
      d: link[0],
      h: null,
      i: 0,
      m: marker,
      r: link.length > 4 ? link[4] : isBox ? link[0] : null
    };
  };
  exports.createHint = createHint;
  exports.adjustMarkers_old_cr_edge = rect_1.WithOldZoom ? arr => {
    const zi = rect_1.bZoom_;
    let i = arr.length - 1;
    if (!dom_ui_1.ui_root || i < 0 || arr[i].d !== omni_1.omni_box && !dom_utils_1.querySelector_unsafe_("#HDlg", dom_ui_1.ui_root)) {
      return;
    }
    const z = ("" + 1 / zi).slice(0, 7);
    while (0 <= i && dom_ui_1.ui_root.contains(arr[i].d)) {
      let st = arr[i--].m.style;
      st.zoom = z;
    }
  } : 0;
  const rotate1 = (totalHints, reverse, saveIfNoOverlap) => {
    if (!zIndexes_) {
      const rects = [];
      let stacks = [];
      totalHints.forEach((hint, i) => {
        if (hint.m.style.visibility) {
          rects.push(null);
          return;
        }
        hint.z = hint.z || i + 1;
        const m = rect_1.boundingRect_(hint.m);
        let stackForThisMarker;
        rects.push(m);
        for (let j = 0, len2 = stacks.length; j < len2; ) {
          let stack = stacks[j], k = 0, len3 = stack.length;
          for (;k < len3; k++) {
            const t = rects[stack[k]];
            if (m.b > t.t && m.t < t.b && m.r > t.l && m.l < t.r) {
              break;
            }
          }
          if (k >= len3) {} else {
            if (stackForThisMarker) {
              stackForThisMarker.push(...stack);
              stacks.splice(j, 1);
              len2--;
              continue;
            }
            stack.push(i);
            stackForThisMarker = stack;
          }
          j++;
        }
        stackForThisMarker || stacks.push([ i ]);
      });
      stacks = stacks.filter(stack => stack.length > 1);
      if (stacks.length <= 0) {
        exports.zIndexes_ = zIndexes_ = saveIfNoOverlap ? 0 : zIndexes_;
        return;
      }
      exports.zIndexes_ = zIndexes_ = stacks;
    }
    for (const zIndexSubArray of zIndexes_) {
      const length = zIndexSubArray.length, end = reverse ? -1 : length;
      const max = utils_1.max_(...zIndexSubArray);
      let oldI = totalHints[zIndexSubArray[reverse ? 0 : length - 1]].z;
      for (let j = reverse ? length - 1 : 0; j !== end; reverse ? j-- : j++) {
        const hint = totalHints[zIndexSubArray[j]];
        const m = hint.m, newI = hint.z;
        m.style.zIndex = hint.z = oldI;
        dom_utils_1.toggleClass_s(m, "OH", oldI < max);
        dom_utils_1.toggleClass_s(m, "SH", oldI >= max);
        oldI = newI;
      }
    }
  };
  exports.rotate1 = rotate1;
  const initFilterEngine = hints => {
    const len = link_hints_1.hintChars !== kNumbers ? 0 : hints.length;
    let i = 0, idxOfSecond = 0, lastPage = 0, curPage = 0, curRangeSecond = 0, curRangeCountS1 = 0;
    for (;i < len; i++) {
      const text = hints[i].h.t;
      if (text < ":" /* kChar.minNotNum */ && text > "0" && (curPage = +text) && curPage < len && curPage === (curPage | 0)) {
        if (curPage - lastPage < 3 && curPage > lastPage && lastPage) {
          lastPage = curPage;
          !idxOfSecond && (idxOfSecond = i);
          continue;
        }
        lastPage = curPage;
      } else {
        lastPage = 0;
      }
      if (idxOfSecond) {
        if (curRangeCountS1 < i - idxOfSecond) {
          curRangeSecond = idxOfSecond;
          curRangeCountS1 = i - idxOfSecond;
        }
        idxOfSecond = 0;
      }
    }
    if (idxOfSecond && curRangeCountS1 < len - idxOfSecond) {
      curRangeSecond = idxOfSecond;
      curRangeCountS1 = len - idxOfSecond;
    }
    pageNumberHintArray = hints.slice(curRangeSecond - 1, curRangeSecond + curRangeCountS1);
    exports.getMatchingHints(link_hints_1.hintKeyStatus, "", "", 0);
  };
  exports.initFilterEngine = initFilterEngine;
  exports.generateHintText = (hint, hintInd, allItems) => {
    const el = hint[0], localName = el.localName;
    let ind, text = "", show = 0;
    if ("lang" in el) {
      switch (localName) {
       case "input":
       case "select":
       case "textarea":
        let labels = el.labels;
        let labelText = labels && labels.length ? labels[0].innerText.trim() : "";
        labelText && (show = +!dom_utils_1.contains_s(labels[0], el));
        if (localName[0] === "s") {
          const selected = el.selectedOptions[0];
          text = selected ? selected.label : "";
        } else {
          if (localName < "s") {
            if (el.type === "file") {
              text = "Choose File";
            } else if (el.type === "password") {
              break;
            }
          }
          text = text || el.value || el.placeholder;
          if (localName > "t" && !rect_1.dimSize_(el, 9 /* kDim.positionY */)) {
            ind = text.indexOf("\n") + 1;
            ind && (ind = text.indexOf("\n", ind)) > 0 && (text = text.slice(0, ind));
          }
        }
        text = labelText ? labelText + " " + text : text;
        break;

       case "details":
        text = "Open";
        show = 1;
        break;

       case "img":
        text = el.complete && el.alt || el.title;
        show = 2;
        break;

       default:
        if (show = +(hint[2] > 6 /* ClickType.MaxNotBox */)) {
          text = hint[2] > 7 /* ClickType.frame */ ? "Scroll" : "Frame";
        } else if (text = el.innerText.trim()) {
          ind = text.indexOf("\n") + 1;
          ind && (ind = text.indexOf("\n", ind)) > 0 && (text = text.slice(0, ind));
        } else if (localName === "a") {
          let el2 = el.firstElementChild;
          text = !el2 || !dom_utils_1.hasTag_("img", el2) || hintInd + 1 < allItems.length && el2 === allItems[hintInd + 1].d ? "" : exports.generateHintText([ el2 ], hintInd, allItems).t;
          show = text ? 2 : 0;
        }
        text = text || el.title || el.ariaLabel || ((text = el.className) && local_links_1.closableClasses_.test(text) ? "Close" : "");
        break;
      }
    } else {
      // SVG elements or plain `Element` nodes
      // SVG: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text
      // demo: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mfrac on Firefox
      text = dom_utils_1.textContent_s(el).replace(/\s{2,}/g, " ");
    }
    if (text) {
      text = text.trim().slice(0, 252 /* GlobalConsts.MaxLengthOfHintText */).trim();
      text && text[0] === ":" && (text = text.replace(/^[:\s]+/, ""));
    }
    text = !show || !text || show > 1 && ++hintInd < allItems.length && allItems[hintInd].h.t.replace(":", "") === text ? text : ":" + text;
    return {
      t: text,
      w: null
    };
  };
  const getMatchingHints = (keyStatus, text, seq, inited) => {
    const oldTextSeq = inited > 1 ? keyStatus.t : "a";
    let hints = keyStatus.c;
    if (oldTextSeq !== text) {
      const t2 = text.trim(), t1 = oldTextSeq.trim();
      keyStatus.t = text;
      if (t1 !== t2) {
        exports.zIndexes_ = zIndexes_ = zIndexes_ && null;
        const search = t2.split(" "), hasSearch = !!t2, oldKeySeq = keyStatus.k, oldHintArray = t2.startsWith(t1) ? hints : link_hints_1.allHints;
        keyStatus.k = "";
        if (hasSearch && !link_hints_1.allHints[0].h.w) {
          for (const {h: textHint} of link_hints_1.allHints) {
            // cache lower-case versions for smaller memory usage
            const words = textHint.w = (textHint.t = utils_1.Lower(textHint.t)).split(nonMatchedRe_);
            words[0] || words.shift();
            words.length && (words[words.length - 1] || words.pop());
          }
        }
        hasSearch && (hints = []);
        for (const hint of oldHintArray) {
          if (hasSearch) {
            const s = scoreHint(hint.h, search);
            (hint.i = s) && hints.push(hint);
          } else {
            hint.i = hint.h.t.length + 1;
          }
        }
        const newLen = hints.length;
        if (newLen) {
          if (hasSearch && newLen < 2) {
            // in case of only 1 hint in fullHints
            inited > 2 ? keyStatus.t = "" : keyStatus.c = hints;
            return hints[0];
          }
          keyStatus.c = hasSearch ? hints : hints = oldHintArray.slice();
          !hasSearch && (link_hints_1.hintOptions.ordinal != null ? link_hints_1.hintOptions.ordinal : (dom_utils_1.htmlTag_(dom_utils_1.docEl_unsafe_()) && dom_utils_1.docEl_unsafe_().dataset.vimiumHints || "").includes("ordinal")) || hints.sort((x1, x2) => x1.i - x2.i);
          if (!hasSearch) {
            for (const item of pageNumberHintArray) {
              const n = +item.h.t - 1;
              hints[hints.indexOf(item)] = hints[n];
              hints[n] = item;
            }
          }
          for (let base = link_hints_1.hintChars.length, is10Digits = link_hints_1.hintChars === kNumbers, i = 0; i < hints.length; i++) {
            let hintString = "", num = is10Digits ? 0 : i + 1;
            for (;num; num = num / base | 0) {
              hintString = link_hints_1.hintChars[num % base] + hintString;
            }
            hints[i].a = is10Digits ? i + 1 + "" : hintString;
          }
        }
        // hints[].zIndex is reset in .MakeStacks_
                if (inited && (newLen || oldKeySeq)) {
          for (const hint of newLen ? hints : oldHintArray) {
            const firstChild = hint.m.firstElementChild;
            firstChild && dom_utils_1.removeEl_s(firstChild);
            hint.m.firstChild.data = hint.a;
          }
          for (const hint of oldHintArray) {
            dom_utils_1.setVisibility_s(hint.m, hint.i !== 0);
          }
        }
        if (!newLen) {
          keyStatus.t = oldTextSeq;
          return 2;
        }
      }
    }
    const hintsMatchingSeq = seq ? hints.filter(hint => hint.a.startsWith(seq)) : hints;
    const newMatchingSeq = hintsMatchingSeq.length;
    let span;
    if (keyStatus.k !== seq) {
      keyStatus.k = seq;
      exports.zIndexes_ = zIndexes_ = zIndexes_ && null;
      if (newMatchingSeq < 2) {
        return newMatchingSeq ? hintsMatchingSeq[0] : 0;
      }
      for (const {m: marker, a: key} of hints) {
        const match = key.startsWith(seq);
        dom_utils_1.setVisibility_s(marker, match);
        if (match) {
          let child = marker.firstChild;
          if (child.nodeType === 3 /* kNode.TEXT_NODE */) {
            span = dom_utils_1.createElement_("span");
            marker.prepend(span);
            dom_utils_1.setClassName_s(span, "MC");
          } else {
            span = child;
            child = child.nextSibling;
          }
          span.textContent = seq;
          child.data = key.slice(seq.length);
        }
      }
    }
    inited && (oldTextSeq !== text || link_hints_1.isHC_) && link_hints_1.setMode(link_hints_1.hintMode_);
    hints = hintsMatchingSeq;
    const oldActive = activeHint_;
    const newActive = hints[(keyStatus.b < 0 ? keyStatus.b += newMatchingSeq : keyStatus.b) % newMatchingSeq];
    if (oldActive !== newActive) {
      if (oldActive) {
        dom_utils_1.toggleClass_s(oldActive.m, "MH", 0);
        oldActive.m.style.zIndex = "";
      }
      dom_utils_1.toggleClass_s(newActive.m, "MH", 1);
      newActive.m.style.zIndex = link_hints_1.allHints.length;
      exports.activeHint_ = activeHint_ = newActive;
    }
    return 2;
  };
  exports.getMatchingHints = getMatchingHints;
  /**
     * total / Math.log(~)
     * * `>=` 1 / `Math.log`(1 + (MaxLengthOfHintText = 256)) `>` 0.18
     * * margin `>=` `0.0001267`
     *
     * so, use `~ * 1e4` to ensure delta > 1
     */  const scoreHint = (textHint, queryWordArray) => {
    let hintWordArray = textHint.w, total = 0;
    if (!hintWordArray.length) {
      return 0;
    }
    for (const search of queryWordArray) {
      let max = 0;
      for (const word of hintWordArray) {
        const pos = word.indexOf(search);
        max = pos < 0 ? max : utils_1.max_(max, pos ? 1 : hintWordArray.length - search.length ? max ? 2 : 6 : max ? 4 : 8);
      }
      if (!max) {
        return 0;
      }
      total += max;
    }
    return total && utils_1.math.log(1 + textHint.t.length) / total;
  };
  const renderMarkers = hintItemArray => {
    const invisibleHintTextRe = link_hints_1.useFilter_ && utils_1.createRegExp(95 /* kTip.invisibleHintText */ , "g");
    let right;
    for (const hint of hintItemArray) {
      const marker = hint.m;
      if (link_hints_1.useFilter_) {
        marker.textContent = hint.a;
        right = hint.h.t;
        if (!right || right[0] !== ":") {
          continue;
        }
        right = hint.h.t = right.slice(1);
        right = right.replace(invisibleHintTextRe, " ").replace(/:[:\s]*$/, "").trim();
        right = right.length > 35 /* GlobalConsts.MaxLengthOfShownText */ ? right.slice(0, 33).trimRight() + "\u2026" : right;
        if (!right) {
          continue;
        }
        dom_utils_1.toggleClass_s(marker, "TH", 1);
        right = ": " + right;
      } else {
        right = hint.a.slice(-1);
        for (const markerChar of hint.a.slice(0, -1)) {
          const node = dom_utils_1.createElement_("span");
          node.textContent = markerChar;
          marker.append(node);
        }
      }
      marker.append(right);
    }
  };
  exports.renderMarkers = renderMarkers;
  const initAlphabetEngine = hintItems => {
    const step = link_hints_1.hintChars.length, chars2 = " " + link_hints_1.hintChars, count = hintItems.length, start = utils_1.math.ceil((count - 1) / (step - 1)) | 0 || 1, bitStep = utils_1.math.ceil(utils_1.math.log2(step + 1)) | 0;
    let hints = [ 0 ], next = 1, bitOffset = 0;
    for (let offset = 0, hint = 0; offset < start; ) {
      next === offset && (next = next * step + 1, bitOffset += bitStep);
      hint = hints[offset++];
      for (let ch = 1; ch <= step; ch++) {
        hints.push(ch << bitOffset | hint);
      }
    }
    maxPrefixLen_ = bitOffset / bitStep - +(next > start) | 0;
    while (next-- > start) {
      hints[next] <<= bitStep;
    }
    hints = hints.slice(start, start + count).sort((i, j) => i - j);
    for (let i = 0, mask = (1 << bitStep) - 1; i < count; i++) {
      let hintString = "", num = hints[i];
      num & mask || (num >>= bitStep);
      for (;num; num >>>= bitStep) {
        // use ">>>" to prevent potential typos from causing a dead loop
        hintString += chars2[num & mask];
      }
      hintItems[i].a = hintString;
      (hintString >= ":" /* kChar.minNotNum */ || hintString < "0") && (hintItems[hintString.toLowerCase()] = hintItems[i]);
    }
  };
  exports.initAlphabetEngine = initAlphabetEngine;
  const matchHintsByKey = (keyStatus, event, key, keybody) => {
    let doesDetectMatchSingle = 0, isSpace = keybody === keyboard_utils_1.SPC, isTab = keybody === "tab" /* kChar.tab */;
    let {k: sequence, t: textSeq, t: textSeq0, b: oldTab, c: hintArray} = keyStatus;
    textSeq = textSeq && textSeq.replace("  ", " ");
    keyStatus.b = isSpace ? oldTab : isTab ? link_hints_1.useFilter_ ? oldTab - 2 * +(key === "s-" + keybody) + 1 : 1 - oldTab : (link_hints_1.useFilter_ || oldTab && (sequence = sequence.slice(0, -1)), 
    0);
    keyStatus.n = 1;
    if (isTab) {
      link_hints_1.resetMode();
    } else if (keybody === keyboard_utils_1.BSP || keybody === keyboard_utils_1.DEL || keybody === "f1" /* kChar.f1 */) {
      if (!sequence && !textSeq) {
        return 0;
      }
      sequence ? sequence = sequence.slice(0, -1) : textSeq = textSeq.slice(0, -1);
    } else {
      if (link_hints_1.useFilter_ && keybody === keyboard_utils_1.ENTER || isSpace && textSeq0 !== textSeq) {
        // keep .known_ to be 1 - needed by .executeL_
        return activeHint_;
      }
      if (isSpace) {
        // then useFilter is true
        textSeq = textSeq0 + " ";
      } else {
        if (link_hints_1.useFilter_ && (key.includes("c-") || key.includes("m-")) || (event.c + keybody).length - 2) {
          return 2;
        }
        {
          let lower = utils_1.Lower(keybody);
          keybody = link_hints_1.useFilter_ ? keybody : lower.toUpperCase();
          link_hints_1.useFilter_ && link_hints_1.resetMode();
          if (!link_hints_1.hintChars.includes(keybody) || link_hints_1.useFilter_ && key === "a-" + keybody && keybody < ":" /* kChar.minNotNum */ && keybody > "/" /* kChar.maxNotNum */) {
            if (!link_hints_1.useFilter_) {
              return 0;
            }
            if (keybody !== lower && link_hints_1.hintChars !== utils_1.Lower(link_hints_1.hintChars) || (nonMatchedRe_ || (nonMatchedRe_ = utils_1.createRegExp(96 /* kTip.notMatchedHintText */ , "g"))).test(lower)) {
              return 2;
            }
            sequence = "";
            textSeq = textSeq !== " " ? textSeq + lower : lower;
          } else {
            sequence += keybody;
            doesDetectMatchSingle = link_hints_1.useFilter_ || sequence.length < maxPrefixLen_ ? 1 : 2;
          }
        }
      }
    }
    keyStatus.n = 0;
    if (doesDetectMatchSingle > 1) {
      for (const hint of hintArray) {
        if (hint.a === sequence) {
          return hint;
        }
      }
    }
    if (link_hints_1.useFilter_) {
      return exports.getMatchingHints(keyStatus, textSeq, sequence, 2);
    }
    {
      exports.zIndexes_ = zIndexes_ = zIndexes_ && null;
      keyStatus.k = sequence;
      const notDoSubCheck = !keyStatus.b, limit = sequence.length - keyStatus.b, fewer = doesDetectMatchSingle > 0, wantedPrefix = sequence.slice(0, limit), lastChar = notDoSubCheck ? "" : sequence[limit];
      hintArray = keyStatus.c = (fewer ? hintArray : link_hints_1.allHints).filter(hint => {
        const pass = hint.a.startsWith(wantedPrefix) && (notDoSubCheck || hint.a[limit] !== lastChar);
        pass && fewer || dom_utils_1.setVisibility_s(hint.m, pass);
        return pass;
      });
      for (const hint of hintArray) {
        const ref = hint.m.childNodes, hintN = hint.i;
        // https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/dom/dom_token_list.cc?q=DOMTokenList::setValue&g=0&l=258
        // shows that `.classList.add()` costs more
                for (let j = limit > hintN ? hintN : limit, end = limit > hintN ? limit : hintN; j < end; j++) {
          dom_utils_1.setClassName_s(ref[j], j < limit ? "MC" : "");
        }
        hint.i = limit;
      }
      return hintArray.length ? (link_hints_1.isHC_ && link_hints_1.setMode(link_hints_1.hintMode_), 
      2) : 0;
    }
  };
  exports.matchHintsByKey = matchHintsByKey;
});
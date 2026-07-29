"use strict";
__filename = "content/link_actions.js";
define([ "require", "exports", "../lib/utils", "../lib/rect", "../lib/dom_utils", "./local_links", "./link_hints", "./scroller", "./port", "./dom_ui", "../lib/keyboard_utils", "./insert", "./async_dispatcher", "./omni", "./mode_find" ], (require, exports, utils_1, rect_1, dom_utils_1, local_links_1, link_hints_1, scroller_1, port_1, dom_ui_1, keyboard_utils_1, insert_1, async_dispatcher_1, omni_1, mode_find_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.executeHintInOfficer = exports.set_removeFlash = exports.removeFlash = void 0;
  let removeFlash;
  exports.removeFlash = removeFlash;
  function set_removeFlash(_newRmFlash) {
    return exports.removeFlash = removeFlash = _newRmFlash;
  }
  exports.set_removeFlash = set_removeFlash;
  const executeHintInOfficer = (hint, event, knownRect) => {
    const unhoverOnEsc_d = () => {
      async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.unhover_async());
    };
    const findNextTargetEl = (pattern, dir) => {
      let click2nd, sr2;
      let click3nd;
      pattern = pattern && (!dir || !dom_utils_1.isIFrameElement(clickEl, 1)) && dom_utils_1.findSelectorByHost(pattern, clickEl, dir || 1);
      pattern = pattern != null ? pattern : dir > 1 /* kNextTarget.child */ && dom_utils_1.findSelectorByHost(117 /* kTip.DefaultDoClickOn */ , clickEl, dir);
      if (pattern) {
        if (dir) {
          if (!" true :host :root html ".includes(` ${pattern} `)) {
            const alsoTrue = pattern.endsWith(",true");
            click2nd = dom_utils_1.querySelector_unsafe_(alsoTrue ? pattern.slice(0, -5) : pattern, clickEl);
            pattern = !click2nd && alsoTrue;
          }
          if (pattern) {
            rect = dom_ui_1.getRect(clickEl);
            pattern += "";
            const center = rect_1.center_(rect, link_hints_1.hintOptions.xy);
            click2nd = rect && (/** ":host" */ pattern < ":r" ? clickEl : dom_utils_1.elFromPoint_(center, clickEl));
            click2nd = /** "html" */ pattern[0] === "h" || click2nd && dom_utils_1.contains_s(clickEl, click2nd) ? click2nd : null;
            click3nd = click2nd;
            while (sr2 = click3nd && dom_utils_1.TryGetShadowRoot_(click3nd)) {
              click3nd = dom_utils_1.elFromPoint_(center, sr2);
              click3nd && sr2.contains(click3nd) ? click2nd = click3nd : click3nd = 0;
            }
          }
        } else {
          click3nd = clickEl;
          while (click3nd && !(click2nd = click3nd.closest(pattern + ""))) {
            sr2 = dom_utils_1.getRootNode_mounted(click3nd);
            click3nd = dom_utils_1.isNode_(sr2, 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) && dom_utils_1.SafeEl_not_ff_(sr2.host);
          }
        }
      }
      return click2nd && dom_utils_1.SafeEl_not_ff_(click2nd);
    };
    const accessElAttr = isUrlOrText => {
      const dataset = clickEl.dataset;
      const format = dataset && link_hints_1.hintOptions.access;
      let el;
      const cb = (_, i) => i.split("||").reduce((v, j) => v || dom_utils_1.extractField(el, j), "");
      dataset && isUrlOrText && (dataset.vimText != null || dataset.vimUrl != null) && dom_utils_1.dispatchEvent_(clickEl, dom_utils_1.newEvent_("vimiumData"));
      for (let accessor of format ? utils_1.splitEntries_(format, ",") : []) {
        accessor = accessor.trim();
        const __arr = accessor.split(":"), selector = __arr.length > 1 ? __arr[0] : 0;
        el = selector ? dom_utils_1.SafeEl_not_ff_(utils_1.safeCall(dom_utils_1.querySelector_unsafe_, selector, clickEl)) : clickEl;
        const props = el ? selector !== 0 ? accessor.slice(selector.length + 1) : accessor : "";
        let json = props.includes("${") ? props.replace(/\$\{([^}]+)}/g, cb) : el && props;
        json = json !== props ? json : dom_utils_1.extractField(el, props);
        if (json) {
          return [ json, 1 ];
        }
      }
      return [ dataset && ((isUrlOrText > 1 ? dataset.vimText : isUrlOrText && dataset.vimUrl) || isUrlOrText < 2 && (dataset.canonicalSrc || dataset.src || tag === "a" && dataset.href)) || "" ];
    };
    const getUrlData = str => {
      let link = clickEl;
      (str = str || accessElAttr(1)[0]) && ((link = dom_utils_1.createElement_("a")).href = str.trim());
      // $1.href is ensured well-formed by @GetLinks_
            return dom_utils_1.hasTag_("a", link) ? link.href : "";
    };
    const tryDrawOnCanvas = (hudMsg, req) => {
      let s2, r1, timer1 = 0;
      let img = clickEl;
      const defer0 = utils_1.promiseDefer_(), resolveData = defer0.r;
      const url = isHtmlImage && (req ? req.u : (s2 = dom_utils_1.getMediaUrl(img, 1)) && getUrlData(s2));
      if (url) {
        const parsed = new URL(url), kIsGlobal = /^(https?|data):/i.test(url);
        const origin = parsed.origin || "", sameOrigin = origin[0] === "h" && origin === utils_1.loc_.origin;
        const defer1 = utils_1.promiseDefer_();
        const kIsInIncognito = chrome.extension.inIncognitoContext;
        r1 = defer1.r;
        richText = (richText || "") + "";
        if (!richText.includes("safe") && kIsGlobal && !kIsInIncognito && !utils_1.urlSameIgnoringHash(url, utils_1.locHref()) || parsed.pathname.endsWith(".gif") && !richText.includes("force")) {
          r1(0);
        } else if (isHtmlImage && utils_1.urlSameIgnoringHash(url, dom_utils_1.getMediaUrl(img, 2)) && (sameOrigin || img.crossOrigin) && img.naturalWidth) {
          r1(1);
        } else if (sameOrigin || kIsInIncognito) {
          timer1 = utils_1.timeout_(r1, 9e3);
          img = dom_utils_1.createElement_("img");
          img.onload = img.onerror = r1;
          kIsInIncognito && (img.crossOrigin = "anonymous");
          // avoid a warning on FF 102.0.1esr
          img.src = url;
          link_hints_1.hintApi.h(47 /* kTip.reDownloading */ , 9);
        } else {
          r1(0);
        }
        defer1.p.then(ok => {
          const blobToData = blob => {
            if (!blob) {
              resolveData();
              return;
            }
            const reader = new FileReader;
            reader.onload = resolveData;
            reader.readAsDataURL(blob);
          };
          const h = img.naturalHeight;
          utils_1.clearTimeout_(timer1);
          ok = (utils_1.isTY(ok, 1 /* kTY.obj */) ? ok.type > "l" : ok === 1) && h;
          if (ok) {
            const canvas = dom_utils_1.createElement_("canvas");
            const w = canvas.width = img.naturalWidth;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
 // ctx may be null if OOM
                        ok = 0;
            if (ctx) {
              try {
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(blobToData);
                ok = 1;
              } catch (_a) {}
            }
          }
          if (ok) {
            return;
          }
          img !== clickEl && dom_utils_1.setOrRemoveAttr_s(img, "src");
          if (kIsInIncognito || !kIsGlobal) {
            link_hints_1.hintApi.h(47 /* kTip.reDownloading */ , 9);
            fetch(url, {
              cache: "force-cache",
              signal: AbortSignal.timeout(9e3)
            }).then(res => res.blob()).then(blobToData, resolveData.bind(0, 0));
          } else {
            req && link_hints_1.mode1_ - 36 /* HintMode.COPY_IMAGE */ || link_hints_1.hintApi.h(47 /* kTip.reDownloading */ , 9);
            resolveData();
          }
        });
      } else {
        resolveData();
      }
      retPromise = defer0.p.then(dataUrl => {
        dataUrl = utils_1.isTY(dataUrl, 1 /* kTY.obj */) ? dataUrl.target.result : dataUrl;
        if (url || req) {
          req && link_hints_1.mode1_ - 36 /* HintMode.COPY_IMAGE */ ? dataUrl && (req.r = req.u, 
          req.u = dataUrl) : req = {
            H: 18 /* kFgReq.copy */ ,
            i: dataUrl || "",
            u: url,
            r: richText
          };
          link_hints_1.hintApi.p(req);
        } else {
          const oldRange = rect_1.selRange_(dom_ui_1.getSelected({}));
          dom_ui_1.selectNode_(clickEl);
          hudMsg = dom_utils_1.getSelection_() + "" || hudMsg || `<${clickEl.localName}>`;
          mode_find_1.execCommand("copy", utils_1.doc);
          dom_ui_1.resetSelectionToDocStart(dom_utils_1.getSelection_(), oldRange);
          link_hints_1.hintApi.h(20 /* kTip.copiedIs */ , 0, hudMsg);
        }
      });
    };
    const downloadOrOpenMedia = () => {
      const filename = dom_utils_1.attr_s(clickEl, kD) || dom_utils_1.attr_s(clickEl, "alt") || clickEl.title || "";
      let mediaTag = dom_utils_1.getMediaTag(tag);
      let srcObj = accessElAttr(0), src = srcObj[0];
      let text, n;
      mediaTag || (n = clickEl.naturalWidth) && n < 3 && (n = clickEl.naturalHeight) && n < 3 && (mediaTag = 4);
      text = srcObj[1] ? src : mediaTag < 3 /* kMediaTag.others */ ? src || dom_utils_1.getMediaUrl(clickEl, mediaTag < 2 /* kMediaTag.MIN_NOT_MEDIA_EL */) : tag ? "" : clickEl.outerHTML;
      if (mediaTag > 1 && tag && !utils_1.isImageUrl(text)) {
        let arr = utils_1.createRegExp(91 /* kTip.cssUrl */ , "i").exec(dom_utils_1.getComputedStyle_(clickEl).backgroundImage);
        text = arr && arr[1] ? arr[1].replace(/\\('|")/g, "$1") : text;
      }
      (!text || utils_1.isJSUrl(text) || src.length > text.length + 7 && text === clickEl.href) && (text = src);
      text ? link_hints_1.hintOptions.url ? copyText(text) : link_hints_1.mode1_ - 35 /* HintMode.DOWNLOAD_MEDIA */ || /** <svg> */ !tag ? tryDrawOnCanvas(0, {
        H: 26 /* kFgReq.openImage */ ,
        m: link_hints_1.hintMode_,
        o: utils_1.parseOpenPageUrlOptions(link_hints_1.hintOptions),
        a: link_hints_1.hintOptions.auto,
        f: filename,
        u: tag ? text && getUrlData(text) : text
      }) : downloadLink(text, filename) : (link_hints_1.hintApi.h(74 /* kTip.notImg */), 
      then = optElse);
    };
    const openTextOrUrl = (url, isText) => {
      url ? dom_ui_1.evalIfOK(url) || link_hints_1.hintApi.p({
        H: 8 /* kFgReq.openUrl */ ,
        u: url,
        m: link_hints_1.hintMode_,
        t: rawNewtab,
        o: utils_1.parseOpenPageUrlOptions(link_hints_1.hintOptions)
      }) : (link_hints_1.hintApi.h(isText ? 15 /* kTip.noTextCopied */ : 14 /* kTip.noUrlCopied */), 
      then = optElse);
    };
    const showUrlIfNeeded = () => {
      const anchor = link_hints_1.hintOptions.showUrl && dom_utils_1.findAnchor_(clickEl);
      const href = anchor && anchor.href;
      href && dom_utils_1.deepActiveEl_unsafe_() !== anchor && link_hints_1.hintApi.t({
        k: 1 /* kTip.raw */ ,
        t: href.slice(0, 256),
        l: 1
      });
    };
    const hoverEl = () => {
      const toggleMap = link_hints_1.hintOptions.toggle;
      // here not check lastHovered on purpose
      // so that "HOVER" -> any mouse events from users -> "HOVER" can still work
            scroller_1.setNewScrolling(clickEl);
      realClickEl ? defaultClick() : retPromise = async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.wrap_enable_bubbles(link_hints_1.hintOptions, async_dispatcher_1.hover_async, [ clickEl, rect_1.center_(rect, link_hints_1.hintOptions.xy), checkBoolOrSelector(rawFocus, !elType && clickEl.tabIndex >= 0 && !dom_utils_1.isIFrameElement(clickEl, 1)), !!rawFocus ]));
      retPromise = retPromise.then(() => {
        let rval, lval;
        scroller_1.set_cachedScrollable(scroller_1.currentScrolling);
        if (link_hints_1.mode1_ < 32 /* HintMode.min_job */) {
          // called from Modes[-1]
          link_hints_1.hintApi.h(75 /* kTip.hoverScrollable */);
          return;
        }
        link_hints_1.hintMode_ & 16 /* HintMode.queue */ || dom_utils_1.getEditableType_(realClickEl || clickEl) > 2 || keyboard_utils_1.whenNextIsEsc_(10 /* kHandler.unhoverOnEsc */ , 4 /* kModeId.Link */ , unhoverOnEsc_d);
        showUrlIfNeeded();
        if (!toggleMap || !utils_1.isTY(toggleMap, 1 /* kTY.obj */)) {
          return;
        }
        utils_1.safer(toggleMap);
        let ancestors = [], top = clickEl, re = /^-?\d+/;
        for (let key in toggleMap) {
          // if no Element::closest, go up by 6 levels and then query the selector
          let selector = key, prefix = re.exec(key), upper = prefix && prefix[0];
          upper && (selector = selector.slice(upper.length));
          let up = upper | 0, selected = null;
          selector = selector.trim();
          while (up && up + 1 >= ancestors.length && top) {
            ancestors.push(top);
            top = dom_utils_1.GetParent_unsafe_(top, 4 /* PNType.RevealSlotAndGotoParent */);
          }
          try {
            if (selector && (selected = up ? dom_utils_1.ElementProto_not_ff.querySelector.call(ancestors[utils_1.max_(0, utils_1.min_(up + 1, ancestors.length - 1))], selector) : clickEl.closest(selector))) {
              const toggleVal = toggleMap[key];
              if (dom_utils_1.isSafeEl_(selected)) {
                for (const toggle of toggleVal ? utils_1.isTY(toggleVal) ? toggleVal.split(/[ ,]/) : toggleVal : []) {
                  const s0 = toggle[0], remove = s0 === "-", add = s0 === "+" || !remove && null;
                  const idx = +add || +remove;
                  if (toggle[idx] === "[") {
                    const arr = toggle.slice(idx + 1, -1).split("="), rawAttr = arr[0], val = arr[1] || "", op = rawAttr.slice(-1), isOnlyIncluded = op === "*", isWord = op === "~" || isOnlyIncluded, attr = isWord ? rawAttr.slice(0, -1) : rawAttr, rawOld = dom_utils_1.attr_s(selected, attr), old = rawOld || "", valWord = isOnlyIncluded ? val : " " + val + " ", oldWords = isOnlyIncluded ? old : " " + old + " ";
                    attr && dom_utils_1.setOrRemoveAttr_s(selected, attr, isWord && old ? (oldWords.includes(valWord) ? add ? old : oldWords.replace(valWord, " ") : remove ? old : old + valWord).trim() : add || !remove && rawOld !== val ? val : null);
                  } else if (!idx && toggle[0] === "." && toggle.includes("=")) {
                    const opArr = /[:+*/-]?=/.exec(toggle), op = opArr[0][0], prop = toggle.slice(1, opArr.index), valStr = toggle.slice(opArr.index + opArr[0].length), tagType = (prop === "value" || prop === "selectedIndex") && dom_utils_1.editableTypes_[dom_utils_1.htmlTag_(selected)] || 0 /* EditableType.NotEditable */ , isTextElement = tagType && dom_utils_1.getEditableType_(selected) > 3 /* EditableType.MaxNotTextBox */ , newVal = op === "=" ? valStr : (rval = utils_1.safeCall(JSON.parse, valStr) || valStr, 
                    op === ":" ? rval : (lval = selected[prop], op === "+" ? lval + rval : op === "-" ? lval - rval : op === "*" ? lval * rval : lval / rval));
                    if (isTextElement && selected === insert_1.raw_insert_lock && utils_1.isTY(newVal)) {
                      selected.select();
                      mode_find_1.execCommand(mode_find_1.kInsertText, utils_1.doc, newVal);
                    } else {
                      selected[prop] = newVal;
                      if (tagType > 1) {
                        dom_utils_1.dispatchEvent_(selected, dom_utils_1.newEvent_(dom_utils_1.INP, 1, 0, 0, {
                          inputType: "insertReplacementText",
                          data: newVal + ""
                        }, isTextElement ? InputEvent : Event));
                        dom_utils_1.dispatchEvent_(selected, dom_utils_1.newEvent_("change", 1, 1));
                      }
                    }
                  } else if (toggle === ":active") {
                    scroller_1.setNewScrolling(selected);
                    scroller_1.set_cachedScrollable(scroller_1.currentScrolling);
                  } else if (toggle.startsWith(":sel") || toggle === ":extend") {
                    if (toggle[1] > "f" && !link_hints_1.hintOptions.$s || !dom_utils_1.rangeCount_(dom_utils_1.getSelection_())) {
                      dom_ui_1.selectNode_(selected);
                      link_hints_1.hintOptions.$s = 1;
                    } else {
                      dom_utils_1.getSelection_().extend(selected, selected.childNodes.length);
                    }
                  } else if (toggle[0] === "@") {
                    const arr2 = /^@(.*?)(:(\w+))?(=(.*))?$/.exec(toggle);
                    arr2 && arr2[1] && dom_utils_1.dispatchEvent_(selected, new (arr2[3] && window[arr2[3]] || CustomEvent)(arr2[1], arr2[5] && utils_1.safeCall(JSON.parse, arr2[5]) || {}));
                  } else {
                    let cls = toggle.slice(idx + (toggle[idx] === "."));
                    cls.trim() && dom_utils_1.toggleClass_s(selected, cls, add);
                  }
                }
              }
            }
          } catch (_a) {
            then = optElse;
          }
          if (selected && !toggleMap.many) {
            break;
          }
        }
      });
    };
    const extractTextContent = () => {
      let str = dom_utils_1.textContent_s(clickEl).trim();
      if (str) {
        const clone = clickEl.cloneNode(true);
        const children = dom_utils_1.querySelectorAll_unsafe_(utils_1.VTr(106 /* kTip.invisibleElements */), clone);
        children.forEach(dom_utils_1.removeEl_s);
        str = dom_utils_1.textContent_s(clone).trim() || str;
      }
      return str;
    };
    const copyText = str => {
      let childEl, files, isUrl = link_hints_1.mode1_ > 41 && link_hints_1.mode1_ < 65;
      if (str) {} else if (isUrl) {
        str = getUrlData();
      } else if (str = accessElAttr(2)[0].trim()) {} else {
        if (tag === dom_utils_1.INP) {
          const type = clickEl.type;
          if (type === "password") {
            then = optElse;
            return link_hints_1.hintApi.h(76 /* kTip.ignorePassword */);
          }
          dom_utils_1.uneditableInputs_[type] ? type === "file" ? str = (files = clickEl.files) && files.length > 0 ? files[0].name : "" : " button image submit reset ".includes(" " + type + " ") && (str = clickEl.value) : str = clickEl.value || clickEl.placeholder;
        } else {
          str = dom_utils_1.editableTypes_[tag] === 4 /* EditableType.TextArea */ ? clickEl.value : dom_utils_1.editableTypes_[tag] === 2 /* EditableType.Select */ ? clickEl.selectedIndex < 0 ? "" : clickEl.options[clickEl.selectedIndex].text : isHtmlImage ? clickEl.alt : tag && (clickEl.innerText.trim() || dom_utils_1.GetShadowRoot_(clickEl) && (childEl = dom_utils_1.querySelector_unsafe_("div,span", dom_utils_1.GetShadowRoot_(clickEl))) && dom_utils_1.htmlTag_(childEl) && childEl.innerText.trim()) || (str = extractTextContent()) && str.replace(/\s+/g, " ");
        }
        str = str && str.trim() || tag && clickEl.title.trim() || (clickEl.ariaLabel || "").trim();
      }
      link_hints_1.mode1_ - 38 /* HintMode.SEARCH_TEXT */ && str && /^mailto:./.test(str) && (str = str.slice(7).trim());
      if (link_hints_1.mode1_ > 63 && link_hints_1.mode1_ < 66) {
        link_hints_1.hintApi.p({
          H: 16 /* kFgReq.vomnibar */ ,
          u: str,
          f: then,
          m: link_hints_1.mode1_,
          t: rawNewtab,
          o: utils_1.parseOpenPageUrlOptions(link_hints_1.hintOptions)
        });
      } else if (richText) {
        tryDrawOnCanvas(str);
      } else if (str && link_hints_1.mode1_ !== 38 /* HintMode.SEARCH_TEXT */) {
        // then mode1 can only be HintMode.COPY_*
        let lastYanked = link_hints_1.mode1_ & 1 /* HintMode.list */ ? (link_hints_1.hintManager || link_hints_1.coreHints).y : 0;
        if (lastYanked && lastYanked.indexOf(str) >= 0) {
          link_hints_1.hintApi.h(77 /* kTip.noNewToCopy */);
        } else {
          lastYanked && lastYanked.push(str);
          link_hints_1.hintApi.p({
            H: 18 /* kFgReq.copy */ ,
            j: link_hints_1.hintOptions.join,
            o: utils_1.parseOpenPageUrlOptions(link_hints_1.hintOptions),
            m: link_hints_1.mode1_,
            d: isUrl,
            s: lastYanked || str,
            t: link_hints_1.hintOptions.trim
          });
        }
      } else {
        openTextOrUrl(str, !isUrl);
      }
    };
    const downloadLink = (url, filename) => {
      const newLink = link_hints_1.mode1_ < 44 /* HintMode.DOWNLOAD_LINK */ || tag !== "a", link = newLink ? dom_utils_1.createElement_("a") : clickEl, oldUrl = newLink || dom_utils_1.attr_s(link, "href"), changed = (url = url || getUrlData()) !== link.href;
      filename = filename || dom_utils_1.attr_s(clickEl, kD) || "";
      if (link_hints_1.hintOptions.download === "force" && !utils_1.urlSameIgnoringHash(url, utils_1.locHref())) {
        link_hints_1.hintApi.p({
          H: 36 /* kFgReq.downloadLink */ ,
          u: url,
          f: filename,
          r: 0,
          m: link_hints_1.mode1_,
          o: utils_1.parseOpenPageUrlOptions(link_hints_1.hintOptions)
        });
        return;
      }
      if (changed) {
        link.href = url;
        newLink && dom_utils_1.appendNode_s(dom_utils_1.scrollingEl_(1) || dom_ui_1.ui_box, link);
      }
      const hadDownload = link.hasAttribute(kD);
      hadDownload || (link[kD] = filename);
      link_hints_1.hintApi.p({
        H: 41 /* kFgReq.showUrl */ ,
        u: url
      });
      retPromise = async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.click_async(link, rect, 0, [ true, false, false, false ])).then(() => {
        hadDownload || dom_utils_1.setOrRemoveAttr_s(link, kD);
        newLink ? dom_utils_1.removeEl_s(link) : changed && dom_utils_1.setOrRemoveAttr_s(link, "href", oldUrl);
      });
    };
    const defaultClick = () => {
      const mask = link_hints_1.hintMode_ & 3 /* HintMode.mask_focus_new */;
      const isMac = !utils_1.os_;
      const rawBtn = link_hints_1.hintOptions.button, isRight = rawBtn === 2;
      const dblClick = !!link_hints_1.hintOptions.dblclick && !isRight;
      const newTabStr = rawNewtab + "";
      const otherActions = isRight || dblClick;
      const newWindow = newTabStr === "window" && !otherActions;
      const newTab = mask > 1 && !newWindow && !otherActions;
      const autoUnhover = link_hints_1.hintOptions.autoUnhover, doesUnhoverOnEsc = (autoUnhover + "")[0] === "<";
      const isQueue = link_hints_1.hintMode_ & 16 /* HintMode.queue */;
      const cnsForWin = link_hints_1.hintOptions.ctrlShiftForWindow;
      const target = realClickEl || clickEl, targetTag = dom_utils_1.htmlTag_(target);
      const isSel = dom_utils_1.editableTypes_[targetTag] === 2 /* EditableType.Select */;
      const notLabelInFormOnFF = true;
      const ctrl = notLabelInFormOnFF && (newTab && !(mask > 2 && cnsForWin) || newWindow && !!cnsForWin);
      const shift = notLabelInFormOnFF && (newWindow || newTab && mask > 2 === !link_hints_1.hintOptions.activeOnCtrl);
      const rawInteractive = link_hints_1.hintOptions.interact;
      const interactive = isSel || dom_utils_1.getMediaTag(targetTag) === 1 /* kMediaTag.otherMedias */ && !isRight && (rawInteractive !== "native" || target.controls);
      const doInteract = interactive && !isSel && rawInteractive !== false;
      const rawAction = utils_1.findOptByHost(link_hints_1.hintOptions.action2, target, 3 /* kNextTarget.nonCss */) | 0;
      const specialActions = rawAction >= 0 ? rawAction : dblClick || doInteract ? +dblClick + 8 /* kClickAction.BaseMayInteract */ + 2 /* kClickAction.FlagInteract */ * doInteract : isRight || newTabStr.startsWith("no-pr") ? 0 /* kClickAction.none */ : newWindow ? 3 /* kClickAction.plainInNewWindow */ : newTabStr === "force-current" ? 6 /* kClickAction.forceToOpenInCurrent */ : newTabStr === "force-mode" ? newTab ? 5 /* kClickAction.forceInNewTab */ : 6 /* kClickAction.forceToOpenInCurrent */ : newTabStr === "force" ? 5 /* kClickAction.forceInNewTab */ : newTabStr === kLW ? 4 /* kClickAction.forceToOpenInLastWnd */ : 0 /* kClickAction.none */;
      const doesUnhoverAtOnce = !doesUnhoverOnEsc &&  checkBoolOrSelector(autoUnhover, false);
      retPromise = async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.click_async(target, target === clickEl ? rect : dom_ui_1.getRect(target), !!target.focus &&  checkBoolOrSelector(rawFocus, mask > 0 || interactive || target.tabIndex >= 0), [ false, !isMac && ctrl, isMac && ctrl, shift ], specialActions, rawBtn || 0 /* kClickButton.none */ , otherActions || newTab || newWindow ? 0 : link_hints_1.hintOptions.touch, link_hints_1.hintOptions.pointer, target !== clickEl)).then(ret => {
        showUrlIfNeeded();
        newTabStr === "inactive" && port_1.post_({
          H: 49
 /* kFgReq.focusCurTab */        });
 // not use ports of a parent frame
                return !doesUnhoverAtOnce || interactive && !utils_1.isTY(autoUnhover) ? isQueue || dom_utils_1.getEditableType_(target) || (ret || doesUnhoverOnEsc) && keyboard_utils_1.whenNextIsEsc_(10 /* kHandler.unhoverOnEsc */ , 4 /* kModeId.Link */ , unhoverOnEsc_d) : async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.unhover_async());
      });
    };
    const checkBoolOrSelector = (userVal, defaultVal) => userVal == null ? defaultVal : !!userVal && (!utils_1.isTY(userVal) || (userVal = dom_utils_1.findSelectorByHost(userVal, clickEl), 
    userVal != null ? dom_utils_1.testMatch(userVal, clickEl) : defaultVal));
    const doPostAction = () => {
      (link_hints_1.mode1_ < 64 /* HintMode.min_then_as_arg */ || link_hints_1.mode1_ > 66 /* HintMode.max_then_as_arg */) && then && (then = dom_utils_1.findSelectorByHost(then, clickEl, 3 /* kNextTarget.nonCss */)) && utils_1.isTY(then) && port_1.post_({
        H: 20 /* kFgReq.nextKey */ ,
        k: then
      });
      removeFlash || showRect && rect && dom_ui_1.flash_(null, rect);
      return rect;
    };
    const masterOrA = link_hints_1.hintManager || link_hints_1.coreHints, keyStatus = masterOrA.$().k;
    let clickEl = hint.d;
    let tag, elType, isHtmlImage;
    const kD = "download", kLW = "last-window";
    let richText = link_hints_1.hintOptions.richText, rawNewtab = link_hints_1.hintOptions.newtab, rawFocus = link_hints_1.hintOptions.focus;
    let rect = null;
    let then = link_hints_1.hintOptions.then, optElse = link_hints_1.hintOptions.else;
    let realClickEl;
    let retPromise;
    let showRect = link_hints_1.hintOptions.flash !== false ? 1 : 0;
    if (link_hints_1.hintManager) {
      utils_1.set_keydownEvents_(link_hints_1.hintApi.a());
      link_hints_1.setMode(masterOrA.$().m, 1);
    }
    if (event) {
      keyboard_utils_1.prevent_(event.e);
      keyboard_utils_1.consumeKey_mac(event.i, event.e);
    }
    masterOrA.v();
 // here .keyStatus_ is reset
        insert_1.set_grabBackFocus(false);
    if (dom_utils_1.IsAInB_(clickEl)) {
      rect_1.getZoom_(clickEl);
      rect_1.prepareCrop_();
      rect_1.WithOldZoom && rect_1.bZoom_ !== 1 && utils_1.doc.body && !dom_utils_1.IsAInB_(clickEl, utils_1.doc.body) && rect_1.set_bZoom_(1);
      clickEl = findNextTargetEl(link_hints_1.hintOptions.autoParent, 0 /* kNextTarget.parent */) || clickEl;
      clickEl = findNextTargetEl(link_hints_1.hintOptions.autoChild, 1 /* kNextTarget.child */) || clickEl;
      realClickEl = link_hints_1.mode1_ < 34 && findNextTargetEl(link_hints_1.hintOptions.doClickOn, 2 /* kNextTarget.realClick */);
      tag = dom_utils_1.htmlTag_(clickEl), elType = dom_utils_1.getEditableType_(clickEl), 
      isHtmlImage = tag === "img";
      local_links_1.initTestRegExps();
 // needed by getPreferredRectOfAnchor
      // must get outline first, because clickEl may hide itself when activated
      // must use UI.getRect, so that zooms are updated, and prepareCrop is called
            rect = knownRect || dom_ui_1.getRect(clickEl, hint.r !== hint.d ? hint.r : null);
      if (hint.m && keyStatus.t && !keyStatus.k && !keyStatus.n) {
        exports.removeFlash = removeFlash = rect && dom_ui_1.flash_(null, rect, -1);
        masterOrA.j(link_hints_1.coreHints, hint, rect && dom_ui_1.lastFlashEl);
        return null;
      }
      link_hints_1.hintManager && focus();
      // tolerate new rects in some cases
            if (hint.m && dom_utils_1.isIFrameElement(clickEl, 1)) {
        link_hints_1.hintOptions.m = link_hints_1.hintMode_;
        (link_hints_1.hintManager || link_hints_1.coreHints).$(1);
        showRect = 0;
        if (clickEl === omni_1.omni_box) {
          dom_ui_1.focusIframeContentWnd_(clickEl);
        } else if (dom_utils_1.focus_(clickEl), dom_utils_1.isIFrameElement(clickEl)) {
          // focus first, so that childApi is up-to-date (in case <iframe> was removed on focus)
          const childApi = link_hints_1.detectUsableChild(clickEl);
          childApi ? childApi.f(2 /* kFgCmd.linkHints */ , link_hints_1.hintOptions, link_hints_1.hintCount_, 1) : port_1.post_({
            H: 13 /* kFgReq.execInChild */ ,
            c: showRect = 2 /* kFgCmd.linkHints */ ,
            u: clickEl.src,
            n: link_hints_1.hintCount_,
            k: event ? event.i : 0 /* kKeyCode.None */ ,
            a: link_hints_1.hintOptions
          });
        }
      } else if (link_hints_1.mode1_ < 32 /* HintMode.min_job */ || link_hints_1.mode1_ === 67 /* HintMode.FOCUS_EDITABLE */) {
        if (hint.r === hint.d || realClickEl) {
          hoverEl();
        } else if (tag === "details") {
          const summary = dom_utils_1.queryHTMLChild_(clickEl, "summary");
          if (summary) {
            // `HTMLSummaryElement::DefaultEventHandler(event)` in
            // https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/html_summary_element.cc?l=109
            rect = clickEl.open || !rect ? rect_1.getVisibleClientRect_(summary) : rect;
            retPromise = async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.click_async(summary, rect, 1));
          } else {
            clickEl.open = !clickEl.open;
          }
        } else if (elType > 2 /* EditableType.MaxNotEditableElement */) {
          retPromise = async_dispatcher_1.select_(clickEl, rect, !removeFlash);
          showRect = 0;
        } else {
           defaultClick();
        }
      } else if (link_hints_1.forHover_) {
        link_hints_1.mode1_ & 1 ? retPromise = async_dispatcher_1.catchAsyncErrorSilently(async_dispatcher_1.wrap_enable_bubbles(link_hints_1.hintOptions, async_dispatcher_1.unhover_async, [ realClickEl || clickEl ])) : hoverEl();
      } else if (link_hints_1.mode1_ < 35) {
        rect_1.view_(clickEl);
        scroller_1.setNewScrolling(clickEl);
        dom_utils_1.focus_(clickEl);
        scroller_1.set_cachedScrollable(scroller_1.currentScrolling);
        showUrlIfNeeded();
        removeFlash || showRect && dom_ui_1.flash_(clickEl, tag === "a" || hint.r ? rect : null);
        showRect = 0;
      } else if (link_hints_1.mode1_ < 38) {
        downloadOrOpenMedia();
      } else if (link_hints_1.mode1_ < 44) {
        copyText();
      } else if (link_hints_1.mode1_ < 45) {
        downloadLink();
      } else if (link_hints_1.mode1_ < 64 /* HintMode.EDIT_LINK_URL */) {
        openTextOrUrl(getUrlData());
      } else if (link_hints_1.mode1_ < 66) {
        copyText();
      } else {
        // HintMode.ENTER_VISUAL_MODE
        dom_ui_1.selectAllOfNode(clickEl);
        const sel = dom_utils_1.getSelection_(), caret = link_hints_1.hintOptions.caret;
        dom_ui_1.collpaseSelection(sel, 0 /* VisualModeNS.kDir.left */ , 1);
        dom_utils_1.modifySel(sel, 1, 1, caret ? dom_utils_1.kGCh : "word");
        link_hints_1.hintOptions.visual === false || port_1.post_({
          H: 34 /* kFgReq.visualMode */ ,
          c: caret,
          f: then
        });
      }
      showRect && (rect || (rect = rect_1.getVisibleClientRect_(clickEl)));
    } else {
      link_hints_1.hintApi.h(73 /* kTip.linkRemoved */ , 2);
      then = optElse;
    }
    return retPromise ? retPromise.then(doPostAction) : Promise.resolve(doPostAction());
  };
  exports.executeHintInOfficer = executeHintInOfficer;
});
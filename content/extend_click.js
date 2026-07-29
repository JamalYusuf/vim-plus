"use strict";
__filename = "content/extend_click.js";
define([ "require", "exports", "../lib/utils", "../lib/dom_utils", "./port", "./link_hints", "./insert" ], function(require, exports, utils_1, dom_utils_1, port_1, link_hints_1, insert_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ec_main_not_ff = void 0;
  exports.ec_main_not_ff = () => {
    (function extendClick(isFirstTime) {
      const kInjectManually = false /* BrowserVer.MinRegisterContentScriptsWorldInMV3 */;
      const kSA = "data-vimium" /* InnerConsts.kSecretAttr */;
      const kVOnClick1 = "VimiumPlusClickable" /* InnerConsts.kVOnClick */ , outKMK = "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */;
      const secret = kInjectManually ? (utils_1.math.random() * 9e7 /* GlobalConsts.SecretRange */ + 1e7 /* GlobalConsts.SecretBase */ | 0) + "" : "";
      const onClick = function(event2) {
        const isSafe = this === box, rawDetail = event2.detail, detail = isSafe && rawDetail && utils_1.isTY(rawDetail, 1 /* kTY.obj */) ? rawDetail : 0, fromAttrs = detail && detail[1] + 1;
        let reHint, mismatch, docChildren, boxChildren, target = detail ? null : isSafe || !kInjectManually && box == null ? event2.relatedTarget : dom_utils_1.getEventPath(event2)[0];
        utils_1.Stop_(event2);
        if (!box) {
          if (!kInjectManually && utils_1.readyState_ > "l" && target && dom_utils_1.htmlTag_(target)) {
            if (dom_utils_1.attr_s(target, kSA) === "2021831" /* Build.RandomClick */) {
              box = target;
              readyTimeout = utils_1.timeout_(initOnDocReady, 1e3 /* InnerConsts.DelayToWaitDomReady */);
              dom_utils_1.OnDocLoaded_(initOnDocReady);
              dom_utils_1.setOrRemoveAttr_s(target, kSA, "");
              utils_1.vApi.e = execute;
            } else {
              execute(6 /* kContentCmd.Destroy */);
            }
          }
          return;
        }
        let tickDoc = 0, tickBox = 0;
        if (detail) {
          for (const index of detail[0]) {
            if (index === -4 /* InnerConsts.SignalDocWrite */ || index === -3 /* InnerConsts.SignalDocOpen */) {
              if (utils_1.isEnabled_ || !utils_1.fgCache) {
                port_1.hookOnWnd(0 /* HookAction.Install */);
                utils_1.setupEventListener(0, kVOnClick1, onClick);
                insert_1.insertInit();
                utils_1.timeout_(dom_utils_1.onReadyState_, 18);
                reHookTimes++ || console.log("Vim+: auto re-init after `document.%s()` on %o at %o.", index === -3 /* InnerConsts.SignalDocOpen */ ? "open" : "write", detail[2].replace(/^.*(\/[^\/]+\/?)$/, "$1"), utils_1.getTime());
              }
            } else {
              let isBox = index < -3 /* InnerConsts.SignalDocOpen */;
              let list = isBox ? boxChildren : docChildren;
              if (!list) {
                list = (isBox ? box : utils_1.doc).getElementsByTagName("*");
                isBox ? boxChildren = list : docChildren = list;
              }
              const el = list[isBox ? -8 /* InnerConsts.OffsetForBoxChildren */ - index : index];
              el && utils_1.clickable_.add(el);
              isBox ? tickBox++ : tickDoc++;
            }
          }
        } else {
          target && (isSafe && !rawDetail || (kInjectManually ? +secret : 2021831 /* Build.RandomClick */) % 1e4 /* InnerConsts.kModToExposeSecret */ + target.tagName === rawDetail) ? utils_1.clickable_.add(target) : mismatch = 1;
        }
        box.textContent = "";
        if (mismatch) {
          !target || isSafe || !kInjectManually && target === window || console.error("extend click: unexpected: detail =", rawDetail, target);
          return;
        }
        (!detail || tickDoc || tickBox) && (++counterResolvePath <= 32 || Math.floor(Math.log(counterResolvePath) / Math.log(1.414)) !== Math.floor(Math.log(counterResolvePath - 1) / Math.log(1.414))) && console.log(`Vim+: extend click: resolve ${detail ? "[%o + %o]" : "%o%s"} in %o @t=%o .`, detail ? tickDoc : target && (utils_1.isTY(target.localName) ? `<${target.localName}>` : target + ""), detail ? detail[1] ? -0 : tickBox : event2.relatedTarget ? " (detached)" : this === window ? " (path on window)" : " (path on box)", utils_1.loc_.pathname.replace(/^.*(\/[^\/;]+\/?)(;[^\/]+)?$/, "$1"), utils_1.getTime() % 36e5);
        if (isFirstResolve & fromAttrs) {
          isFirstResolve ^= fromAttrs;
          link_hints_1.coreHints.h < 0 && link_hints_1.doesWantToReloadLinkHints("lo") && (reHint = 50 /* GlobalConsts.MinCancelableInBackupTimer */);
        }
        link_hints_1.coreHints.h > 0 && !reHint && link_hints_1.hintOptions.autoReload && link_hints_1.doesWantToReloadLinkHints("de") && (reHint = utils_1.abs_(utils_1.getTime() - link_hints_1.coreHints.h) < 866 ? 53 : 0);
        reHint && link_hints_1.reinitLinkHintsIn(reHint);
      };
      const dispatchCmd = (cmd, element) => {
        const msg = (kInjectManually ? +secret : 2021831 /* Build.RandomClick */) << 3 /* kContentCmd.MaskedBitNumber */ | cmd;
        // Not use CustomEvent.detail, because it's a getter property since BrowserVer.Min$CustomEvent$$detail$getter
                dom_utils_1.setOrRemoveAttr_s(box, kSA, "" + msg);
        dom_utils_1.dispatchEvent_(box, new FocusEvent("VC" /* InnerConsts.kCmd */ , {
          relatedTarget: element
        }));
        dom_utils_1.setOrRemoveAttr_s(box, kSA, "");
      };
      const execute = (cmd, element) => {
        if (cmd < 4 /* kContentCmd._minSuppressClickable */) {
          cmd - 2 /* kContentCmd.ManuallyReportKnownAtOnce */ || (isFirstResolve = 0);
          dispatchCmd(cmd, element);
          return;
        }
        /** this function should keep idempotent */        utils_1.setupEventListener(0, kVOnClick1, onClick, 1);
        if (box) {
          utils_1.setupEventListener(box, kVOnClick1, onClick, 1);
          dispatchCmd(6 /* kContentCmd.Destroy */);
        }
        box = utils_1.vApi.e = script = null;
      };
      const initOnDocReady = () => {
        utils_1.clearTimeout_(readyTimeout);
        if (!box) {
          return;
        }
        if (kInjectManually) {
          if (!script) {
            return;
          }
          dom_utils_1.appendNode_s(script, box);
          dom_utils_1.dispatchEvent_(script, new Event(outKMK + 2021831 /* Build.RandomClick */));
          if (dom_utils_1.parentNode_unsafe_s(box)) {
            // normally, if here, must have: limited by CSP; not C or C >= MinEnsuredNewScriptsFromExtensionOnSandboxedPage
            // ignore the rare (unexpected) case that injected code breaks even when not limited by CSP,
            execute(5 /* kContentCmd.SuppressClickable */);
            dom_utils_1.runJS_("`${" + outKMK + "=>" + secret + "}`");
            return;
          }
          script = null;
          dom_utils_1.removeEl_s(box);
        }
        utils_1.setupEventListener(box, kVOnClick1, onClick);
        utils_1.isTop && dom_utils_1.OnDocLoaded_(utils_1.timeout_.bind(null, () => {
          isFirstResolve = 0;
        }, 600 /* GlobalConsts.ExtendClick_EndTimeOfAutoReloadLinkHints */), 1);
      };
      let script, box, readyTimeout, counterResolvePath = 0, reHookTimes = 0, isFirstResolve = utils_1.isTop ? 3 : 0;
      if (isFirstTime && utils_1.readyState_ === "complete") {
        alert("Vim+: Error! should not run extend_click twice");
        return;
      }
      /**
             * Note:
             *   should not create HTML/SVG elements before document gets ready,
             *   otherwise the default XML parser will not enter a "xml_viewer_mode"
             * Stack trace:
             * * https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/xml/parser/xml_document_parser.cc?q=XMLDocumentParser::end&l=390
             * * https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/xml/parser/xml_document_parser.cc?q=XMLDocumentParser::DoEnd&l=1543
             * * https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/xml/parser/xml_document_parser.cc?g=0&q=HasNoStyleInformation&l=106
             * * https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/dom/document.cc?g=0&q=Document::CreateRawElement&l=946
             * Vimium issue: https://github.com/philc/vimium/pull/1797#issuecomment-135761835
             */      script = dom_utils_1.createElement_(kInjectManually ? "script" : "p");
      if (script.lang == null || kInjectManually && !utils_1.isAlive_) {
        dom_utils_1.set_createElement_(utils_1.doc.createElementNS.bind(utils_1.doc, utils_1.VTr(200 /* kTip.XHTML */)));
        kInjectManually && isFirstTime != null && dom_utils_1.OnDocLoaded_(extendClick);
 // retry after a while, using a real <script>
                return;
      }
      if (!kInjectManually) {
        if (insert_1.grabBackFocus) {
          utils_1.setupEventListener(0, kVOnClick1, onClick);
          dom_utils_1.OnDocLoaded_(() => {
            box || execute(6 /* kContentCmd.Destroy */);
          });
        }
        return;
      }
      let injected = !isFirstTime && utils_1.VTr(89 /* kTip.removeEventScript */) || "'use strict';(" + function VC() {
        const V = /** verifier */ maybeSecret => {
          I = "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */ === maybeSecret;
        }, MayEdge = false /* BrowserType.Edge */ , MayNotEdge = true /* BrowserType.Firefox */ , EnsuredGetRootNode = true /* BrowserVer.Min$Node$$getRootNode */ , MayNoSetProto = false /* BrowserVer.Min$Object$$setPrototypeOf */ , doc0 = document, SetProp = MayNoSetProto ? null : Object.setPrototypeOf, kAEL = "addEventListener", kToS = "toString", kProto = "prototype", kByTag = "getElementsByTagName", ETP = EventTarget[kProto], _listen = ETP[kAEL], toRegister = [], _call = _listen.call, apply = Reflect.apply, call = _call.bind(_call), _dispatch = ETP.dispatchEvent, HtmlElProto = HTMLElement[kProto], ElCls = Element, ElProto = ElCls[kProto], Append = ElProto.append, GetAttr = ElProto.getAttribute, Remove = ElProto.remove, getElementsByTagNameInEP = ElProto[kByTag], nodeIndexList = [], Slice = nodeIndexList.slice, IndexOf = _call.bind(nodeIndexList.indexOf), forEach = nodeIndexList.forEach, splice = nodeIndexList.splice, pushInDocument = nodeIndexList.push.bind(nodeIndexList), CECls = CustomEvent, StopProp = CECls[kProto].stopImmediatePropagation, DECls = FocusEvent, FProto = Function[kProto], _toString = FProto[kToS], clearTimeout1 = clearTimeout, DocCls = Document[kProto], getElementsByTagNameInDoc = DocCls[kByTag], _docOpen = DocCls.open, _docWrite = DocCls.write, relatedTargetGetter = 0, kOC = "VimiumPlusClickable" /* InnerConsts.kVOnClick */ , kRC = 2021831 /* Build.RandomClick */ , kEventName2 = kOC + kRC, kFn = "function", StringSplit = "".split, StringSlice = kEventName2.slice, checkIsNotVerifier = func => {
          verifierPrefixLen || (verifierLen = (verifierStrPrefix = call(_toString, V)).length, 
          verifierPrefixLen = (verifierStrPrefix = call(StringSplit, verifierStrPrefix, sec)[0]).length);
          func && func(call(StringSlice, call(_toString, func), verifierPrefixLen - 13 /* GlobalConsts.LengthOfMarkAcrossJSWorlds */
          /** `16` is for {@see #BrowserVer.MinEnsured$Function$$toString$preservesWhitespace} */ , verifierPrefixLen - 13 /* GlobalConsts.LengthOfMarkAcrossJSWorlds */ + 21 /* GlobalConsts.SecretStringLength */));
        }, enqueue = (a, listener) => {
          if (typeof listener === "function" && a.localName !== "a") {
            pushToRegister(a);
            timer = timer || (queueMicroTask_(delayToStartIteration), 1);
          }
        }, hooks = {
          toString: function toString() {
            const a = this, args = arguments, hookedInd = IndexOf(hookedFuncs, a);
            const str = apply(_toString, hookedInd < 0 ? a : hookedFuncs[hookedInd - 1], args);
            const mayStrBeToStr = str !== (myAELStr || (myToStrStr = call(_toString, myToStr), 
            verifierLen = (verifierStrPrefix = call(_toString, V)).length, verifierPrefixLen = (verifierStrPrefix = call(StringSplit, verifierStrPrefix, sec)[0]).length, 
            myAELStr = call(_toString, myAEL)));
            args.length === 2 && args[0] === "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */ && checkIsNotVerifier(args[1]);
            detectDisabled && str === detectDisabled && executeCmd();
            return mayStrBeToStr && str !== myToStrStr ? str.length !== verifierLen || call(StringSlice, str, 0, verifierPrefixLen) !== verifierStrPrefix ? str : call(_toString, noop) : (I = 0, 
            mayStrBeToStr ? call(a, noop, kMk, V) : a(kMk, noop, 0, V), I ? call(_toString, mayStrBeToStr ? _toString : _listen) : str);
          },
          addEventListener: function addEventListener(type, listener) {
            const a = this, args = arguments;
            const ret = args.length === 4 && type === "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */ ? checkIsNotVerifier(args[3]) : apply(_listen, a, args);
            (type === "click" || type === "mousedown" || type === "pointerdown" || type === "dblclick" ? a instanceof ElCls && a !== toRegister[toRegister.length - 1] : type === kEventName2 && !isReRegistering && a && !a.window && a.nodeType === 1 /* kNode.ELEMENT_NODE */) && enqueue(a, listener);
            return ret;
          },
          open: function open() {
            return docOpenHook(0, this, arguments);
          },
          write: function write() {
            return docOpenHook(1, this, arguments);
          },
          "set onclick"(val) {
            call(hookedFuncs[0], this, val);
            val && enqueue(this, val);
          },
          "set onmousedown"(v) {
            call(hookedFuncs[2], this, v);
            v && enqueue(this, v);
          }
        }, myAEL =  hooks[kAEL], myToStr =  hooks[kToS], myDocOpen =  hooks.open, myDocWrite =  hooks.write, hookedFuncs = [ 0, 0, 0, 0, _listen, myAEL, _toString, myToStr, _docOpen, myDocOpen, _docWrite, myDocWrite ];
        let myAELStr, myToStrStr, verifierStrPrefix, verifierPrefixLen, verifierLen, 
        /** verifierIsLastMatched */ I, root = event.target, timer = 1, sec = root.dataset.vimium, 
        /** kMarkToVerify */ kMk = "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */ , detectDisabled = kMk + "=>" + sec, getRootNode = EnsuredGetRootNode ? _call.bind(ElProto.getRootNode) : ElProto.getRootNode, contains = EnsuredGetRootNode || getRootNode ? null : ElProto.contains.bind(doc0), // in fact, it is Node::contains
        kGetComposedRoot = {
          __proto__: null,
          composed: true
        }, 
        // here `setTimeout` is normal and will not use TimerType.fake
        setTimeout_ = setTimeout, unsafeDispatchCounter = 0, allNodesInDocument = null, allNodesForDetached = null, pushToRegister = nodeIndexList.push.bind(toRegister), queueMicroTask_ = MayEdge ? MayNotEdge ? window.queueMicrotask : 0 : queueMicrotask, isReRegistering = 4;
        // To avoid a host script detect Vimum C by code like:
        // ` a1 = setTimeout(()=>{}); $0.addEventListener('click', ()=>{}); a2=setTimeout(()=>{}); [a1, a2] `
                const delayToStartIteration = () => {
          timer = setTimeout_(next, 666 /* GlobalConsts.ExtendClick_DelayToStartIteration */);
        };
        const next = () => {
          const len = toRegister.length, start = len > 1024 /* InnerConsts.MaxElementsInOneTickDebug */ ? len - 1024 /* InnerConsts.MaxElementsInOneTickDebug */ : 0;
          timer = start && setTimeout_(next, 36 /* InnerConsts.DelayForNext */);
          if (!len) {
            return;
          }
          call(Remove, root);
 // just safer
          // skip some nodes if only crashing, so that there would be less crash logs in console
                    unsafeDispatchCounter = 0;
          apply(forEach, apply(splice, toRegister, [ start, len - start ]), [ prepareRegister ]);
          doRegister(0);
        };
        const safeDispatch_ = (cls, data, target) => {
          apply(_dispatch, target || root, [ new cls(kOC, MayNoSetProto ? data : SetProp(data, null)) ]);
        };
        const prepareRegister = element => {
          if (EnsuredGetRootNode || getRootNode ? getRootNode(element) === doc0 : contains(element)) {
            pushInDocument(IndexOf(allNodesInDocument = allNodesInDocument || call(Slice, call(getElementsByTagNameInDoc, doc0, "*")), element));
            return;
          }
          // here element is inside a #shadow-root or not connected
                    const doc1 = element.ownerDocument;
          // in case element is <form> / <frameset> / adopted into another document, or aEL is from another frame
                    if (doc1 !== doc0) {
            doc1.nodeType === 9 /* kNode.DOCUMENT_NODE */ && doc1.defaultView && 
            // just smell like a Document
            
            safeReRegister(element, doc1);
 // `defaultView` is to check whether element is in a DOM tree of a real frame
            // Note: on C72, ownerDocument of elements under <template>.content
            // is a fake "about:blank" document object
                        return;
          }
          let parent, tempParent;
          if (EnsuredGetRootNode || getRootNode) {
            parent = getRootNode(element);
          } else {
            // according to tests and source code, the named getter for <frameset> requires <frame>.contentDocument is valid
            // so here pe and pn will not be Window if only ignoring the case of `<div> -> #shadow-root -> <frameset>`
            let kValue = "value", curEl = element;
            for (;parent = curEl.parentNode, tempParent = curEl.parentElement; curEl = tempParent) {
              // here skips more cases than an "almost precise" solution, but it is enough
              if (tempParent !== parent && kValue in tempParent) {
                if (!parent || parent.nodeType !== 1 /* kNode.ELEMENT_NODE */) {
                  break;
                }
                if (kValue in parent) {
                  return;
                }
                tempParent = parent;
              }
            }
            parent = parent || curEl;
          }
          // Document::nodeType is not changable (except overridden by an element like <img>), so the comparsion below is safe
                    let s, type = parent.nodeType;
          // note: the below may change DOM trees,
          // so `dispatch` MUST NEVER throw. Otherwise a page might break
                    if (type === 1 /* kNode.ELEMENT_NODE */) {
            parent !== root && call(Append, root, parent);
            pushInDocument(-8 /* InnerConsts.OffsetForBoxChildren */ - IndexOf(allNodesForDetached = allNodesForDetached || call(Slice, call(getElementsByTagNameInEP, root, "*")), element));
            // Note: ignore the case that a plain #document-fragment has a fake .host
                    } else if (type !== 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) {} else if (unsafeDispatchCounter < 10) {
            if (MayNotEdge && (tempParent = parent.host)) {
              parent = (EnsuredGetRootNode || getRootNode) && tempParent.shadowRoot && getRootNode(element, kGetComposedRoot);
              if (parent && (parent === doc0 || parent.nodeType === 1 /* kNode.ELEMENT_NODE */) && typeof (s = element.tagName) === "string") {
                parent !== doc0 && parent !== root && call(Append, root, parent);
                unsafeDispatchCounter++;
                safeDispatch_(CECls, MayNoSetProto ? {
                  detail: +sec % 1e4 /* InnerConsts.kModToExposeSecret */ + s,
                  composed: true,
                  __proto__: null
                } : {
                  detail: +sec % 1e4 /* InnerConsts.kModToExposeSecret */ + s,
                  composed: true
                }, element);
              }
            } else {
              unsafeDispatchCounter++;
              safeDispatch_(DECls, MayNoSetProto ? {
                relatedTarget: element,
                __proto__: null
              } : {
                relatedTarget: element
              });
            }
          } else {
            pushToRegister(element);
            if (unsafeDispatchCounter < 13) {
              unsafeDispatchCounter = 13;
 // a fake value to run it only once a tick
                            clearTimeout1(timer);
              timer = setTimeout_(next, 1 /* InnerConsts.DelayForNextComplicatedCase */);
            }
          }
        };
        const doRegister = fromAttrs => {
          if (nodeIndexList.length) {
            unsafeDispatchCounter++;
            safeDispatch_(CECls, MayNoSetProto ? {
              detail: [ nodeIndexList, fromAttrs ],
              __proto__: null
            } : {
              detail: [ nodeIndexList, fromAttrs ]
            });
            nodeIndexList.length = 0;
          }
          allNodesInDocument = allNodesForDetached = null;
        };
        const safeReRegister = (element, doc1) => {
          const localAEL = doc1[kAEL], localREL = doc1.removeEventListener;
          if (typeof localAEL == kFn && typeof localREL == kFn && localAEL !== myAEL) {
            isReRegistering = 1;
            try {
              // Note: here may break in case .addEventListener is an <embed> or overridden by host code
              call(localAEL, element, kEventName2, noop);
            } catch (_a) {}
            try {
              call(localREL, element, kEventName2, noop);
            } catch (_b) {}
            isReRegistering = 0;
          }
        };
        const executeCmd = eventOrDestroy => {
          const detail = eventOrDestroy && root && +call(GetAttr, root, "data-vimium" /* InnerConsts.kSecretAttr */), cmd = detail ? detail >> 3 /* kContentCmd.MaskedBitNumber */ === +sec ? detail & 7 : 0 /* kContentCmd._fake */ : eventOrDestroy ? 0 /* kContentCmd._fake */ : 6 /* kContentCmd.Destroy */;
          // always stopProp even if the secret does not match, so that an attacker can not detect secret by enumerating numbers
                    detail && call(StopProp, eventOrDestroy);
          if (cmd < 4 /* kContentCmd._minSuppressClickable */) {
            cmd > 2 ? call(relatedTargetGetter, eventOrDestroy).showPicker() : next(clearTimeout1(timer));
            return;
          }
          root = toRegister.length = detectDisabled = 0;
          pushToRegister = setTimeout_ = noop;
          timer = 1;
        };
        const docOpenHook = (isWrite, self, args) => {
          const first = doc0.readyState < "l" && (isWrite || args.length < 3) && self === doc0;
          const oriHref = first ? dbgLoc.host && dbgLoc.pathname || dbgLoc.href : "";
          const ret = apply(isWrite ? _docWrite : _docOpen, self, args);
          first && root && safeDispatch_(CECls, MayNoSetProto ? {
            detail: [ [ isWrite ? -4 /* InnerConsts.SignalDocWrite */ : -3 /* InnerConsts.SignalDocOpen */ ], 0, oriHref ],
            __proto__: null
          } : {
            detail: [ [ isWrite ? -4 /* InnerConsts.SignalDocWrite */ : -3 /* InnerConsts.SignalDocOpen */ ], 0, oriHref ]
          });
          return ret;
        };
        const dbgLoc = location;
        const noop = () => 1;
        if (!MayNotEdge || MayEdge && typeof queueMicroTask_ !== kFn) {
          queueMicroTask_ = Promise.resolve();
          queueMicroTask_ = queueMicroTask_.then.bind(queueMicroTask_);
        }
        !EnsuredGetRootNode && getRootNode && (getRootNode = _call.bind(getRootNode));
        for (;isReRegistering; ) {
          const propName = (isReRegistering -= 2) ? "onmousedown" : "onclick";
          const propDesc = (0, Object.getOwnPropertyDescriptor)(HtmlElProto, propName);
          hookedFuncs[isReRegistering] = propDesc.set;
          hookedFuncs[isReRegistering + 1] = propDesc.set = hooks["set " + propName];
          Object.defineProperty(HtmlElProto, propName, propDesc);
        }
        // only the below can affect outsides
                call(Remove, root);
        call(_listen, root, kMk + kRC, () => {
          root = call(getElementsByTagNameInEP, root, "*")[0];
          call(Remove, root);
          call(_listen, root, "VC" /* InnerConsts.kCmd */ , executeCmd, true);
          timer = toRegister.length > 0 ? setTimeout_(next, 36 /* InnerConsts.DelayForNext */) : 0;
          detectDisabled = 0;
        });
        ETP[kAEL] = myAEL;
        FProto[kToS] = myToStr;
        DocCls.open = myDocOpen;
        DocCls.write = myDocWrite;
      }.toString() + ")();";
 /** need "toString()": {@link ../scripts/dependencies.js#patchExtendClick} */
      // #endregion injected code
            if (isFirstTime) {
        injected = injected.replace(outKMK, "$&" + secret);
        script.dataset.vimium = secret;
        utils_1.setupEventListener(0, kVOnClick1, onClick);
      }
      /**
             * According to `V8CodeCache::ProduceCache` and `V8CodeCache::GetCompileOptions`
             *     in third_party/blink/renderer/bindings/core/v8/v8_code_cache.cc,
             *   and ScriptController::ExecuteScriptAndReturnValue
             *     in third_party/blink/renderer/bindings/core/v8/script_controller.cc,
             * inlined script are not cached for `v8::ScriptCompiler::kNoCacheBecauseInlineScript`.
             * But here it still uses the same script, just for my personal preference.
             */      dom_utils_1.runJS_(injected, script);
      // not check MinEnsuredNewScriptsFromExtensionOnSandboxedPage
      // for the case JavaScript is disabled in CS: https://github.com/philc/vimium/issues/3187
      if (!dom_utils_1.parentNode_unsafe_s(script)) {
        // It succeeded in hooking.
        box = dom_utils_1.createElement_("div");
        utils_1.vApi.e = execute;
        // wait the inner listener of `start` to finish its work
                if (isFirstTime) {
          readyTimeout = utils_1.timeout_(initOnDocReady, 1e3 /* InnerConsts.DelayToWaitDomReady */);
          dom_utils_1.OnDocLoaded_(initOnDocReady);
        }
        return;
      }
      // else: CSP script-src before C68, CSP sandbox before C68 or JS-disabled-in-CS on C/E
            dom_utils_1.removeEl_s(script);
      execute(6 /* kContentCmd.Destroy */);
      if (!injected) {
        // on Edge (EdgeHTML), `setTimeout` and `requestAnimationFrame` work well
        return;
      }
      // ensured on Chrome
        })(insert_1.grabBackFocus);
  };
});
"use strict";

(function VC() {
  const V = /** verifier */ maybeSecret => {
    I = "__VimiumPlus_2021831" /* Build.RandomClick */ === maybeSecret;
  }, doc0 = document, SetProp = Object.setPrototypeOf, kAEL = "addEventListener", kToS = "toString", kProto = "prototype", kByTag = "getElementsByTagName", ETP = EventTarget[kProto], _listen = ETP[kAEL], toRegister = [], _call = _listen.call, apply = Reflect.apply, call = _call.bind(_call), _dispatch = ETP.dispatchEvent, HtmlElProto = HTMLElement[kProto], ElCls = Element, ElProto = ElCls[kProto], Append = ElProto.append, GetAttr = ElProto.getAttribute, Remove = ElProto.remove, getElementsByTagNameInEP = ElProto[kByTag], nodeIndexList = [], Slice = nodeIndexList.slice, IndexOf = _call.bind(nodeIndexList.indexOf), forEach = nodeIndexList.forEach, splice = nodeIndexList.splice, pushInDocument = nodeIndexList.push.bind(nodeIndexList), CECls = CustomEvent, StopProp = CECls[kProto].stopImmediatePropagation, DECls = FocusEvent, Func = Function, FProto = Func[kProto], _toString = FProto[kToS], clearTimeout1 = clearTimeout, DocCls = Document[kProto], getElementsByTagNameInDoc = DocCls[kByTag], OwnProp = Object.getOwnPropertyDescriptor, relatedTargetGetter = OwnProp(DECls[kProto], "relatedTarget").get, _docOpen = DocCls.open, _docWrite = DocCls.write, kOC = "VimiumPlusClickable" /* InnerConsts.kVOnClick */ , kRC = "2021831" /* Build.RandomClick */ , kEventName2 = kOC + kRC, StringSplit = "".split, StringSlice = kEventName2.slice, checkIsNotVerifier = func => {
    verifierPrefixLen || (verifierLen = (verifierStrPrefix = call(_toString, V)).length, 
    verifierPrefixLen = (verifierStrPrefix = call(StringSplit, verifierStrPrefix, kRC)[0]).length);
    func && func(call(StringSlice, call(_toString, func), verifierPrefixLen - 13 /* GlobalConsts.LengthOfMarkAcrossJSWorlds */ , verifierPrefixLen - 13 /* GlobalConsts.LengthOfMarkAcrossJSWorlds */ + 20 /* InnerConsts.kRandStrLenInBuild */));
  }, enqueue = (a, listener) => {
    if (typeof listener === "function" && a.localName !== "a") {
      pushToRegister(a);
      timer = timer || (queueMicroTask_(delayToStartIteration), 1);
    }
  }, hooks = {
    toString() {
      const a = this, args = arguments, hookedInd = IndexOf(hookedFuncs, a);
      const str = apply(_toString, hookedInd < 0 ? a : hookedFuncs[hookedInd - 1], args);
      const mayStrBeToStr = str !== (myAELStr || (myToStrStr = call(_toString, myToStr), 
      verifierLen = (verifierStrPrefix = call(_toString, V)).length, verifierPrefixLen = (verifierStrPrefix = call(StringSplit, verifierStrPrefix, kRC)[0]).length, 
      myAELStr = call(_toString, myAEL)));
      args.length === 2 && args[0] === "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */ && checkIsNotVerifier(args[1]);
      return mayStrBeToStr && str !== myToStrStr ? str.length !== verifierLen || call(StringSlice, str, 0, verifierPrefixLen) !== verifierStrPrefix ? str : call(_toString, noop) : (I = 0, 
      mayStrBeToStr ? call(a, noop, kMk, V) : a(kMk, noop, 0, V), I ? call(_toString, mayStrBeToStr ? _toString : _listen) : str);
    },
    addEventListener(type, listener) {
      let a = this, args = arguments;
      const ret = args.length === 4 && type === "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */ ? checkIsNotVerifier(args[3]) : (typeof type === "string" && type < "DOMSv" && (type > "DOMCi" ? type > "DOMNo" : type > "DOMCh") ? (tryEval && tryEval(), 
      evaledApply) : apply)(_listen, a, args);
      (type === "click" || type === "mousedown" || type === "pointerdown" || type === "dblclick" ? listener && a instanceof ElCls && a.localName !== "a" && a !== toRegister[toRegister.length - 1] : type === kEventName2 && !isReRegistering && a && !a.window && a.nodeType === 1 /* kNode.ELEMENT_NODE */) && enqueue(a, listener);
      return ret;
    },
    open() {
      return docOpenHook(0, this, arguments);
    },
    write() {
      return docOpenHook(1, this, arguments);
    }
  }, myAEL =  hooks[kAEL], myToStr =  hooks[kToS], myDocOpen =  hooks.open, myDocWrite =  hooks.write, kHost = "." + location.host, hookedFuncs = [ 0, 0, 0, 0, _listen, myAEL, _toString, myToStr, _docOpen, myDocOpen, _docWrite, myDocWrite ];
  let myAELStr, myToStrStr, verifierStrPrefix, verifierPrefixLen, verifierLen, 
  /** verifierIsLastMatched */ I, root = doc0.createElement("div"), timer = 1, 
  /** kMarkToVerify */ kMk = "__VimiumPlus_" /* GlobalConsts.MarkAcrossJSWorlds */ , getRootNode = _call.bind(ElProto.getRootNode), kGetComposedRoot = SetProp({
    composed: true
  }, null), 
  // here `setTimeout` is normal and will not use TimerType.fake
  setTimeout_ = setTimeout, unsafeDispatchCounter = 0, allNodesInDocument = null, allNodesForDetached = null, pushToRegister = nodeIndexList.push.bind(toRegister), queueMicroTask_ = queueMicrotask, evaledApply = apply, isReRegistering = 0, tryEval = kHost.endsWith(".bing.com") ? 0 : () => {
    try {
      tryEval = 0, evaledApply = new Func("c", "return (f,t,a)=>c(f,t,a)")(apply);
    } catch (_a) {}
  };
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
    apply(_dispatch, target || root, [ new cls(kOC, SetProp(data, null)) ]);
  };
  const prepareRegister = element => {
    if (getRootNode(element) === doc0) {
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
    let tempParent, parent = getRootNode(element);
    // Document::nodeType is not changable (except overridden by an element like <img>), so the comparsion below is safe
        let s, type = parent.nodeType;
    // note: the below may change DOM trees,
    // so `dispatch` MUST NEVER throw. Otherwise a page might break
        if (type === 1 /* kNode.ELEMENT_NODE */) {
      parent !== root && call(Append, root, parent);
      pushInDocument(-8 /* InnerConsts.OffsetForBoxChildren */ - IndexOf(allNodesForDetached = allNodesForDetached || call(Slice, call(getElementsByTagNameInEP, root, "*")), element));
      // Note: ignore the case that a plain #document-fragment has a fake .host
        } else if (type !== 11 /* kNode.DOCUMENT_FRAGMENT_NODE */) {} else if (unsafeDispatchCounter < 10) {
      if (tempParent = parent.host) {
        parent = tempParent.shadowRoot && getRootNode(element, kGetComposedRoot);
        if (parent && (parent === doc0 || parent.nodeType === 1 /* kNode.ELEMENT_NODE */) && typeof (s = element.tagName) === "string") {
          parent !== doc0 && parent !== root && call(Append, root, parent);
          unsafeDispatchCounter++;
          safeDispatch_(CECls, {
            detail: 1831 /* InnerConsts.kModToExposeSecret */ + s,
            composed: true
          }, element);
        }
      } else {
        unsafeDispatchCounter++;
        safeDispatch_(DECls, {
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
      safeDispatch_(CECls, {
        detail: [ nodeIndexList, fromAttrs ]
      });
      nodeIndexList.length = 0;
    }
    allNodesInDocument = allNodesForDetached = null;
  };
  const safeReRegister = (element, doc1) => {
    const localAEL = doc1[kAEL], localREL = doc1.removeEventListener, F = "function";
    if (typeof localAEL == F && typeof localREL == F && localAEL !== myAEL) {
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
    const detail = eventOrDestroy && root && +call(GetAttr, root, "data-vimium" /* InnerConsts.kSecretAttr */), cmd = detail ? detail >> 3 /* kContentCmd.MaskedBitNumber */ === 2021831 /* Build.RandomClick */ ? detail & 7 : 0 /* kContentCmd._fake */ : eventOrDestroy ? 0 /* kContentCmd._fake */ : 6 /* kContentCmd.Destroy */;
    // always stopProp even if the secret does not match, so that an attacker can not detect secret by enumerating numbers
        detail && call(StopProp, eventOrDestroy);
    if (cmd < 4 /* kContentCmd._minSuppressClickable */) {
      cmd > 2 ? 
      // not hook showPicker - it seems not needed
      call(relatedTargetGetter, eventOrDestroy).showPicker() : next(clearTimeout1(timer));
      return;
    }
    root = toRegister.length = 0;
    pushToRegister = setTimeout_ = noop;
    timer = 1;
  };
  const docOpenHook = (isWrite, self, args) => {
    const first = doc0.readyState < "l" && (isWrite || args.length < 3) && self === doc0;
    const oriHref = first ? dbgLoc.host && dbgLoc.pathname || dbgLoc.href : "";
    tryEval && tryEval();
    const ret = evaledApply(isWrite ? _docWrite : _docOpen, self, args);
    first && root && safeDispatch_(CECls, {
      detail: [ [ isWrite ? -4 /* InnerConsts.SignalDocWrite */ : -3 /* InnerConsts.SignalDocOpen */ ], 0, oriHref ]
    });
    return ret;
  };
  const noop = () => 1;
  const docEl = doc0.documentElement;
  const dbgLoc = location;
  const dataset = root.dataset;
  if (!docEl) {
    return;
  }
  if (dataset && (dataset.vimium = kRC, 
  // only the below can affect outsides
  _dispatch(new DECls(kOC, {
    relatedTarget: root
  })), !dataset.vimium)) {
    root[kAEL]("VC" /* InnerConsts.kCmd */ , executeCmd, true);
    timer = toRegister.length > 0 ? setTimeout_(next, 36 /* InnerConsts.DelayForNext */) : 0;
    ETP[kAEL] = myAEL;
    FProto[kToS] = myToStr;
    DocCls.open = myDocOpen;
    DocCls.write = myDocWrite;
    for (let i of [ 0, 2 ]) {
      /*#__ENABLE_SCOPED__*/
      let propName = i ? "onmousedown" : "onclick";
      const setterName = "set " + propName;
      const proxy = {
        [setterName](val) {
          call(hookedFuncs[i], this, val);
          val && enqueue(this, val);
        }
      };
      const propDesc = OwnProp(HtmlElProto, propName);
      hookedFuncs[i] = propDesc.set;
      hookedFuncs[i + 1] = propDesc.set = proxy[setterName];
      Object.defineProperty(HtmlElProto, propName, propDesc);
    }
  }
})();
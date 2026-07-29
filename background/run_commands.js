"use strict";
__filename = "background/run_commands.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./ports", "./i18n", "./key_mappings" ], (require, exports, store_1, BgUtils_, browser_1, normalize_urls_1, ports_1, i18n_1, key_mappings_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.initHelpDialog = exports.waitAndRunKeyReq = exports.runNextOnTabLoaded = exports.runNextCmdBy = exports.getRunNextCmdBy = exports.runNextCmd = exports.makeFallbackContext = exports.wrapFallbackOptions = exports.parseFallbackOptions = exports.hasFallbackOptions = exports.executeExternalCmd = exports.executeShortcut = exports.portSendFgCmd = exports.sendFgCmd = exports.onConfirmResponse = exports.onBeforeConfirm = exports.confirm_ = exports.needConfirm_ = exports.executeCommand = exports.fillOptionWithMask = exports.overrideOption = exports.overrideCmdOptions = exports.concatOptions = exports.copyCmdOptions = exports.replaceCmdOptions = void 0;
  BgUtils_ = __importStar(BgUtils_);
  const abs = Math.abs;
  let _gCmdTimer = 0;
  let gOnConfirmCallback;
  let _gCmdHasNext;
  let _cNeedConfirm = 1;
  let _helpDialogModule;
  /** operate command options */  const replaceCmdOptions = known => {
    store_1.set_cOptions(BgUtils_.safer_(known));
  };
  exports.replaceCmdOptions = replaceCmdOptions;
  /** skip commands' private ".$xxx" options and ".$count", except those shared public fields */  const copyCmdOptions = (dest, src) => {
    for (const i in src) {
      (i[0] !== "$" || "$then=$else=$retry=$f=".includes(i + "=") && !i.includes("=")) && (dest[i] !== void 0 || (dest[i] = src[i]));
    }
    return dest;
  };
  exports.copyCmdOptions = copyCmdOptions;
  const concatOptions = (base, updates) => updates && base ? exports.copyCmdOptions(exports.copyCmdOptions(BgUtils_.safeObj_(), updates), base) : base || updates || null;
  exports.concatOptions = concatOptions;
  /** keep all private and public fields in cOptions */  const overrideCmdOptions = (known, disconnected, oriOptions) => {
    const old = oriOptions || store_1.get_cOptions();
    BgUtils_.extendIf_(BgUtils_.safer_(known), old);
    disconnected ? delete known.$o : known.$o = old;
    oriOptions || store_1.set_cOptions(known);
  };
  exports.overrideCmdOptions = overrideCmdOptions;
  const overrideOption = (field, value, curOptions) => {
    curOptions = curOptions || store_1.get_cOptions();
    curOptions[field] = value;
    const parentOptions = curOptions.$o;
    parentOptions != null && exports.overrideOption(field, value, parentOptions);
  };
  exports.overrideOption = overrideOption;
  const fillOptionWithMask = (template, rawMask, valueKey, stopWords, count, options) => {
    let toDelete, ok = -1, mask = rawMask, useDefaultMask = mask === true || mask === "";
    if (useDefaultMask) {
      let arr, re = /\$\$|[$%][sS]/g;
      while ((arr = re.exec(template)) && arr[0] === "$$") {}
      mask = arr && arr[0] || "$s";
    }
    let maskCount, value = null, useCount = false;
    const hasMask0 = !!mask && typeof mask === "string" && template.includes(mask);
    const usableOptions = options || store_1.get_cOptions();
    const getValue = () => {
      if (value !== null || keysLen !== 1) {
        return value || "";
      }
      let name = valueKey && usableOptions[valueKey];
      if (name) {
        toDelete = valueKey;
      } else {
        const keys = Object.keys(usableOptions).filter(i => i[0] !== "$" && !stopWords.includes(i) && usableOptions[i] === true);
        if (keys.length === 1) {
          name = toDelete = keys[0];
        } else {
          if (rawMask !== "") {
            keysLen = keys.length;
            return "";
          }
          name = "";
        }
      }
      ok = 1;
      value = name + "";
      value = mask === "$s" || mask === "%s" ? BgUtils_.encodeAsciiComponent_(value) : value;
      return value;
    };
    let keysLen = 1, useDict = 0;
    if (useDefaultMask) {
      if (template.includes(maskCount = "$c") || template.includes(maskCount = "%c")) {
        ok = 1;
        useCount = true;
      }
      template = template.replace(new RegExp("\\$\\{([^}]*)}|\\$\\$" + (useCount ? "|" + BgUtils_.escapeAllForRe_(maskCount) : "") + (hasMask0 ? "|" + BgUtils_.escapeAllForRe_(mask) : ""), "g"), (s, body) => {
        if (s === mask) {
          return getValue();
        }
        if (s === maskCount) {
          return count + "";
        }
        if (!body) {
          return "$";
        }
        ok = 1;
        useDict++;
        let encode = false;
        const sed = normalize_urls_1.tailSedKeysRe_.exec(body);
        sed && (body = body.slice(0, sed.index));
        if (/^[sS]:/.test(body)) {
          encode = body[0] === "s";
          body = body.slice(2);
        }
        const clip = normalize_urls_1.tailClipNameRe_.exec(body) || normalize_urls_1.headClipNameRe_.exec(body);
        clip && (body = clip[0][0] === "<" ? body.slice(0, clip.index) : body.slice(clip[0].length));
        let val = clip ? store_1.readInnerClipboard_(clip[0][0] === "<" ? clip[0].slice(1) : clip[0].slice(0, -1)) : body === "__proto__" || body[0] === "$" ? "" : body ? usableOptions[body] : getValue();
        val = typeof val === "string" ? val : val && typeof val === "object" ? JSON.stringify(val) : val + "";
        sed && (val = store_1.substitute_(val, 0 /* SedContext.NONE */ , BgUtils_.DecodeURLPart_(sed[0].slice(1))));
        return encode ? BgUtils_.encodeAsciiComponent_(val) : val;
      });
    } else if (hasMask0) {
      getValue();
      value !== null && (template = template.replace(mask, () => value));
    }
    if (keysLen !== 1) {
      return {
        ok: 0,
        result: keysLen
      };
    }
    if (mask && typeof mask === "string") {
      const newOptions = options || {};
      options || exports.overrideCmdOptions(newOptions);
      newOptions.$masked = true;
      toDelete && delete newOptions[toDelete];
    }
    return {
      ok,
      value: value || "",
      result: template,
      useCount,
      useDict
    };
  };
  exports.fillOptionWithMask = fillOptionWithMask;
  /** execute a command normally */  const executeCmdOnTabs = tabs => {
    const callback = gOnConfirmCallback;
    gOnConfirmCallback = null;
    if (callback) {
      if (_gCmdHasNext) {
        const {promise_, resolve_} = BgUtils_.deferPromise_();
        callback(tabs, resolve_);
        promise_.then(runNextCmdByResult);
      } else {
        callback(tabs, store_1.blank_);
      }
    }
    store_1.set_cEnv(null);
    return tabs ? void 0 : browser_1.runtimeError_();
  };
  const onLargeCountConfirmed = registryEntry => {
    exports.executeCommand(registryEntry, 1, store_1.cKey, store_1.cPort, store_1.cRepeat);
  };
  const executeCommand = (registryEntry, count, lastKey, port, overriddenCount, fallbackCounter) => {
    setupSingletonCmdTimer(0);
    if (gOnConfirmCallback) {
      gOnConfirmCallback = null;
 // just in case that some callbacks were thrown away
            store_1.set_cEnv(null);
      return;
    }
    let scale;
    let options = key_mappings_1.normalizedOptions_(registryEntry), repeat = registryEntry.repeat_;
    // .count may be invalid, if from other extensions
        options && (scale = options.$count) && (count = count * scale || 1);
    count = overriddenCount || (count >= 1e4 ? 9999 /* GlobalConsts.CommandCountLimit */ : count <= -1e4 ? -9999 /* GlobalConsts.CommandCountLimit */ : count | 0 || 1);
    if (count === 1) {} else if (repeat === 1) {
      count = 1;
    } else if (repeat > 1 && (count > repeat || count < -repeat)) {
      if (fallbackCounter != null) {
        count = count < 0 ? -1 : 1;
      } else if (!overriddenCount && (!options || options.confirmed !== true)) {
        store_1.set_cKey(lastKey);
        store_1.set_cOptions(null);
        store_1.set_cPort(port);
        store_1.set_cRepeat(count);
        store_1.set_cEnv(null);
        exports.confirm_(registryEntry.command_, abs(count)).then( onLargeCountConfirmed.bind(null, registryEntry));
        return;
      }
    } else {
      count = count || 1;
    }
    if (fallbackCounter != null) {
      let maxRetried = fallbackCounter.r | 0;
      maxRetried = Math.max(1, maxRetried >= 0 && maxRetried < 100 ? Math.min(maxRetried || 6, 20) : abs(maxRetried));
      if (fallbackCounter.c && fallbackCounter.c.i >= maxRetried && (!options || options.$else !== "showTip")) {
        store_1.set_cPort(port);
        ports_1.showHUD(`Has run sequential commands for ${maxRetried} times`);
        store_1.set_cEnv(null);
        return;
      }
      const context = exports.makeFallbackContext(fallbackCounter.c, 1, fallbackCounter.u);
      if (options && ((registryEntry.alias_ === 38 /* kBgCmd.runKey */ || context.t) && registryEntry.background_ || exports.hasFallbackOptions(options))) {
        const opt2 = {};
        exports.overrideCmdOptions(opt2, false, options);
        opt2.$retry = -maxRetried, opt2.$f = context;
        context.t && registryEntry.background_ && !options.$else && (opt2.$else = "showTip");
        options = opt2;
      }
    }
    if (registryEntry.background_) {} else {
      if (port != null) {
        const {alias_: fgAlias} = registryEntry, wantCSS = 4620 /* kFgCmd.focusInput */ >> fgAlias & 1 || fgAlias === 4 /* kFgCmd.scroll */ && !!options && options.keepHover === false;
        store_1.set_cPort(port);
        store_1.set_cEnv(null);
        exports.portSendFgCmd(port, fgAlias, wantCSS, options, count);
        return;
      }
      {
        let fgAlias = registryEntry.alias_, newAlias = 0;
        fgAlias === 18 /* kFgCmd.framesGoBack */ ? browser_1.Tabs_.goBack && (newAlias = 23 /* kBgCmd.goBackFallback */) : fgAlias === 11 /* kFgCmd.autoOpen */ && (newAlias = 14 /* kBgCmd.autoOpenFallback */);
        if (!newAlias) {
          return;
        }
        registryEntry = key_mappings_1.makeCommand_(registryEntry.command_, options, [ newAlias, 1, registryEntry.repeat_ ]);
      }
    }
    const {alias_: alias} = registryEntry, func = store_1.bgC_[alias];
    _gCmdHasNext = registryEntry.hasNext_;
    _gCmdHasNext === null && (_gCmdHasNext = registryEntry.hasNext_ = options != null && exports.hasFallbackOptions(options));
    // safe on renaming
        store_1.set_cKey(lastKey);
    store_1.set_cOptions(options || (registryEntry.options_ = BgUtils_.safeObj_()));
    store_1.set_cPort(port);
    store_1.set_cRepeat(count);
    count = store_1.cmdInfo_[alias];
    if (port == null && alias < 13 && alias > 2) {} else if (count < 1 /* kCmdInfo.ActiveTab */) {
      if (_gCmdHasNext) {
        const {promise_, resolve_} = BgUtils_.deferPromise_();
        func(resolve_);
        promise_.then(runNextCmdByResult);
      } else {
        func(store_1.blank_);
      }
      store_1.set_cEnv(null);
    } else {
      _gCmdHasNext = registryEntry.hasNext_;
      gOnConfirmCallback = func;
      (count < 2 /* kCmdInfo.CurShownTabsIfRepeat */ || count === 2 /* kCmdInfo.CurShownTabsIfRepeat */ && abs(store_1.cRepeat) < 2 ? browser_1.getCurTab : browser_1.getCurShownTabs_)( executeCmdOnTabs);
    }
  };
  exports.executeCommand = executeCommand;
  /** show a confirmation dialog */  const needConfirm_ = () => _cNeedConfirm && store_1.get_cOptions().confirmed !== true;
  exports.needConfirm_ = needConfirm_;
  /** 0=cancel, 1=force1, count=accept */  const confirm_ = (command, askedCount) => {
    typeof command === "string" && command.includes(".") && console.log("Assert error: command should has no limit on repeats: %c%s", "color:red", command);
    if (!store_1.cPort) {
      gOnConfirmCallback = null;
 // clear old commands
            store_1.set_cRepeat(store_1.cRepeat > 0 ? 1 : -1);
      return Promise.resolve(store_1.cRepeat > 0);
    }
    const cmdName = typeof command === "string" ? command : typeof command[0] === "string" ? command[0] : null;
    if (!_helpDialogModule && cmdName) {
      return exports.initHelpDialog().then(() => exports.confirm_(command, askedCount));
    }
    const {promise_, resolve_} = BgUtils_.deferPromise_();
    const countToReplay = store_1.cRepeat, bakOptions = store_1.get_cOptions(), bakPort = store_1.cPort;
    setupSingletonCmdTimer(setTimeout(onConfirm, 2e3, 0, void 0));
    gOnConfirmCallback = force1 => {
      store_1.set_cKey(0 /* kKeyCode.None */);
      store_1.set_cOptions(bakOptions);
      store_1.set_cPort(bakPort);
      store_1.set_cRepeat(force1 ? countToReplay > 0 ? 1 : -1 : countToReplay);
      _cNeedConfirm = 0;
      resolve_(force1);
      setTimeout(() => {
        _cNeedConfirm = 1;
      }, 0);
    };
    Promise.resolve(cmdName ? i18n_1.trans_("cmdConfirm", [ askedCount, store_1.helpDialogData_[1].get(_helpDialogModule.normalizeCmdName_(cmdName)) || `### ${cmdName} ###` ]) : command[0][0]).then(msg => {
      var _a;
      (((_a = ports_1.getCurFrames_()) === null || _a === void 0 ? void 0 : _a.top_) || store_1.cPort).postMessage({
        N: 12 /* kBgReq.count */ ,
        c: "",
        i: _gCmdTimer,
        m: msg,
        r: typeof command !== "string"
      });
    });
    return promise_;
  };
  exports.confirm_ = confirm_;
  const onConfirm = (response, request) => {
    const callback = gOnConfirmCallback;
    gOnConfirmCallback = null;
    (response > 1 || (request === null || request === void 0 ? void 0 : request.i)) && callback && callback(response < 3);
  };
  const setupSingletonCmdTimer = newTimer => {
    _gCmdTimer && clearTimeout(_gCmdTimer);
    _gCmdTimer = newTimer;
  };
  const onBeforeConfirm = response => {
    response.i >= -1 && _gCmdTimer === response.i && clearTimeout(response.i);
  };
  exports.onBeforeConfirm = onBeforeConfirm;
  const onConfirmResponse = (response, port) => {
    const id = typeof response.i !== "number" ? response.i.i : 0;
    // if id < -1, then pass it, so that 3rd-party extensions may use kFgReq.cmd to run commands
        if (response.i === 0 || id >= -1 && _gCmdTimer !== id) {
      return;
    }
 // an old / aborted / test message
        setupSingletonCmdTimer(0);
    if (response.r) {
      onConfirm(response.r, response.i);
      return;
    }
    exports.executeCommand(key_mappings_1.shortcutRegistry_.get(response.i.c), response.n, 0 /* kKeyCode.None */ , port, 0);
  };
  exports.onConfirmResponse = onConfirmResponse;
  /** forward a triggered command */  const sendFgCmd = (cmd, css, opts) => {
    exports.portSendFgCmd(store_1.cPort, cmd, css, opts, 1);
  };
  exports.sendFgCmd = sendFgCmd;
  const portSendFgCmd = (port, cmd, css, opts, count) => {
    port.postMessage({
      N: 10 /* kBgReq.execute */ ,
      H: css ? ports_1.ensureInnerCSS(port.s) : null,
      c: cmd,
      n: count,
      a: opts
    });
  };
  exports.portSendFgCmd = portSendFgCmd;
  const executeShortcut = (shortcutName, ref) => {
    const registry = key_mappings_1.shortcutRegistry_.get(shortcutName);
    const isRunKey = registry.alias_ === 38 /* kBgCmd.runKey */ && registry.background_;
    isRunKey && store_1.inlineRunKey_(registry);
    setupSingletonCmdTimer(0);
    if (ref && !(ref.cur_.s.flags_ & 512 /* Frames.Flags.ResReleased */)) {
      let port = ref.cur_;
      setupSingletonCmdTimer(setTimeout(exports.executeShortcut, 100, shortcutName, null));
      port.postMessage({
        N: 12 /* kBgReq.count */ ,
        c: shortcutName,
        i: _gCmdTimer,
        m: "",
        r: false
      });
      ref.flags_ & 512 /* Frames.Flags.ResReleased */ && ports_1.refreshPorts_(ref, 0);
      ports_1.ensuredExitAllGrab(ref);
      return;
    }
    const opts = key_mappings_1.normalizedOptions_(registry);
    const cmdName = isRunKey ? "runKey" : registry.command_;
    const fgAlias = registry.alias_;
    let realAlias = 0, realRegistry = registry;
    registry.background_ || (fgAlias === 18 /* kFgCmd.framesGoBack */ ? browser_1.Tabs_.goBack && (realAlias = 23 /* kBgCmd.goBackFallback */) : fgAlias === 11 /* kFgCmd.autoOpen */ && (realAlias = 14 /* kBgCmd.autoOpenFallback */));
    if (realAlias) {
      realRegistry = key_mappings_1.makeCommand_(cmdName, opts, [ realAlias, 1, registry.repeat_ ]);
    } else {
      if (!registry.background_) {
        return;
      }
      realAlias = registry.alias_;
    }
    if (realAlias > 12 /* kBgCmd.MAX_NEED_CPORT */ || realAlias < 3 /* kBgCmd.MIN_NEED_CPORT */) {
      exports.executeCommand(realRegistry, 1, 0 /* kKeyCode.None */ , null, 0);
    } else if (!opts || !opts.$noWarn) {
      (opts || (registry.options_ = BgUtils_.safeObj_())).$noWarn = true;
      console.log("Error: Command", cmdName, "must run on pages which have run Vim+");
    }
  };
  exports.executeShortcut = executeShortcut;
  /** this functions needs to accept any types of arguments and normalize them */  const executeExternalCmd = (message, sender, port) => {
    let command = message.command;
    command = command ? command + "" : "";
    const description = command ? key_mappings_1.availableCommands_[command] : null;
    if (!description) {
      return;
    }
    let ref;
    port = port || (sender.tab ? ports_1.indexFrame(sender.tab.id, sender.frameId || 0) || (ref = store_1.framesForTab_.get(sender.tab.id), 
    ref ? ref.cur_ : null) : null);
    if (!port && !description[1]) {
      /** {@link index.d.ts#CommandsNS.FgDescription} */
      return;
    }
    let options = message.options || null, lastKey = message.key, regItem = key_mappings_1.makeCommand_(command, options), count = message.count;
    if (!regItem) {
      return;
    }
    count = count !== "-" ? parseInt(count, 10) || 1 : -1;
    options && typeof options === "object" ? BgUtils_.safer_(options) : options = null;
    lastKey |= 0;
    exports.executeCommand(regItem, count, lastKey, port, 0);
  };
  exports.executeExternalCmd = executeExternalCmd;
  /** execute a command referred by .$then or .$else */  const hasFallbackOptions = options => !(!options.$then && !options.$else);
  exports.hasFallbackOptions = hasFallbackOptions;
  const parseFallbackOptions = options => {
    const thenKey = options.$then, elseKey = options.$else;
    return thenKey || elseKey ? {
      $then: thenKey,
      $else: elseKey,
      $retry: options.$retry,
      $f: options.$f
    } : null;
  };
  exports.parseFallbackOptions = parseFallbackOptions;
  const wrapFallbackOptions = options_mutable => {
    const fallback = exports.parseFallbackOptions(store_1.get_cOptions());
    fallback && Object.assign(options_mutable, fallback);
    return options_mutable;
  };
  exports.wrapFallbackOptions = wrapFallbackOptions;
  const makeFallbackContext = (old, counterStep, newTip) => ({
    i: (old ? old.i : 0) + counterStep,
    t: newTip && newTip !== 2 ? newTip : old ? old.t : 0
  });
  exports.makeFallbackContext = makeFallbackContext;
  const runNextCmd = useThen => exports.runNextCmdBy(useThen, store_1.get_cOptions());
  exports.runNextCmd = runNextCmd;
  const getRunNextCmdBy = isResultTab => exports.hasFallbackOptions(store_1.get_cOptions()) ? result => {
    const err = isResultTab & 2 ? result === void 0 : browser_1.runtimeError_(), options = store_1.get_cOptions();
    err ? exports.runNextCmdBy(0, options) : exports.runNextOnTabLoaded(options, isResultTab & 1 ? result : null);
    return isResultTab & 2 ? void 0 : err;
  } : isResultTab & 2 ? store_1.blank_ : browser_1.runtimeError_;
  exports.getRunNextCmdBy = getRunNextCmdBy;
  const runNextCmdByResult = result => {
    typeof result === "object" ? exports.runNextOnTabLoaded(store_1.get_cOptions(), result) : typeof result === "boolean" ? exports.runNextCmdBy(result ? 1 : 0, store_1.get_cOptions(), null) : result < 0 || exports.runNextCmdBy(result ? 1 : 0, store_1.get_cOptions(), result > 1 ? result : null);
  };
  const runNextCmdBy = (useThen, options, timeout) => {
    const nextKey = useThen ? options.$then : options.$else;
    const hasFallback = !!nextKey && typeof nextKey === "string";
    if (hasFallback) {
      const fStatus = {
        c: options.$f,
        r: options.$retry,
        u: 0,
        w: 0
      };
      const noDelay = nextKey && /\$D/.test(nextKey.split("#", 1)[0]);
      setupSingletonCmdTimer(setTimeout(async () => {
        const frames = store_1.framesForTab_.get(store_1.curTabId_);
        await ports_1.waitForPorts_(frames, true);
        const port = store_1.cPort && store_1.cPort.s.tabId_ === store_1.curTabId_ && frames && frames.ports_.indexOf(store_1.cPort) > 0 ? store_1.cPort : frames ? frames.cur_.s.status_ === 2 /* Frames.Status.disabled */ && frames.ports_.filter(i => i.s.status_ !== 2 /* Frames.Status.disabled */ && !(i.s.flags_ & 512 /* Frames.Flags.ResReleased */)).sort((a, b) => a.s.frameId_ - b.s.frameId_)[0] || frames.cur_ : null;
        frames && ports_1.ensuredExitAllGrab(frames);
        store_1.runOneMapping_(nextKey, port, fStatus);
      }, noDelay ? 0 : timeout || 50));
    }
    return hasFallback;
  };
  exports.runNextCmdBy = runNextCmdBy;
  const runNextOnTabLoaded = (options, targetTab, callback) => {
    const nextKey = options.$then;
    if ((!nextKey || typeof nextKey !== "string") && !callback) {
      return;
    }
    const onTimer = tab1 => {
      const now = Date.now(), isTimedOut = now < start - 500 || now - start >= timeout || evenLoading;
      // not clear the _gCmdTimer, in case a (new) tab closes itself and opens another tab
            if (!tab1 || !_gCmdTimer) {
        tabId = -1 /* GlobalConsts.TabIdNone */;
        return browser_1.runtimeError_();
      }
      if (isTimedOut || tab1.status === "complete") {
        // not check injection status - let the command of `wait for="ready"` check it
        // so some commands not using cPort can run earlier
        if (!isTimedOut && !store_1.framesForTab_.has(tab1.id) && (callback || tab1.url.startsWith(location.protocol))) {
          return;
        }
        setupSingletonCmdTimer(0);
        gOnConfirmCallback = null;
        callback && callback();
        nextKey && exports.runNextCmdBy(1, options, callback ? 67 : 0);
      }
    };
    const timeout = targetTab !== false ? 1500 : 500;
    const evenLoading = !!nextKey && /[$%]l/.test(nextKey.split("#", 1)[0]);
    let tabId = targetTab ? targetTab.id : targetTab !== false ? -1 /* GlobalConsts.TabIdNone */ : store_1.curTabId_, start = Date.now();
    setupSingletonCmdTimer(setInterval(() => {
      browser_1.tabsGet(tabId !== -1 /* GlobalConsts.TabIdNone */ ? tabId : store_1.curTabId_, onTimer);
    }, evenLoading ? 50 : 100));
 // it's safe to clear an interval using `clearTimeout`
        nextKey && /\$D/.test(nextKey.split("#", 1)[0]) && browser_1.tabsGet(tabId !== -1 /* GlobalConsts.TabIdNone */ ? tabId : store_1.curTabId_, onTimer);
  };
  exports.runNextOnTabLoaded = runNextOnTabLoaded;
  const waitAndRunKeyReq = (request, port) => {
    const fallbackInfo = request.f;
    const options = {
      $then: request.k,
      $else: null,
      $retry: fallbackInfo && fallbackInfo.r,
      $f: fallbackInfo && exports.makeFallbackContext(fallbackInfo.c, 0, fallbackInfo.u)
    };
    store_1.set_cPort(port);
    fallbackInfo && fallbackInfo.u === false ? exports.runNextOnTabLoaded(options, null) : exports.runNextCmdBy(1, options, fallbackInfo && fallbackInfo.w);
  };
  exports.waitAndRunKeyReq = waitAndRunKeyReq;
  const initHelpDialog = () => {
    const curHData = store_1.helpDialogData_ || [];
    return _helpDialogModule ? Promise.resolve(_helpDialogModule) : Promise.all([ browser_1.import2(store_1.CONST_.HelpDialogJS), curHData[0] != null ? null : BgUtils_.fetchFile_("help_dialog.html"), curHData[1] != null ? null : i18n_1.getI18nJson("help_dialog") ]).then(([helpDialog, temp1, temp2]) => {
      const newHData = store_1.helpDialogData_ || store_1.set_helpDialogData_([ null, null ]);
      temp1 && (newHData[0] = temp1);
      temp2 && (newHData[1] = temp2);
      return _helpDialogModule = helpDialog;
    }, args => {
      console.error("Promises for initHelp failed: %o ; %o", args[0], args[1]);
    });
  };
  exports.initHelpDialog = initHelpDialog;
});
"use strict";
__filename = "background/run_keys.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./ports", "./exclusions", "./i18n", "./key_mappings", "./run_commands" ], function(require, exports, store_1, BgUtils_, browser_1, ports_1, exclusions_1, i18n_1, key_mappings_1, run_commands_1) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.parseEmbeddedOptions = exports.parseKeyNode = exports.runKeyInSeq = exports.parseKeySeq = exports.runKeyWithCond = void 0;
  BgUtils_ = __importStar(BgUtils_);
  const DEBUG = 0;
  const abs = Math.abs;
  const kRunKeyOptionNames = [ "expect", "keys", "options", "mask" ];
  let _loopIdToRunSeq = 0;
  const collectOptions = opts => {
    const o2 = BgUtils_.safeObj_(), others = [];
    let found = "";
    for (const key in opts) {
      key.includes("$") || (key.startsWith("o.") ? key.length > 2 && (o2[found = key.slice(2)] = opts[key]) : kRunKeyOptionNames.includes(key) || others.push(key));
    }
    for (const key2 of others) {
      o2[found = key2] = opts[key2];
    }
    return found ? o2 : null;
  };
  const matchEnvRule = (rule, info) => {
    // avoid sending messages to content scripts - in case a current tab is running slow
    let {host, iframe, fullscreen, element: elSelector, incognito} = rule;
    if (host === void 0) {
      host = rule.host = rule.url != null ? rule.url : null;
      delete rule.url;
    }
    if (incognito != null && store_1.curIncognito_ === 2 /* IncognitoType.true */ !== !!incognito) {
      return 1 /* EnvMatchResult.nextEnv */;
    }
    typeof host === "string" && (host = rule.host = exclusions_1.createSimpleUrlMatcher_(host));
    if (host != null) {
      let slash, url = info.url;
      if (url == null && (host.t === 3 /* kMatchUrl.Pattern */ ? [ "/*", "*" ].includes(host.v.p.pathname) && host.v.p.search === "*" && host.v.p.hash === "*" : host.t === 2 /* kMatchUrl.StringPrefix */ && ((slash = host.v.indexOf("/", host.v.indexOf("://") + 3)) === host.v.length - 1 || slash === -1))) {
        const frames = ports_1.getCurFrames_(), port = frames && frames.top_ || store_1.cPort;
        url = port ? port.s.url_ : null;
      }
      if (url == null && (url = ports_1.getPortUrl_(null, true)) instanceof Promise) {
        url.then(s => {
          var _a;
          info.url = s || (store_1.cPort ? (((_a = ports_1.getCurFrames_()) === null || _a === void 0 ? void 0 : _a.top_) || store_1.cPort).s.url_ : /** should not reach here */ "");
          exports.runKeyWithCond(info);
        });
        return 0 /* EnvMatchResult.interrupt */;
      }
      if (!exclusions_1.matchSimply_(host, url)) {
        return 1 /* EnvMatchResult.nextEnv */;
      }
    }
    if (iframe != null) {
      if (!store_1.cPort && iframe !== false) {
        return 1 /* EnvMatchResult.nextEnv */;
      }
      typeof iframe === "string" && (iframe = rule.iframe = exclusions_1.createSimpleUrlMatcher_(iframe) || true);
      if (typeof iframe === "boolean") {
        if (iframe !== !(!store_1.cPort || !store_1.cPort.s.frameId_)) {
          return 1 /* EnvMatchResult.nextEnv */;
        }
      } else if (!exclusions_1.matchSimply_(iframe, store_1.cPort.s.url_)) {
        return 1 /* EnvMatchResult.nextEnv */;
      }
    }
    if (fullscreen == null) {} else {
      if (info.fullscreen == null) {
        browser_1.getCurWnd(false, wnd => {
          info.fullscreen = !!wnd && wnd.state.includes("fullscreen");
          exports.runKeyWithCond(info);
          return browser_1.runtimeError_();
        });
        return 0 /* EnvMatchResult.interrupt */;
      }
      if (!!fullscreen !== info.fullscreen) {
        return 1 /* EnvMatchResult.nextEnv */;
      }
    }
    if (elSelector && elSelector !== "*") {
      const selectorArr = typeof elSelector === "string" ? [] : elSelector;
      typeof elSelector === "string" && (rule.element = elSelector.split(",").some(s => {
        s = s[0] === "*" ? s.slice(1) : s;
        const hash = s.indexOf("#"), dot = s.indexOf("."), len = s.length;
        s && selectorArr.push({
          tag: s.slice(0, hash < 0 ? dot < 0 ? len : dot : dot < 0 ? hash : Math.min(dot, hash)),
          id: hash >= 0 ? s.slice(hash + 1, dot > hash ? dot : len) : "",
          classList: BgUtils_.normalizeClassesToMatch_(dot >= 0 ? s.slice(dot + 1, hash > dot ? hash : len) : "")
        });
        return s === "*" || s.includes(" ");
      }) ? (selectorArr.length = 0, "*") : selectorArr);
      const cur = info.element;
      if (selectorArr.length) {
        if (cur == null) {
          store_1.cPort && ports_1.safePost(store_1.cPort, {
            N: 13 /* kBgReq.queryForRunKey */ ,
            n: performance.now(),
            c: info
          });
          return store_1.cPort ? 0 /* EnvMatchResult.interrupt */ : 1 /* EnvMatchResult.nextEnv */;
        }
        if (!selectorArr.some(s => cur === 0 ? s.tag === "body" && !s.id && !s.classList : (!s.tag || cur[0] === s.tag) && (!s.id || cur[1] === s.id) && (!s.classList.length || cur[2].length > 0 && s.classList.every(i => cur[2].includes(i))))) {
          return 1 /* EnvMatchResult.nextEnv */;
        }
      }
    }
    return 2 /* EnvMatchResult.matched */;
  };
  const normalizeExpects = options => {
    const expected_rules = options.expect;
    if (options.$normalized) {
      return expected_rules;
    }
    const normalizeKeys = keys => keys ? typeof keys !== "string" ? keys instanceof Array ? keys : [] : (keys = keys.trim()).includes(" ") ? keys.split(/ +/) : BgUtils_.splitWhenKeepExpressions(keys, ",").map(i => i.trim()) : [];
    let new_rules = [];
    if (expected_rules) {
      if (expected_rules instanceof Array) {
        new_rules = expected_rules.map(rule => rule instanceof Array ? {
          env: rule[0],
          keys: normalizeKeys(rule[1]),
          options: rule[2]
        } : rule && typeof rule === "object" ? {
          env: rule.env || rule,
          keys: normalizeKeys(rule.keys),
          options: rule.options
        } : null);
      } else if (typeof expected_rules === "object") {
        new_rules = Object.keys(expected_rules).map(name => {
          const val = expected_rules[name], isDict = val && typeof val === "object" && !(val instanceof Array);
          return {
            env: name,
            keys: normalizeKeys(isDict ? val.keys : val),
            options: isDict ? val.options : null
          };
        });
      } else if (typeof expected_rules === "string" && /^[^{].*?[:=]/.test(expected_rules)) {
        const delimiterRe = expected_rules.includes(":") ? /:/ : /=/;
        new_rules = expected_rules.split(expected_rules.includes(";") ? /[;\s]+/g : /[,\s]+/g).map(i => i.split(delimiterRe)).map(rule => rule.length !== 2 ? null : {
          env: rule[0].trim(),
          keys: normalizeKeys(rule[1]),
          options: null
        });
      }
    }
    new_rules = new_rules.map(i => i && i.env && (i.keys.length || i.options) ? i : null);
    run_commands_1.overrideOption("expect", new_rules, options);
    run_commands_1.overrideOption("keys", normalizeKeys(options.keys), options);
    run_commands_1.overrideOption("$normalized", 1, options);
    return new_rules;
  };
  const normalizeKeySeq = seq => {
    const optionsPrefix = seq.startsWith("#") ? seq.split("+", 1)[0] : "";
    return {
      tree: exports.parseKeySeq(seq.slice(optionsPrefix ? optionsPrefix.length + 1 : 0)),
      options: optionsPrefix.length > 1 ? exports.parseEmbeddedOptions(optionsPrefix.slice(1)) : null
    };
  };
  /** not call runNextCmd on invalid env/key info, but just show HUD to alert */  const runKeyWithCond = info => {
    const absCRepeat = abs(store_1.cRepeat);
    let matched;
    const frames = ports_1.getCurFrames_();
    store_1.cPort || store_1.set_cPort(frames ? frames.cur_ : null);
    info = info || store_1.get_cEnv() || {};
    store_1.set_cEnv(null);
    const expected_rules = normalizeExpects(store_1.get_cOptions());
    for (const normalizedRule of expected_rules) {
      if (!normalizedRule) {
        continue;
      }
      const ruleName = normalizedRule.env;
      let rule = ruleName;
      if (typeof rule === "string") {
        if (!key_mappings_1.envRegistry_) {
          ports_1.showHUD("No environments have been declared");
          return;
        }
        rule = key_mappings_1.envRegistry_.get(rule);
        if (rule === void 0) {
          ports_1.showHUD(`No environment named "${ruleName}"`);
          return;
        }
        if (typeof rule === "string") {
          rule = key_mappings_1.parseOptions_(rule, 2);
          key_mappings_1.envRegistry_.set(ruleName, rule);
        }
        if (rule === null) {
          continue;
        }
      }
      const res = matchEnvRule(rule, info);
      if (res === 0 /* EnvMatchResult.interrupt */) {
        return;
      }
      if (res === 2 /* EnvMatchResult.matched */) {
        matched = normalizedRule;
        break;
      }
    }
    const keys = matched && matched.keys.length ? matched.keys : store_1.get_cOptions().keys;
    let seq, keysInd;
    const sub_name = matched ? typeof matched.env === "string" ? `[${matched.env}]: ` : `(${expected_rules.indexOf(matched)})` : "";
    if (keys.length === 0) {
      ports_1.showHUD(sub_name + "Require keys: comma-seperated-string | string[]");
    } else if (absCRepeat > keys.length && keys.length !== 1) {
      ports_1.showHUD(sub_name + "Has no such a key");
    } else if (seq = keys[keysInd = keys.length === 1 ? 0 : store_1.cRepeat > 0 ? absCRepeat - 1 : keys.length - absCRepeat], 
    seq && (typeof seq === "string" || typeof seq === "object" && seq.tree && typeof seq.tree === "object" && typeof seq.tree.t === "number")) {
      let repeat = keys.length === 1 ? store_1.cRepeat : 1;
      if (typeof seq === "string") {
        let mask = store_1.get_cOptions().mask;
        if (mask != null) {
          const filled = run_commands_1.fillOptionWithMask(seq, mask, "", kRunKeyOptionNames, repeat);
          if (!filled.ok) {
            ports_1.showHUD((filled.result ? "Too many potential keys" : "No key") + " to fill masks");
            return;
          }
          mask = filled.ok > 0;
          seq = filled.result;
          repeat = filled.useCount ? 1 : repeat;
        }
        seq = normalizeKeySeq(seq);
        mask || (keys[keysInd] = seq);
      }
      const key = seq.tree, options2 = seq.options;
      if (key.t === 3 /* kN.error */ || key.val.length === 0) {
        key.t === 3 /* kN.error */ && ports_1.showHUD(key.val);
        return;
      }
      let options = matched && matched.options && typeof matched.options === "object" && matched.options || store_1.get_cOptions().options || (store_1.get_cOptions().$masked ? null : collectOptions(store_1.get_cOptions()));
      options = run_commands_1.concatOptions(options, options2);
      const newIntId = (_loopIdToRunSeq + 1) % 64 || 1;
      const $seq = {
        keys: key,
        repeat,
        options,
        cursor: key,
        timeout: 0,
        id: "single",
        fallback: run_commands_1.parseFallbackOptions(store_1.get_cOptions())
      };
      if (key.val.length > 1 || key.val[0].t !== 0 /* kN.key */) {
        const seqId = "<v-runKey:$1>" /* kStr.RunKeyWithId */ .replace("$1", "" + newIntId);
        const fakeOptions = {
          $seq,
          $then: seqId,
          $else: "-" + seqId,
          $retry: -999
        };
        $seq.id = seqId;
        _loopIdToRunSeq = newIntId;
        run_commands_1.replaceCmdOptions(fakeOptions);
        store_1.keyToCommandMap_.set(seqId, key_mappings_1.makeCommand_("runKey", fakeOptions));
        exports.runKeyInSeq($seq, 1, info);
      } else {
        DEBUG && console.log("keySeq[%o]: single(%o) # %o * %o @ %o", newIntId, key.val[0].val, options, repeat, Date.now() % 3e5);
        run_commands_1.replaceCmdOptions({
          $seq
        });
        onLastKeyInSeq($seq, key.val[0]);
        runOneKey(key.val[0], $seq, info);
      }
    } else {
      ports_1.showHUD(sub_name + "The key is invalid");
    }
  };
  exports.runKeyWithCond = runKeyWithCond;
  const parseKeySeq = keys => {
    const re = /^([$%][a-zA-Z]\+?)*([\d-]\d*\+?)?([$%][a-zA-Z]\+?)*((<([acmsv]-){0,4}.\w*(:i)?>|[^#()?:+$%-])+|-)(#[^()?:+]*)?/;
    let last, cur = {
      t: 1 /* kN.list */ ,
      val: [],
      par: null
    }, root = cur;
    for (let i = keys.length > 1 ? 0 : keys.length; i < keys.length; i++) {
      switch (keys[i]) {
       case "(":
        last = cur;
        cur = {
          t: 1 /* kN.list */ ,
          val: [],
          par: cur
        };
        last.val.push(cur);
        break;

       case ")":
        last = cur;
        do {
          last = last.par;
        } while (last.t === 2 /* kN.ifElse */);
        cur = last;
        break;

       case "?":
       case ":":
        last = keys[i] === "?" ? null : cur;
        while (last && last.t !== 2 /* kN.ifElse */) {
          last = last.par;
        }
        if (!last || last.val.f) {
          last = cur.par;
          cur.par = {
            t: 2 /* kN.ifElse */ ,
            val: {
              cond: cur,
              t: null,
              f: null
            },
            par: last || (root = {
              t: 1 /* kN.list */ ,
              val: [],
              par: null
            })
          };
          last ? last.t === 1 /* kN.list */ ? last.val.splice(last.val.indexOf(cur), 1, cur.par) : last.val.t === cur ? last.val.t = cur.par : last.val.f = cur.par : root.val.push(cur.par);
          last = cur.par;
        }
        cur = {
          t: 1 /* kN.list */ ,
          val: [],
          par: last
        };
        keys[i] === "?" ? last.val.t = cur : last.val.f = cur;
        break;

       case "+":
        break;

       default:
        while (i < keys.length && !"()?:+".includes(keys[i])) {
          const arr = re.exec(keys.slice(i));
          if (!arr) {
            const err = keys.slice(i);
            return {
              t: 3 /* kN.error */ ,
              val: "Invalid item to run: " + (err.length > 12 ? err.slice(0, 11) + "\u2026" : err),
              par: null
            };
          }
          let oneKey = arr[0];
          const hash = oneKey.indexOf("#");
          if (hash > 0 && /[#&]#/.test(oneKey.slice(hash))) {
            oneKey = keys.slice(i);
            i = keys.length;
          } else if (hash > 0 && /["\[]/.test(oneKey.slice(hash))) {
            const arr = BgUtils_.extractComplexOptions_(keys.slice(i + hash));
            oneKey = oneKey.slice(0, hash) + arr[0];
            i += hash + arr[1];
          } else {
            i += oneKey.length;
          }
          cur.val.push({
            t: 0 /* kN.key */ ,
            val: oneKey,
            par: cur
          });
        }
        i--;
        break;
      }
    }
    keys.length === 1 && root.val.push({
      t: 0 /* kN.key */ ,
      val: keys,
      par: root
    });
    Object.defineProperty(root, "to_json", {
      get: exprKeySeq
    });
    BgUtils_.resetRe_();
    return root;
  };
  exports.parseKeySeq = parseKeySeq;
  const exprKeySeq = function() {
    const ifNotEmpty = arr => arr.some(i => i != null) ? arr : null;
    const iter = node => node ? node.t === 1 /* kN.list */ ? node.val.length === 1 ? iter(node.val[0]) : node.val.length === 0 ? null : ifNotEmpty(node.val.map(iter)) : node.t !== 2 /* kN.ifElse */ ? node.val : {
      if: iter(node.val.cond),
      then: iter(node.val.t),
      else: iter(node.val.f)
    } : null;
    return iter(this);
  };
  const nextKeyInSeq = (lastCursor, dir) => {
    let par, ind, down = true;
    let cursor = lastCursor;
    if (cursor.t === 0 /* kN.key */) {
      par = cursor.par, ind = par.val.indexOf(cursor);
      cursor = ind < par.val.length - 1 && dir > 0 ? par.val[ind + 1] : (down = false, par);
    }
    while (cursor && cursor.t !== 0 /* kN.key */) {
      if (down && cursor.t === 1 /* kN.list */ && cursor.val.length > 0) {
        cursor = cursor.val[0];
      } else if (down && cursor.t === 2 /* kN.ifElse */) {
        cursor = cursor.val.cond;
      } else {
        if (!cursor.par) {
          cursor = null;
          break;
        }
        if (cursor.par.t === 1 /* kN.list */) {
          par = cursor.par, ind = par.val.indexOf(cursor);
          down = ind < par.val.length - 1;
          down && dir < 0 && (dir = 1);
          cursor = down ? par.val[ind + 1] : par;
        } else {
          par = cursor.par;
          down = cursor === par.val.cond;
          cursor = down && (dir > 0 ? par.val.t : (dir = 1, par.val.f)) || (down = false, par);
        }
      }
    }
    return cursor;
  };
  /** Note: this requires a temporary cOptions to modify */  const onLastKeyInSeq = ($seq, cursor) => {
    const runOptions = store_1.get_cOptions();
    const finalFallback = $seq.fallback;
    cursor && runOptions && (delete runOptions.$then, delete runOptions.$else);
    if (!finalFallback) {
      return;
    }
    cursor ? // ensured no $then/$else in outerFallback
    $seq.options = $seq.options ? Object.assign(finalFallback, $seq.options) : finalFallback : (runOptions === null || runOptions === void 0 ? void 0 : runOptions.$f) && (finalFallback.$f = run_commands_1.makeFallbackContext(finalFallback.$f, 0, runOptions.$f.t));
    runOptions && (runOptions.$f = finalFallback.$f);
  };
  const runKeyInSeq = ($seq, dir, envInfo) => {
    var _a, _b;
    const cursor = nextKeyInSeq($seq.cursor, dir);
    const ifOk = cursor && nextKeyInSeq(cursor, 1), ifFail = cursor && nextKeyInSeq(cursor, -1);
    const isLast = !(cursor && (ifOk || ifFail));
    const finalFallback = $seq.fallback;
    const seqId = $seq.id, intSeqId = DEBUG ? +/\d+/.exec($seq.id)[0] : -1;
    if (isLast) {
      DEBUG && console.log("keySeq[%o]: last = %o, fallback = %o @ %o", intSeqId, cursor && cursor.val, finalFallback, Date.now() % 3e5);
      "<v-runKey:$1>" /* kStr.RunKeyWithId */ .replace("$1", "" + _loopIdToRunSeq) === $seq.id && (_loopIdToRunSeq = Math.max(--_loopIdToRunSeq, 0));
      store_1.keyToCommandMap_.delete(seqId);
      clearTimeout($seq.timeout || 0);
      onLastKeyInSeq($seq, cursor);
    } else {
      DEBUG && console.log("keySeq[%o]: cursor = %o : $then=%o $else=%o @ %o", intSeqId, cursor && cursor.val, ifOk && ifOk.val, ifFail && ifFail.val, Date.now() % 3e5);
    }
    let seqOptions = store_1.get_cOptions();
    if (!cursor) {
      if (finalFallback && run_commands_1.runNextCmdBy(dir > 0 ? 1 : 0, finalFallback, 1)) {
        return;
      }
      const tip = dir > 0 ? 0 : ((_a = seqOptions.$f) === null || _a === void 0 ? void 0 : _a.t) || ((_b = finalFallback === null || finalFallback === void 0 ? void 0 : finalFallback.$f) === null || _b === void 0 ? void 0 : _b.t) || 0;
      tip && ports_1.showHUD(i18n_1.extTrans_(`${tip}`));
      return;
    }
    const thenPrefix = ifOk && seqOptions.$then ? typeof ifOk.val === "string" ? ifOk.val : ifOk.val.prefix : "";
    const elsePrefix = ifFail && seqOptions.$else ? typeof ifFail.val === "string" ? ifFail.val : ifFail.val.prefix : "";
    const evenLoading = (thenPrefix.includes("$l") ? 1 : 0) + (elsePrefix.includes("$l") ? 2 : 0);
    const noDelay = (thenPrefix.includes("$D") ? 1 : 0) + (elsePrefix.includes("$D") ? 2 : 0);
    if (evenLoading || noDelay) {
      if ($seq.cursor === $seq.keys) {
        run_commands_1.overrideCmdOptions({});
        seqOptions = store_1.get_cOptions();
      }
      seqOptions.$then = (evenLoading & 1 ? "$l+" : "") + (noDelay & 1 ? "$D+" : "") + seqOptions.$then;
      seqOptions.$else = (evenLoading & 2 ? "$l+" : "") + (noDelay & 2 ? "$D+" : "") + seqOptions.$else;
    }
    const timeout = isLast ? 0 : $seq.timeout = setTimeout(() => {
      const old = store_1.keyToCommandMap_.get(seqId);
      const opts2 = old && old.options_;
      opts2 && opts2.$seq && opts2.$seq.timeout === timeout && store_1.keyToCommandMap_.delete(seqId);
    }, 3e4);
    runOneKey(cursor, $seq, envInfo);
  };
  exports.runKeyInSeq = runKeyInSeq;
  //#endregion
  //#region run one key node with count and placeholder prefixes and a suffix of inline options
    const parseKeyNode = cursor => {
    let str = cursor.val;
    if (typeof str !== "string") {
      return str;
    }
    let arr = /^([$%][a-zA-Z]\+?|-)+/.exec(str);
    const isNegative = !!arr && arr[0].includes("-"), allowPlus = !arr || "+-".includes(arr[0].slice(-1));
    const prefix = arr ? arr[0].replace(/[+-]/g, "").replace(/%/g, "$") : "";
    str = arr ? str.slice(arr[0].length) : str;
    arr = /^\d+/.exec(str);
    const count = (isNegative ? -1 : 1) * (arr && parseInt(arr[0], 10) || 1);
    str = arr ? str.slice(arr[0].length) : str;
    str = allowPlus || arr || !str.startsWith("+") ? str : str.slice(1);
    const hashIndex = str.indexOf("#", 1);
    const key = hashIndex > 0 ? str.slice(0, hashIndex) : str;
    let options = null;
    if (hashIndex > 0 && hashIndex + 1 < str.length) {
      str = str.slice(hashIndex + 1);
      options = exports.parseEmbeddedOptions(str);
    }
    return cursor.val = {
      prefix,
      count,
      key,
      options
    };
  };
  exports.parseKeyNode = parseKeyNode;
  const parseEmbeddedOptions = /** has no prefixed "#" */ str => {
    const arrHash = /(^|&)#/.exec(str);
    const rawPart = arrHash ? str.slice(arrHash.index + arrHash[0].length) : "";
    const encodeValue = s => /\s/.test(s) ? JSON.stringify(s).replace(/\s/g, BgUtils_.encodeUnicode_) : s;
    str = (arrHash ? str.slice(0, arrHash.index) : str).split("&").map(pair => {
      const key = pair.split("=", 1)[0], val = pair.slice(key.length);
      return key ? key + (val ? "=" + encodeValue(BgUtils_.DecodeURLPart_(val.slice(1))) : "") : "";
    }).join(" ");
    if (rawPart) {
      const key2 = rawPart.split("=", 1)[0], val2 = rawPart.slice(key2.length);
      str = key2 ? (str ? str + " " : "") + key2 + (val2 ? "=" + encodeValue(val2.slice(1)) : "") : str;
    }
    return key_mappings_1.parseOptions_(str, 2);
  };
  exports.parseEmbeddedOptions = parseEmbeddedOptions;
  const runOneKey = (cursor, seq, envInfo) => {
    const info = exports.parseKeyNode(cursor);
    const isFirst = seq.cursor === seq.keys, hasCount = isFirst || info.prefix.includes("$c");
    const notWait = info.prefix.includes("$W");
    const seqOptions = store_1.get_cOptions();
    let options = notWait ? run_commands_1.concatOptions(info.options, BgUtils_.safer_({
      $then: "",
      $else: ""
    })) : run_commands_1.concatOptions(seq.options, info.options);
    seq.cursor = cursor;
    runOneKeyWithOptions(info.key, info.count * (hasCount ? seq.repeat : 1), options, envInfo, null, isFirst);
    if (notWait) {
      setTimeout(() => {
        run_commands_1.replaceCmdOptions(seqOptions);
        exports.runKeyInSeq(seq, 1, null);
      }, 0);
      return;
    }
  };
  const mayBuildVKey = key => !key.includes("<") && !key.includes(":", 1);
  const findMappedVKey = key => mayBuildVKey(key) && store_1.keyToCommandMap_.get(`<v-${key}>`) || null;
  store_1.set_runOneMapping_((key, port, fStatus, baseCount) => {
    key = key.replace(/^([$%][a-zA-Z]\+?)+(?=\S)/, "");
    const arr = /^\d+|^-\d*/.exec(key);
    let count = 1;
    if (arr != null) {
      const prefix = arr[0];
      key = key.slice(prefix.length);
      count = prefix !== "-" ? parseInt(prefix, 10) || 1 : -1;
    }
    baseCount && (count *= baseCount);
    key = key.replace(/^([$%][a-zA-Z]\+?)+(?=\S)/, "");
    let hash = 1;
    while (hash = key.indexOf("#", hash) + 1) {
      const slice = key.slice(0, hash - 1);
      if (store_1.keyToCommandMap_.has(slice) || findMappedVKey(slice) || /^[a-z]+(\.[a-z]+)?$/i.test(slice)) {
        break;
      }
    }
    store_1.set_cPort(port);
    store_1.set_cKey(0 /* kKeyCode.None */);
    store_1.set_cOptions(null);
    DEBUG && console.log("run one: %o # %o * %o / %o @ %o", hash ? key.slice(0, hash - 1) : key, hash ? key.slice(hash) : null, count, fStatus, Date.now() % 3e5);
    runOneKeyWithOptions(hash ? key.slice(0, hash - 1) : key, count, hash ? key.slice(hash) : null, null, fStatus);
  });
  const doesInheritOptions = baseOptions => {
    let cur = store_1.get_cOptions();
    while (cur && cur !== baseOptions) {
      cur = cur.$o;
    }
    return cur === baseOptions;
  };
  const runOneKeyWithOptions = (key, count, exOptions, envInfo, fallbackCounter, avoidStackOverflow) => {
    let finalKey = key, registryEntry = store_1.keyToCommandMap_.get(key) || mayBuildVKey(key) && store_1.keyToCommandMap_.get(finalKey = `<v-${key}>`) || null;
    let entryReadonly = true;
    if (registryEntry == null && key in key_mappings_1.availableCommands_) {
      entryReadonly = false;
      registryEntry = key_mappings_1.makeCommand_(key, null);
    }
    if (registryEntry == null) {
      let desc = /^\w+$/.test(key) ? finalKey : key;
      ports_1.showHUD(`"${desc.length >= 20 ? desc.slice(0, 19) + "\u2026" : desc}" has not been mapped`);
      return;
    }
    if (registryEntry.alias_ === 38 /* kBgCmd.runKey */ && registryEntry.background_) {
      store_1.inlineRunKey_(registryEntry);
      if (doesInheritOptions(registryEntry.options_)) {
        ports_1.showHUD('"runKey" should not call itself');
        return;
      }
    }
    typeof exOptions === "string" && (exOptions = exOptions ? exports.parseEmbeddedOptions(exOptions) : null);
    const cmdOptions = store_1.get_cOptions();
    const fallOpts = cmdOptions && run_commands_1.parseFallbackOptions(cmdOptions);
    const fStatus = cmdOptions && cmdOptions.$f;
    if (exOptions && typeof exOptions === "object" || fallOpts || fStatus) {
      const originalOptions = key_mappings_1.normalizedOptions_(registryEntry);
      registryEntry = entryReadonly ? Object.assign({}, registryEntry) : registryEntry;
      let newOptions = BgUtils_.safeObj_();
      exOptions && run_commands_1.copyCmdOptions(newOptions, BgUtils_.safer_(exOptions));
      fallOpts && run_commands_1.copyCmdOptions(newOptions, BgUtils_.safer_(fallOpts));
      originalOptions && run_commands_1.copyCmdOptions(newOptions, originalOptions);
      newOptions.$f = fStatus;
      exOptions && "$count" in exOptions ? newOptions.$count = exOptions.$count : originalOptions && "$count" in originalOptions && (exOptions && "count" in exOptions || (newOptions.$count = originalOptions.$count));
      registryEntry.options_ = newOptions;
      key_mappings_1.normalizeCommand_(registryEntry, key_mappings_1.availableCommands_[registryEntry.alias_ === 38 /* kBgCmd.runKey */ && registryEntry.background_ ? "runKey" : registryEntry.command_]);
    }
    BgUtils_.resetRe_();
    if (DEBUG) {
      const seq = registryEntry.options_ && typeof registryEntry.options_ === "object" ? registryEntry.options_.$seq : null;
      if (seq) {
        console.log("run next in keySeq[%o] # $retry=%o * %o / %o @ %o", +/\d+/.exec(seq.id)[0], registryEntry.options_.$retry, count, fallbackCounter, Date.now() % 3e5);
      } else {
        const alias = registryEntry.alias_, background = !!registryEntry.background_;
        const def = Object.entries(key_mappings_1.availableCommands_).find(([_, [defAlias, defBg]]) => defAlias === alias && defBg === 1 /* kCmdCxt.bg */ === background);
        console.log("run %o%s # %o * %o / %o @ %o", def[0], registryEntry.command_ !== def[0] ? `(${registryEntry.command_})` : "", registryEntry.options_, count, fallbackCounter, Date.now() % 3e5);
      }
    }
    if (avoidStackOverflow && registryEntry.alias_ === 38 /* kBgCmd.runKey */ && registryEntry.background_) {
      setTimeout(() => {
        store_1.set_cEnv(envInfo);
        run_commands_1.executeCommand(registryEntry, count, store_1.cKey, store_1.cPort, 0, fallbackCounter);
      }, 0);
      return;
    }
    store_1.set_cEnv(envInfo);
    run_commands_1.executeCommand(registryEntry, count, store_1.cKey, store_1.cPort, 0, fallbackCounter);
  };
  /** return whether skip it in help dialog or not */  store_1.set_inlineRunKey_((rootRegistry, path) => {
    var _a, _b, _c, _d;
    /** @note should keep `fullOpts` writable */    let fullOpts = key_mappings_1.normalizedOptions_(rootRegistry);
    fullOpts || (fullOpts = rootRegistry.options_ = BgUtils_.safeObj_());
    if (fullOpts.$normalized === 2) {
      return;
    }
    let keyOpts = fullOpts, canInline = true;
    normalizeExpects(keyOpts);
    keyOpts.$normalized = 2;
    let count = 1;
    if (keyOpts.$count) {
      count = keyOpts.$count;
      keyOpts = fullOpts = run_commands_1.copyCmdOptions(BgUtils_.safeObj_(), keyOpts);
 // auto filter out "$count"
        }
    while (keyOpts && normalizeExpects(keyOpts).length === 0 && keyOpts.keys.length >= 1) {
      let keys = keyOpts.keys, seq = keys[0];
      canInline = canInline && keys.length === 1;
      if (typeof seq === "string") {
        let mask = keyOpts.mask;
        if (mask != null) {
          keyOpts !== fullOpts && (keyOpts = fullOpts = run_commands_1.concatOptions(keyOpts, fullOpts || BgUtils_.safeObj_()));
          const filled = run_commands_1.fillOptionWithMask(seq, mask, "", kRunKeyOptionNames, 1, fullOpts);
          if (!filled.ok) {
            return;
          }
          mask = filled.ok > 0;
          seq = filled.result;
          canInline = canInline && !!filled.value && !filled.useCount && !filled.useDict;
        }
        seq = normalizeKeySeq(seq);
        mask || (keys[0] = seq);
      }
      const first = seq.tree.t === 1 /* kN.list */ ? nextKeyInSeq(seq.tree, 1) : null;
      if (!first) {
        return;
      }
      canInline = canInline && seq.tree.val.length === 1 && seq.tree.val[0] === first;
      const info = exports.parseKeyNode(first), key = info.key;
      const calleeEntry = store_1.keyToCommandMap_.get(key) || findMappedVKey(key);
      if (calleeEntry != null && calleeEntry.alias_ === 38 /* C.runKey */ && calleeEntry.background_) {
        path || (path = [ rootRegistry ]);
        if (path.includes(calleeEntry)) {
          rootRegistry.alias_ = 41 /* C.showHUD */;
          rootRegistry.command_ = "showHUD";
          rootRegistry.options_ = BgUtils_.safer_({
            text: '"runKey" should not call itself'
          });
          return;
        }
        path.push(calleeEntry);
        store_1.inlineRunKey_(calleeEntry, path.slice(0));
      }
      const newName = calleeEntry ? calleeEntry.command_ : key in key_mappings_1.availableCommands_ ? key : null;
      if (!newName) {
        return;
      }
      const doesContinue = calleeEntry != null && calleeEntry.alias_ === 38 /* C.runKey */ && calleeEntry.background_;
      if (!doesContinue && !canInline) {
        rootRegistry.command_ = newName;
        return;
      }
      keyOpts !== fullOpts && (fullOpts = run_commands_1.concatOptions(keyOpts, fullOpts));
      fullOpts = fullOpts.options ? run_commands_1.copyCmdOptions(BgUtils_.safeObj_(), fullOpts.options) : fullOpts.$masked ? null : collectOptions(fullOpts);
 // writable again
            let $count = (_d = (_b = (_a = info.options) === null || _a === void 0 ? void 0 : _a.$count) !== null && _b !== void 0 ? _b : (_c = seq.options) === null || _c === void 0 ? void 0 : _c.$count) !== null && _d !== void 0 ? _d : fullOpts === null || fullOpts === void 0 ? void 0 : fullOpts.$count;
      fullOpts = run_commands_1.concatOptions(run_commands_1.concatOptions(fullOpts, seq.options), info.options);
      fullOpts = !fullOpts || fullOpts !== seq.options && fullOpts !== info.options ? fullOpts : run_commands_1.copyCmdOptions(BgUtils_.safeObj_(), fullOpts);
 // writable again
            if (fullOpts && ("count" in fullOpts || $count != null)) {
        $count = $count != null ? parseFloat($count) || 1 : parseFloat(fullOpts.count || 1) || 1;
        delete fullOpts.count;
      }
      count *= ($count !== null && $count !== void 0 ? $count : 1) * info.count;
      const calleeOptions = calleeEntry && key_mappings_1.normalizedOptions_(calleeEntry);
      if (!doesContinue) {
        fullOpts = run_commands_1.concatOptions(calleeOptions, fullOpts);
        fullOpts && fullOpts === calleeOptions && (fullOpts = run_commands_1.copyCmdOptions(BgUtils_.safeObj_(), fullOpts));
        count !== 1 && ((fullOpts || (fullOpts = BgUtils_.safeObj_())).$count = count);
        Object.assign(rootRegistry, key_mappings_1.makeCommand_(newName, fullOpts));
        return;
      }
      keyOpts = !fullOpts || fullOpts.keys === void 0 && fullOpts.expect === void 0 && fullOpts.mask === void 0 ? calleeOptions || BgUtils_.safeObj_() : fullOpts = run_commands_1.concatOptions(calleeOptions, fullOpts);
    }
  });
});
//#endregion
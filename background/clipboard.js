"use strict";
__filename = "background/clipboard.js";
define([ "require", "exports", "./store", "./utils", "./exclusions", "./normalize_urls" ], (require, exports, store_1, BgUtils_, Exclusions, normalize_urls_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.replaceUsingClipboard = exports.doesNeedToSed = exports.parseSedOptions_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  Exclusions = __importStar(Exclusions);
  const SedActionMap = {
    __proto__: null,
    atob: 8 /* SedAction.base64Decode */ ,
    base64: 9 /* SedAction.base64Encode */ ,
    base64decode: 8 /* SedAction.base64Decode */ ,
    btoa: 9 /* SedAction.base64Encode */ ,
    base64encode: 9 /* SedAction.base64Encode */ ,
    decodeforcopy: 1 /* SedAction.decodeForCopy */ ,
    decode: 1 /* SedAction.decodeForCopy */ ,
    decodeuri: 1 /* SedAction.decodeForCopy */ ,
    decodeurl: 1 /* SedAction.decodeForCopy */ ,
    decodemaybeescaped: 2 /* SedAction.decodeMaybeEscaped */ ,
    decodeall: 19 /* SedAction.decodeAll */ ,
    decodecomp: 2 /* SedAction.decodeMaybeEscaped */ ,
    encode: 10 /* SedAction.encode */ ,
    encodecomp: 11 /* SedAction.encodeComp */ ,
    encodeall: 12 /* SedAction.encodeAll */ ,
    encodeallcomp: 13 /* SedAction.encodeAllComp */ ,
    unescape: 3 /* SedAction.unescape */ ,
    upper: 4 /* SedAction.upper */ ,
    lower: 5 /* SedAction.lower */ ,
    capitalize: 16 /* SedAction.capitalize */ ,
    capitalizeall: 17 /* SedAction.capitalizeAll */ ,
    camel: 14 /* SedAction.camel */ ,
    camelcase: 14 /* SedAction.camelcase */ ,
    dash: 15 /* SedAction.dash */ ,
    dashed: 15 /* SedAction.dash */ ,
    hyphen: 15 /* SedAction.hyphen */ ,
    normalize: 6 /* SedAction.normalize */ ,
    reverse: 7 /* SedAction.reverseText */ ,
    reversetext: 7 /* SedAction.reverseText */ ,
    break: 99 /* SedAction.return */ ,
    stop: 99 /* SedAction.return */ ,
    return: 99 /* SedAction.return */ ,
    latin: 18 /* SedAction.latin */ ,
    latinize: 18 /* SedAction.latin */ ,
    latinise: 18 /* SedAction.latin */ ,
    noaccent: 18 /* SedAction.latin */ ,
    nodiacritic: 18 /* SedAction.latin */ ,
    json: 20 /* SedAction.json */ ,
    jsonparse: 21 /* SedAction.jsonParse */ ,
    readablejson: 25 /* SedAction.readableJson */ ,
    virtual: 22 /* SedAction.virtually */ ,
    virtually: 22 /* SedAction.virtually */ ,
    dryrun: 22 /* SedAction.virtually */ ,
    inc: 23 /* SedAction.inc */ ,
    dec: 24 /* SedAction.dec */ ,
    increase: 23 /* SedAction.inc */ ,
    decrease: 24 /* SedAction.dec */ ,
    length: 26 /* SedAction.length */ ,
    rows: 27
 /* SedAction.rows */  };
  const kDirectClipNameRe = /^[<>][\w\x80-\ufffd]{1,8}!?$|^[\w\x80-\ufffd]{1,8}!?>$/;
  let staticSeds_ = null, timeoutToClearInnerClipboard_ = 0;
  const parseSeds_ = (text, fixedContexts) => {
    const result = [];
    const sepReCache = new Map;
    for (let line of text.replace(/\\(?:\n|\\\n[^\S\n]*)/g, "").split("\n")) {
      line = line.trim();
      kDirectClipNameRe.test(line) && (line = `s/^//,${line[0] === ">" ? "copy" : "paste"}=${line.endsWith(">") ? line.slice(0, -1) : line.slice(1)}`);
      const prefix = /^([\w\x80-\ufffd]{1,8})([^\x00- \w\\\x7f-\uffff])/.exec(line);
      if (!prefix) {
        continue;
      }
      let sep = prefix[2], sepRe = sepReCache.get(sep);
      if (!sepRe) {
        const s = BgUtils_.encodeUnicode_(sep);
        sepRe = new RegExp(`^((?:\\\\[^]|[^${s}\\\\])+)${s}(.*)${s}([a-z]{0,9})(?:,|$)`);
        sepReCache.set(sep, sepRe);
      }
      const body = sepRe.exec(line = line.slice(prefix[0].length));
      if (!body) {
        continue;
      }
      const head = prefix[1], flags = body[3], tail = line.slice(body[0].length), actions = [];
      let host = null, retainMatched = 0, activeTab = null;
      for (const rawI of tail ? tail.split(",") : []) {
        const i = rawI.toLowerCase();
        if (i.startsWith("host=")) {
          host = rawI.slice(5);
        } else if (/^active-?tab=/.test(i)) {
          activeTab = rawI.slice(i[9] === "=" ? 10 : 11);
        } else if (i.startsWith("match")) {
          retainMatched = Math.max(i.includes("=") && parseInt(i.split("=")[1]) || 1, 1);
        } else if (i.includes("=")) {
          actions.push(i);
        } else {
          let action = SedActionMap[i.replace(/[_-]/g, "")] || 0 /* SedAction.NONE */;
          action && actions.push(action);
        }
      }
      const matchRe = BgUtils_.makeRegexp_(body[1], retainMatched ? flags.replace(/g/g, "") : flags);
      matchRe && result.push({
        contexts_: fixedContexts || parseSedKeys_(head),
        host_: host,
        match_: matchRe,
        retainMatched_: retainMatched,
        replace_: decodeSlash_(body[2], 1),
        actions_: actions,
        activeTab_: activeTab
      });
    }
    return result;
  };
  const decodeSlash_ = (text, numbersInRe) => text.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[^])|\$[0$]/g, (raw, s) => s ? s[0] === "x" || s[0] === "u" ? (s = String.fromCharCode(parseInt(s.slice(1), 16)), 
  s === "$" ? s + s : s) : s === "t" ? "\t" : s === "r" ? "\r" : s === "n" ? "\n" : numbersInRe ? s === "0" ? "$&" : s >= "1" && s <= "9" ? "$" + s : s : s : numbersInRe && raw === "$0" ? "$&" : raw);
  const convertCaseWithLocale = (text, action) => {
    const camel = action === 14 /* SedAction.camel */ , dash = action === 15 /* SedAction.dash */ , cap = action === 16 /* SedAction.capitalize */;
    const capAll = action === 17 /* SedAction.capitalizeAll */;
    const re = new RegExp(camel || dash ? "(?:[-_\\t\\r\\n/+\\u2010-\\u2015\\p{Z}]|(\\p{N})|^)(\\p{Ll}|\\p{Lu}+\\p{Ll}?)|[\\t\\r\\n/+]" : cap || capAll ? "(\\b|_)\\p{Ll}" : "", cap ? "u" : "ug");
    let count = 0, start = 0;
    const toLower = (s, lower) => lower ? s.toLocaleLowerCase() : s.toLocaleUpperCase();
    text = camel || dash ? text.replace(re, (s, p, b, i) => {
      const resetStart = "\t\r\n/+".includes(s[0]);
      const isFirst = resetStart || !count++ && text.slice(start, i).toUpperCase() === text.slice(start, i).toLowerCase();
      if (resetStart) {
        count = 0;
        start = i + 1;
      }
      b = b ? b.length > 2 && b.slice(-1).toLowerCase() === b.slice(-1) && !/^e?s\b/.test(text.substr(i + s.length - 1, 3)) ? dash ? toLower(b.slice(0, -2), true) + "-" + toLower(b.slice(-2), true) : toLower(b[0], isFirst) + toLower(b.slice(1, -2), true) + toLower(b.slice(-2, -1), false) + b.slice(-1) : dash ? toLower(b, true) : toLower(b[0], isFirst) + toLower(b.slice(1), true) : "";
      return (resetStart ? s[0] : (p || "") + (p || dash && !isFirst ? "-" : "")) + b;
    }) : cap || capAll ? text.replace(re, s => toLower(s, false)) : text;
    dash && (text = text.replace(/\p{Ll}(\p{Lu}+\p{Ll}?)/u, (s, b, i) => {
      // s[0] + "-" + toLower(s.slice(1), true))
      b = b.length > 2 && b.slice(-1).toLowerCase() === b.slice(-1) && !/^e?s\b/.test(text.substr(i + s.length - 1, 3)) ? toLower(b.slice(0, -2), true) + "-" + toLower(b.slice(-2), true) : toLower(b, true);
      return s[0] + "-" + b;
    }));
    return text;
  };
  const latinize = text => text.replace(/\p{Diacritic}/gu, "");
  const jsonToEmbed = text => {
    text = JSON.stringify(text).slice(1, -1);
    /** encode OPs in `parseKeySeq` and `parseEmbeddedOptions` from {@see ./run_keys.ts} */    text = text.replace(/[<\s"$%&#()?:+,;]/g, BgUtils_.encodeUnicode_);
    return text;
  };
  const tryParseJSON = text => {
    text = text[0] === '"' ? text.slice(1, text.endsWith('"') ? -1 : void 0) : text;
    text = text.replace(/[\r\n\0]/g, s => s < "\n" ? "\\0" : s > "\n" ? "\\r" : "\\n");
    text = `"${text}"`;
    return BgUtils_.tryParse(text);
  };
  const parseSedOptions_ = sed => {
    if (sed.$sed != null) {
      return sed.$sed;
    }
    let r = sed.sed, k = sed.sedKeys || sed.sedKey;
    return r != null || k || k === 0 ? r && typeof r === "object" ? r instanceof Array || r.r == null && !r.k ? null : r : sed.$sed = {
      r: typeof r === "number" ? r + "" : r,
      k: typeof k === "number" ? k + "" : k
    } : null;
  };
  exports.parseSedOptions_ = parseSedOptions_;
  const parseSedKeys_ = (keys, parsed) => {
    if (typeof keys === "object") {
      return keys.normal_ || keys.extras_ ? keys : parsed ? parsed.k = null : null;
    }
    let extras_ = null, normal_ = 0 /* SedContext.NONE */;
    let keysStr = typeof keys === "number" ? keys + "" : keys;
    if (keysStr[0] === "_") {
      extras_ = [ keysStr.slice(1) ];
      keysStr = "";
    }
    for (let i = 0; i < keysStr.length; i++) {
      const code = keysStr.charCodeAt(i), ch = code & -33 /* kCharCode.CASE_DELTA */;
      if (!(ch > 64 /* kCharCode.maxNotAlphabet */ && ch < 91 /* kCharCode.minNotAlphabet */)) {
        extras_ || (extras_ = []);
        !parsed && extras_.includes(code) || extras_.push(code);
        continue;
      }
      normal_ |= ch === 83 /* kCharCode.S */ ? 32772 /* SedContext.paste */ : 1 << ch - 65 /* kCharCode.A */;
    }
    const result = normal_ || extras_ ? {
      normal_,
      extras_
    } : null;
    return parsed ? parsed.k = result : result;
  };
  const intersectContexts = (a, b) => {
    if (a.normal_ & b.normal_) {
      return true;
    }
    const e2 = b.extras_;
    if (!a.extras_ || !e2) {
      return false;
    }
    for (const i of a.extras_) {
      if (e2.includes(i)) {
        return true;
      }
    }
    return false;
  };
  const doesNeedToSed = (context, sed) => {
    if (sed && (sed.r === false || sed.r && sed.r !== true)) {
      return sed.r !== false;
    }
    // if (!sed || sed.r === false || !sed.k && )
        const contexts = sed && sed.k && parseSedKeys_(sed.k, sed) || (context ? {
      normal_: context,
      extras_: null
    } : null);
    staticSeds_ || contexts && (staticSeds_ = parseSeds_(store_1.settingsCache_.clipSub, null));
    for (const item of contexts ? staticSeds_ : []) {
      if (intersectContexts(item.contexts_, contexts)) {
        return true;
      }
    }
    return false;
  };
  exports.doesNeedToSed = doesNeedToSed;
  const convertJoinedRules = rules => {
    rules.startsWith(",") && (rules = "s/^//" + rules);
    return rules.includes("\n") ? rules : rules.replace(/(?<!\\) ([\w\x80-\ufffd]{1,8})(?![\x00- \w\\\x7f-\uffff])/g, "\n$1");
  };
  const replaceUsingClipboard = (text, item, lastCleanTimer) => {
    const rawReplacement = item.replace_;
    if (!rawReplacement.includes("${")) {
      return text.replace(item.match_, rawReplacement);
    }
    const toCopy = new Map;
    const referred = new Map;
    const replacement = rawReplacement.replace(/\$(?:\$|\{([^}]*)})/g, (f, s1) => {
      if (!s1) {
        return f;
      }
      const arr = s1.split(/>(?=[\w\x80-\ufffd]{1,8}!?$)/);
      if (arr.length > 1 && arr[0]) {
        let key = arr[0], clipName = arr[1];
        key = key === "0" || key === "$0" ? "&" : key[0] === "$" ? key.slice(1) : key.length === 1 ? key : {
          input: "_",
          lastMatch: "&",
          lastParen: "+",
          leftContext: "`",
          rightContext: "'"
        }[key] || "1";
        toCopy.has(clipName) ? toCopy.get(clipName).push(key) : toCopy.set(clipName, [ key ]);
        return "$" + key;
      }
      const cmd = s1.replace(/^<|>$/, ""), opArr = /\|\|=|[+\-*\/\|]=?|=/.exec(cmd);
      let name = opArr ? cmd.slice(0, opArr.index) : cmd, value = store_1.readInnerClipboard_(name);
      if (opArr && (value || "||=".includes(opArr[0]))) {
        let op = opArr[0], alg = op[0], x = +cmd.slice(name.length + op.length) || 0, y = +value;
        if (!isNaN(y || x)) {
          y = alg === "+" ? y + x : alg === "-" ? y - x : alg === "*" ? y * x : alg === "/" ? y / x : op === "||=" ? y || x : alg === "|" ? y | x : x;
          value = y + "";
          op.endsWith("=") && (timeoutToClearInnerClipboard_ !== lastCleanTimer ? store_1.innerClipboard_.set(name, value) : writeInnerClipboard_(name, value));
        }
      }
      return value.replace(/\$/g, "$$$$");
    });
    text = text.replace(item.match_, toCopy.size ? function() {
      const args = arguments, len = args.length, index = args[len - 2];
      return replacement.replace(/\$([$1-9_&+`'])/g, (_, s) => {
        if (s === "$") {
          return "$";
        }
        const value = s === "_" ? text : s === "&" ? args[0] : s === "`" ? text.slice(0, index) : s === "'" ? text.slice(index + args[0].length) : len - 3 <= 0 ? "" : s >= "1" && s < "9" ? +s <= len - 2 ? args[+s] : "" : s === "+" ? args[len - 3] : args[1];
        referred.set(s, value);
        return value;
      });
    } : replacement);
    toCopy.forEach((refs, clipName) => {
      const value = refs.reduce((oldValue, ref) => oldValue || referred.get(ref) || "", "");
      timeoutToClearInnerClipboard_ !== lastCleanTimer ? store_1.innerClipboard_.set(clipName, value) : writeInnerClipboard_(clipName, value);
    });
    return text;
  };
  exports.replaceUsingClipboard = replaceUsingClipboard;
  store_1.set_substitute_((input, normalContext, mixedSed, exOut) => {
    var _a, _b, _c;
    let rules = mixedSed && typeof mixedSed === "object" ? mixedSed.r : mixedSed;
    if (rules === false) {
      return input;
    }
    let arr = staticSeds_ || (staticSeds_ = parseSeds_(store_1.settingsCache_.clipSub, null));
    if (rules && (typeof rules === "number" || typeof rules === "string" && rules.length <= 8 && !/[^\w\x80-\ufffd]/.test(rules))) {
      mixedSed = {
        r: null,
        k: rules
      };
      rules = null;
    }
    let contexts = mixedSed && typeof mixedSed === "object" && (mixedSed.k || mixedSed.k === 0) && parseSedKeys_(mixedSed.k, mixedSed) || (normalContext ? {
      normal_: normalContext,
      extras_: null
    } : null);
    // note: `sed` may come from options of key mappings, so here always convert it to a string
        if (rules && rules !== true) {
      contexts || (arr = []);
      arr = parseSeds_(convertJoinedRules(rules + ""), contexts || (contexts = {
        normal_: 1073741824 /* SedContext.NO_STATIC */ ,
        extras_: null
      })).concat(arr);
    }
    const lastCleanTimer = timeoutToClearInnerClipboard_;
    let activeTabUrl_;
    for (const item of contexts ? arr : []) {
      if (intersectContexts(item.contexts_, contexts) && (!item.host_ || (typeof item.host_ === "string" && (item.host_ = Exclusions.createSimpleUrlMatcher_(item.host_) || -1), 
      item.host_ !== -1 && Exclusions.matchSimply_(item.host_, input))) && (!item.activeTab_ || (activeTabUrl_ == null && (activeTabUrl_ = ((_c = (_b = (_a = store_1.framesForTab_.get(store_1.curTabId_)) === null || _a === void 0 ? void 0 : _a.top_) === null || _b === void 0 ? void 0 : _b.s) === null || _c === void 0 ? void 0 : _c.url_) || ""), 
      typeof item.activeTab_ === "string" && (item.activeTab_ = Exclusions.createSimpleUrlMatcher_(item.activeTab_) || -1), 
      activeTabUrl_ && item.activeTab_ !== -1 && Exclusions.matchSimply_(item.activeTab_, activeTabUrl_)))) {
        let end = -1;
        let text = input;
        if (item.retainMatched_) {
          let first_group, start = 0, retain = item.retainMatched_;
          text.replace(item.match_, function(matched_text) {
            const args = arguments;
            start = args[args.length - 2], end = start + matched_text.length;
            first_group = args.length > 2 + retain && args[retain] || "";
            return "";
          });
          if (end >= 0) {
            const newText = exports.replaceUsingClipboard(text, item, lastCleanTimer);
            text = newText.slice(start, newText.length - (text.length - end)) || first_group || text.slice(start, end);
          }
        } else if (item.match_.test(text)) {
          end = item.match_.lastIndex = 0;
          text = exports.replaceUsingClipboard(text, item, lastCleanTimer);
        }
        if (end < 0) {
          const elseVal = (item.actions_.find(i => typeof i === "string" && i.startsWith("else=")) || "").slice(5);
          if (elseVal) {
            if (SedActionMap[elseVal] === 99 /* SedAction.return */) {
              break;
            }
            /^[\w\x80-\ufffd]{1,8}$/.test(elseVal) && (contexts = parseSedKeys_(elseVal));
          }
          continue;
        }
        let doesReturn = false;
        for (const action of item.actions_) {
          if (typeof action === "string") {
            const actionName = action.split("=")[0], actionVal = action.slice(actionName.length + 1);
            actionName === "copy" ? writeInnerClipboard_(actionVal, text) : actionName === "paste" ? text = store_1.readInnerClipboard_(actionVal) : actionName === "keyword" && exOut ? exOut.keyword_ = actionVal : actionName === "act" && exOut ? exOut.actAnyway_ = actionVal !== "false" : actionName !== "sys-clip" && actionName !== "sysclip" || !exOut || (exOut.noSysClip_ = /^-1$|^false$|^non?e?$|null$/i.test(actionName));
            continue;
          }
          if (doesReturn = action === 99 /* SedAction.return */) {
            break;
          }
          //#region character manipulation
                    text = text ? action === 1 /* SedAction.decodeForCopy */ ? BgUtils_.decodeUrlForCopy_(text) : action === 2 /* SedAction.decodeMaybeEscaped */ ? BgUtils_.decodeEscapedURL_(text) : action === 19 /* SedAction.decodeAll */ ? BgUtils_.decodeEscapedURL_(text, true) : action === 3 /* SedAction.unescape */ ? decodeSlash_(text) : action === 4 /* SedAction.upper */ ? text.toLocaleUpperCase() : action === 5 /* SedAction.lower */ ? text.toLocaleLowerCase() : action === 10 /* SedAction.encode */ ? BgUtils_.encodeAsciiURI_(text) : action === 11 /* SedAction.encodeComp */ ? BgUtils_.encodeAsciiComponent_(text) : action === 12 /* SedAction.encodeAll */ ? encodeURI(text) : action === 13 /* SedAction.encodeAllComp */ ? encodeURIComponent(text) : action === 8 /* SedAction.base64Decode */ ? BgUtils_.base64_(text, 1) : action === 9 /* SedAction.base64Encode */ ? BgUtils_.base64_(text) : action === 20 /* SedAction.json */ ? jsonToEmbed(text) : action === 25 /* SedAction.readableJson */ ? JSON.stringify(text).slice(1, -1) : action === 21 /* SedAction.jsonParse */ ? tryParseJSON(text) : action === 23 /* SedAction.inc */ ? +text + 1 + "" : action === 24 /* SedAction.dec */ ? +text - 1 + "" : action === 26 /* SedAction.length */ ? text.length + "" : action === 27 /* SedAction.rows */ ? text.split("\n").length + "" : (text = action === 6 /* SedAction.normalize */ || action === 7 /* SedAction.reverseText */ || action === 18 /* SedAction.latin */ ? text.normalize(action === 18 /* SedAction.latin */ ? "NFD" : "NFC") : text, 
          action === 7 /* SedAction.reverseText */ ? Array.from(text).reverse().join("") : action === 18 /* SedAction.latin */ ? latinize(text) : action === 14 /* SedAction.camel */ || action === 15 /* SedAction.dash */ || action === 16 /* SedAction.capitalize */ || action === 17 /* SedAction.capitalizeAll */ ? convertCaseWithLocale(text, action) : text) : "";
          //#endregion
                }
        if (!item.actions_.includes(22 /* SedAction.virtually */)) {
          input = text;
          if (doesReturn) {
            break;
          }
        }
      }
    }
    BgUtils_.resetRe_();
    return input;
  });
  const writeInnerClipboard_ = (name, text) => {
    store_1.innerClipboard_.set(name, text);
    if (name.endsWith("!")) {
      return;
    }
    timeoutToClearInnerClipboard_ && clearTimeout(timeoutToClearInnerClipboard_);
    timeoutToClearInnerClipboard_ = setTimeout(() => {
      const keys = store_1.innerClipboard_.keys();
      for (const i of keys) {
        i.endsWith("!") || store_1.innerClipboard_.delete(i);
      }
      timeoutToClearInnerClipboard_ = 0;
    }, 45e3);
  };
  store_1.set_readInnerClipboard_(name => {
    const val = store_1.innerClipboard_.get(name);
    return (val !== null && val !== void 0 ? val : store_1.innerClipboard_.get(name.endsWith("!") ? name.slice(0, -1) : name + "!")) || "";
  });
  const format_ = (data, join, sed, keyword, noAutoTrim, exOut) => {
    var _a;
    const oriKeyword = keyword;
    const createSearchToCopy = data => {
      const pattern = store_1.searchEngines_.map.get(keyword);
      return pattern ? normalize_urls_1.createSearch_(data.trim().split(BgUtils_.spacesRe_), pattern.url_, pattern.blank_) : data;
    };
    const maySed = (sed && typeof sed === "object" ? sed.r : sed) !== false;
    if (typeof data !== "string") {
      data = data.map(i => {
        var _a;
        const exSubOut = {}, s = store_1.substitute_(i, 4 /* SedContext.copy */ , sed, exSubOut);
        keyword = (_a = exSubOut.keyword_) !== null && _a !== void 0 ? _a : oriKeyword;
        return keyword ? createSearchToCopy(s) : s;
      });
      data = typeof join === "string" && join.startsWith("json") ? JSON.stringify(data, null, +join.slice(4) || 2) : data.join(join !== !!join && join || "\n") + (data.length > 1 && (!join || join === !!join) ? "\n" : "");
      maySed && (data = store_1.substitute_(data, 4096 /* SedContext.multiline */ , null, exOut));
      return data;
    }
    data = data.replace(/\xa0/g, " ").replace(/\r\n?/g, "\n");
    let i = data.charCodeAt(data.length - 1);
    noAutoTrim || !maySed || i !== 32 /* kCharCode.space */ && i !== 9 /* kCharCode.tab */ || ((i = data.lastIndexOf("\n") + 1) ? data = data.slice(0, i) + data.slice(i).trimRight() : (i = data.charCodeAt(0)) !== 32 /* kCharCode.space */ && i !== 9 /* kCharCode.tab */ && (data = data.trimRight()));
    data = store_1.substitute_(data, 4 /* SedContext.copy */ , sed, exOut);
    keyword = (_a = exOut.keyword_) !== null && _a !== void 0 ? _a : oriKeyword;
    data = keyword ? createSearchToCopy(data) : data;
    return data;
  };
  const reformat_ = (data, sed, exOut) => {
    if (data) {
      data = data.replace(/\xa0/g, " ");
      data = store_1.substitute_(data, 32768 /* SedContext.paste */ , sed, exOut);
    }
    return data;
  };
  const detectClipSed = (sed, prefix) => {
    const singleRule = sed && (typeof sed === "string" ? sed : typeof sed === "object" && (sed.r || sed.k));
    const clip = singleRule && typeof singleRule === "string" && (singleRule[0] === prefix || singleRule.endsWith(">")) && kDirectClipNameRe.test(singleRule) ? singleRule[0] === prefix ? singleRule.slice(1) : singleRule.slice(0, -1) : null;
    return clip;
  };
  store_1.set_copy_((data, join, sed, keyword, noAutoTrim) => {
    const clip = detectClipSed(sed, ">"), exOut = {};
    clip && (sed = null);
    data = format_(data, join, sed, keyword, noAutoTrim, exOut);
    if (clip) {
      writeInnerClipboard_(clip, data);
      return data;
    }
    if (!data || exOut.noSysClip_) {
      return data;
    }
    return store_1.runOnTee_(5 /* kTeeTask.Copy */ , data, null).then(() => data);
  });
  store_1.set_paste_((sed, newLenLimit, exOut) => {
    const clip = detectClipSed(sed, "<");
    if (clip) {
      return reformat_(store_1.readInnerClipboard_(clip), null, exOut);
    }
    return store_1.runOnTee_(3 /* kTeeTask.Paste */ , newLenLimit || 0, null).then(s => typeof s === "string" ? s && reformat_(s.slice(0, 20971520 /* GlobalConsts.MaxBufferLengthForPastingLongURL */), sed, exOut) : null);
  });
  store_1.updateHooks_.clipSub = () => {
    staticSeds_ = null;
  };
  Object.assign(globalThis, {
    parseSeds_,
    staticSeds_() {
      return staticSeds_;
    }
  });
});
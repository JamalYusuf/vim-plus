"use strict";
__filename = "background/key_mappings.js";
define([ "require", "exports", "./store", "./utils", "./utils", "./settings", "./exclusions" ], (require, exports, store_1, BgUtils_, utils_1, settings_, Exclusions) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.visualKeys_ = exports.visualGranularities_ = exports.availableCommands_ = exports.getNextOnIfElse_ = exports.normalizedOptions_ = exports.makeCommand_ = exports.normalizeCommand_ = exports.parseOptions_ = exports.stripKey_ = exports.keyMappingErrors_ = exports.shortcutRegistry_ = exports.envRegistry_ = exports.keyRe_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  settings_ = __importStar(settings_);
  Exclusions = __importStar(Exclusions);
  const parseVal_ = utils_1.tryParse;
  const keyRe_ = /<(?!<)(?:.-){0,4}.\w*?(?::i)?>|./g;
 /* need to support "<<left>" */  exports.keyRe_ = keyRe_;
  let builtinOffset_;
  let shortcutRegistry_;
  exports.shortcutRegistry_ = shortcutRegistry_;
  let envRegistry_;
  exports.envRegistry_ = envRegistry_;
  let flagDoesCheck_ = true;
  let errors_ = null;
  exports.keyMappingErrors_ = errors_;
  let nonNumList_;
  const stripKey_ = key => key.length > 1 ? key === "<escape>" ? "esc" /* kChar.esc */ : key.slice(1, -1) : key;
  exports.stripKey_ = stripKey_;
  const wrapKey_ = key => key.length > 1 ? `<${key}>` : key;
  const getOptions_ = (line, start) => line.length <= start ? null : line.includes(" $", start) || line.includes(" =", start) ? exports.parseOptions_(line.slice(start + 1), line.includes(" $if=", start) ? 0 : 1) : line.slice(start + 1);
  exports.parseOptions_ = (options_line, type) => {
    let opt = BgUtils_.safeObj_(), hasOpt = 0;
    for (let str of options_line.split(" ")) {
      const ind = str.indexOf("=");
      if ("$#/=_".includes(str[0])) {
        if (ind === 0 || str === "__proto__" || str[0] === "$" && !"$if=$key=$desc=$count=$then=$else=$retry=".includes(str.slice(0, ind + 1))) {
          type < 2 && logError_("%s option key:", ind === 0 ? "Missing" : "Unsupported", str);
          continue;
        }
        if (str[0] === "#" || str.startsWith("//")) {
          // treat the following as comment
          break;
        }
      }
      if (ind < 0) {
        opt[str] = true;
        hasOpt = 1;
      } else {
        const val = str.slice(ind + 1);
        str = str.slice(0, ind);
        opt[str] = type === 2 ? val && parseVal_limited(val) : type === 1 ? 1 : val && parseVal_(val);
        hasOpt = 1;
      }
    }
    return hasOpt === 1 ? type === 1 ? options_line : opt : null;
  };
  const parseVal_limited = val => {
    let n;
    return val !== "false" && (val === "null" ? null : val === "true" || ((val >= "0" ? val < ":" /* kChar.minNotNum */ : val[0] === "-") ? (n = parseFloat(val)) + "" === val ? n : /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]\d+)?$/.test(val) ? isNaN(n) ? parseVal_(val) : n : val : '{["'.includes(val[0]) ? parseVal_(val) : val));
  };
  const normalizeCommand_ = (cmd, details) => {
    let options = cmd.options_;
    details === void 0 && (details = exports.availableCommands_[cmd.command_]);
    let opt;
    opt = details.length < 4 ? null : BgUtils_.safer_(details[3]);
    typeof options === "string" && (options = exports.parseOptions_(options, 3));
    if (options) {
      if ("$count" in options || "count" in options) {
        details[2] === 1 ? delete options.$count : options.$count = options.$count != null ? parseFloat(options.$count) || 1 : (parseFloat(options.count || 1) || 1) * (opt && opt.$count || 1);
        delete options.count;
      }
      if (options.$if) {
        if (doesMatchEnv_(options) === false) {
          return false;
        }
        delete options.$if;
      }
      opt && BgUtils_.extendIf_(options, opt);
      if (details[0] === 2 /* kFgCmd.linkHints */ && !details[1] &&  normalizeLHOptions_(options, cmd)) {
        return true;
      }
    } else {
      options = opt;
    }
    cmd.options_ = options;
    return true;
  };
  exports.normalizeCommand_ = normalizeCommand_;
  const normalizeLHOptions_ = (lhOpt, cmd) => {
    let mode = lhOpt.mode, stdMode = lhOpt.m;
    const rawChars = lhOpt.characters;
    const action = lhOpt.action;
    const button = lhOpt.button;
    const chars = rawChars && typeof rawChars === "string" ? BgUtils_.dedupChars_(settings_.updatePayload_("c", rawChars)) : null;
    const inQueue = typeof mode === "string" && mode.endsWith(".queue");
    if (chars && chars.length < 4 /* GlobalConsts.MinHintCharSetSize */) {
      cmd.alias_ = 41 /* kBgCmd.showHUD */;
      cmd.background_ = 1;
      cmd.options_ = BgUtils_.safer_({
        text: "Too few characters for LinkHints",
        isError: true
      });
      cmd.repeat_ = 1;
      return true;
    }
    chars ? lhOpt.c = chars : "c" in lhOpt && delete lhOpt.c;
    rawChars != null && delete lhOpt.characters;
    "action" in lhOpt && delete lhOpt.action;
    "mode" in lhOpt && delete lhOpt.mode;
    mode = action ? hintModes_[action] : typeof mode === "number" ? mode : typeof mode === "string" ? hintModes_[mode.split(".", 1)[0]] : null;
    mode = mode != null ? mode : Math.max(0, stdMode | 0);
    mode > 33 /* HintMode.max_mouse_events */ && (mode = mode === 65 /* HintMode.EDIT_TEXT */ ? lhOpt.url ? 64 /* HintMode.EDIT_LINK_URL */ : mode : mode === 40 /* HintMode.COPY_TEXT */ ? lhOpt.url ? lhOpt.join != null ? 59 /* HintMode.list */ : 42 /* HintMode.COPY_URL */ : lhOpt.join != null ? 57 /* HintMode.list */ : mode : mode > 79 ? mode - 16 /* HintMode.queue */ : mode);
    inQueue && (mode = mode < 64 /* HintMode.min_disable_queue */ ? mode | 16 /* HintMode.queue */ : mode);
    button != null && (lhOpt.button = typeof button === "string" ? button === "right" || button === "auxclick" ? 2 : button.startsWith("mid") || button.startsWith("aux") ? 1 : 0 : Math.max(0, Math.min(button | 0, 2)));
    lhOpt.xy !== void 0 && (lhOpt.xy = BgUtils_.normalizeXY_(lhOpt.xy));
    if (lhOpt.direct || lhOpt.target) {
      lhOpt.direct = lhOpt.direct || lhOpt.target, lhOpt.directOptions = lhOpt.directOptions || lhOpt.targetOptions;
      delete lhOpt.target, delete lhOpt.targetOptions;
      mode &= -17 /* HintMode.queue */;
    }
    if (lhOpt.hideHud != null) {
      lhOpt.hideHUD || (lhOpt.hideHUD = lhOpt.hideHud);
      delete lhOpt.hideHud;
    }
    mode !== stdMode && (lhOpt.m = mode);
    mode > 63 && (cmd.repeat_ = 1);
  };
  const makeCommand_ = (command, options, details) => {
    details === void 0 && (details = exports.availableCommands_[command]);
    const cmd = {
      alias_: details[0],
      background_: details[1],
      command_: command,
      options_: options || (details.length < 4 ? null : BgUtils_.safer_(details[3])),
      hasNext_: null,
      repeat_: details[2]
    };
    if (options && typeof options === "object" && !exports.normalizeCommand_(cmd, details)) {
      return null;
    }
    return cmd;
  };
  exports.makeCommand_ = makeCommand_;
  const normalizedOptions_ = item => {
    let opts = item.options_;
    if (typeof opts === "string") {
      exports.normalizeCommand_(item);
      opts = item.options_;
    }
    return opts;
  };
  exports.normalizedOptions_ = normalizedOptions_;
  const hasIfOption = (line, start) => {
    let ind;
    return line.length > start && (ind = line.indexOf(" $if=", start)) > 0 && !/ (#|\/\/)/.test(line.slice(start, ind + 2));
  };
  const doesMatchEnv_ = options => {
    let condition = options && typeof options === "object" && options.$if;
    let resultOnMismatch = false;
    if (typeof condition === "string") {
      condition = condition.toLowerCase();
      condition[0] === "!" && (condition = condition.slice(1).trim(), resultOnMismatch = true);
      condition = /(?:mac|win|linux)/.test(condition) ? {
        sys: condition
      } : /(?:chrom|edg|firefox|safari)/.test(condition) ? {
        browser: {
          c: 1 /* BrowserType.Chrome */ ,
          e: condition.includes("edge") && !condition.includes("chrom") ? 4 /* BrowserType.Edge */ : 1 /* BrowserType.Chrome */ ,
          f: 2 /* BrowserType.Firefox */ ,
          s: 8
 /* BrowserType.Safari */        }[condition[0]]
      } : null;
    }
    return condition && typeof condition === "object" ? condition.sys && condition.sys !== store_1.CONST_.Platform_ || condition.browser && !(condition.browser & 1 /* Build.BTypes */) || condition.before && condition.before.replace("v", "") < store_1.CONST_.VerCode_ ? resultOnMismatch : !resultOnMismatch : null;
  };
  const getNextOnIfElse_ = (lines, start) => {
    let skip = true, nested = 0, next = start;
    if (lines[start].startsWith("#if")) {
      const cond = lines[start].slice(4).trim(), ifVal = cond.startsWith("{") ? parseVal_(cond) : cond.split(/#|\/\//)[0];
      skip = ifVal && doesMatchEnv_(BgUtils_.safer_({
        $if: ifVal
      })) === false;
    }
    if (skip) {
      while (++next < lines.length) {
        if (lines[next].startsWith("#endif")) {
          if (--nested < 0) {
            break;
          }
        } else {
          lines[next].startsWith("#if") && nested++;
        }
      }
    }
    return next;
  };
  exports.getNextOnIfElse_ = getNextOnIfElse_;
  const toKeyInInsert = key => `<${key.slice(1, -1) + ":i" /* GlobalConsts.InsertModeId */}>`;
  const parseKeyMappings_ = wholeMappings => {
    let lines, key2, _len, details, tmpInt, regItem, options, useOmniMk, curMkReg, _i = 0, registry = new Map, cmdMap = new Map, envMap = null, noCheck = false, builtinToAdd = null, mkReg = null, omniMkReg = null;
    const colorRed = "color:red", shortcutLogPrefix = 'Shortcut %c"%s"';
    nonNumList_ = null;
    lines = wholeMappings.replace(/\\(?:\n|\\\n[^\S\n]*)/g, "").replace(/[\t ]+/g, " ").split("\n");
    for (;_i < lines.length && (!lines[_i] || (key2 = lines[_i])[0] === "#" /* kMappingsFlag.char0 */); _i++) {
      if (key2 && key2[1] === "!" /* kMappingsFlag.char1 */) {
        key2 = key2.slice(2).trim();
        key2 === "no-check" /* kMappingsFlag.noCheck */ && (noCheck = true);
      }
    }
    flagDoesCheck_ = !noCheck;
    _i >= lines.length || lines[_i] !== "unmapAll" && lines[_i] !== "unmapall" || (builtinToAdd = 0, 
    _i++);
    for (_len = lines.length; _i < _len; _i++) {
      const line = lines[_i].trim();
      if (line < "$" /* kChar.minNotCommentHead */) {
        // mask: /[!"#]/
        if (/^#(?:if|else)\b/.test(line)) {
          _i = exports.getNextOnIfElse_(lines, _i);
          noCheck = false;
        }
        continue;
      }
      const _splitLine = line.split(" ", 3);
      const cmd = _splitLine[0];
      const key = _splitLine.length > 1 ? _splitLine[1] : "";
      const val = _splitLine.length > 2 ? _splitLine[2] : "";
      const knownLen = cmd.length + key.length + val.length + 2;
      let doesPass = noCheck;
      switch (cmd) {
       case "map":
       case "map!":
       case "run":
       case "run!":
        const isRun = cmd === "run";
        details = void 0;
        noCheck || (!key || key.length > 8 && key.includes("<__proto__>") ? logError_('Unsupported key sequence %c"%s"', colorRed, key || '""', `for "${val || ""}"`) : cmd.length === 4 && (key.length < 2 || key.match(keyRe_).length !== 1 || key.slice(-3, -2) === ":") ? logError_('"map!" should only be used for a single long key without mode suffix') : registry.has(key) && !hasIfOption(line, knownLen) ? logError_('Key %c"%s"', colorRed, key, "has been mapped to", registry.get(key).command_) : val ? isRun || (details = exports.availableCommands_[val]) ? !(key >= "0" && key < ":" /* kChar.minNotNum */ || key[0] === "-" /* kChar.minus */) || nonNumList_ && nonNumList_.has(key[0]) ? doesPass = true : logError_('Invalid key: %c"%s"', colorRed, key, "- a first char can not be '-' or numbers, unless before is `unmap " + key[0] + "`") : logError_('Command %c"%s"', colorRed, val, "doesn't exist") : logError_((isRun ? "Lack target when running" : "Lack command when mapping") + ' %c"%s"', colorRed, key));
        if (doesPass) {
          regItem = isRun ? exports.makeCommand_("runKey", getOptions_(` keys="${val.replace(/"|\\/g, "\\$&")}"` + line.slice(knownLen), 0), details) : exports.makeCommand_(val, getOptions_(line, knownLen), details);
          if (regItem) {
            // Object.keys before C38 still yields short keys first for \d+ keys, so here is safe enough
            registry.set(key, regItem);
            cmd.length === 4 && registry.set(toKeyInInsert(key), regItem);
          }
        }
        break;

       case "unmapAll":
       case "unmapall":
        registry = new Map, cmdMap = new Map;
        envMap = nonNumList_ = mkReg = omniMkReg = null, builtinToAdd = 0;
        errors_ && logError_("All key mappings is unmapped, but there %s been %c%d error%s%c before this instruction", errors_.length > 1 ? "have" : "has", colorRed, errors_.length, errors_.length > 1 ? "s" : "", "color:auto");
        break;

       case "mapKey":
       case "mapkey":
        useOmniMk = key.length > 1 && key.slice(-3, -1) === ":o" /* GlobalConsts.OmniModeId */;
        curMkReg = useOmniMk ? omniMkReg : mkReg;
        noCheck ? key2 = exports.stripKey_(key) : !val || line.length > knownLen && !/^(#|\/\/|\$if=\{)/.test(line.slice(knownLen).trimLeft()) ? logError_("mapKey: need %s source and target keys:", val ? "only" : "both", line) : key.length > 1 && !/^<(?!<[^:]|__proto__>)([acms]-){0,4}.\w*(:[a-z])?>$/.test(key) ? logError_("mapKey: a source key should be a single key with an optional mode id:", line) : val.length > 1 && !/^<(?!<|__proto__>)([a-z]-){0,4}.\w*>$/.test(val) ? logError_("mapKey: a target key should be a single key:", line) : (key2 = exports.stripKey_(key), 
        curMkReg && key2 in curMkReg && curMkReg[key2] !== exports.stripKey_(val) ? nonNumList_ && nonNumList_.has(key2[0]) && key2.slice(1) === ":n" /* GlobalConsts.NormalModeId */ ? doesMatchEnv_(getOptions_(line, knownLen)) !== false && logError_("`mapKey %s` and `unmap %s...` can not be used at the same time", key, key2[0]) : hasIfOption(line, knownLen) ? doesPass = true : logError_('The key %c"%s"', colorRed, key, "has been mapped to another key:", curMkReg[key2].length > 1 ? `<${curMkReg[key2]}>` : curMkReg[key2]) : doesPass = true);
        if (doesPass && doesMatchEnv_(getOptions_(line, knownLen)) !== false) {
          if (!curMkReg) {
            curMkReg = BgUtils_.safeObj_();
            useOmniMk ? omniMkReg = curMkReg : mkReg = curMkReg;
          }
          curMkReg[key2] = exports.stripKey_(val);
          (key2.length < 2 || key2.slice(-2, -1) !== ":") && ((omniMkReg || (omniMkReg = BgUtils_.safeObj_()))[key2] = exports.stripKey_(val));
        }
        break;

       case "shortcut":
       case "command":
        noCheck || (val ? !(key.startsWith("userCustomized" /* CNameLiterals.userCustomized */) && key.length > 14) && store_1.CONST_.GlobalCommands_.indexOf(key) < 0 ? logError_(shortcutLogPrefix, colorRed, key, "is not a valid name") : cmdMap.has(key) && !hasIfOption(line, knownLen - 1 - val.length) ? logError_(shortcutLogPrefix, colorRed, key, "has been configured") : doesPass = true : logError_("Lack command name and options in shortcut:", line));
        if (doesPass) {
          options = getOptions_(line, knownLen - 1 - val.length);
          if (doesMatchEnv_(options) !== false) {
            key2 =  setupShortcut_(cmdMap, key, options);
            key2 && logError_(shortcutLogPrefix, colorRed, key, key2);
          }
        }
        break;

       case "env":
        noCheck || (val ? envMap && envMap.has(key) && !hasIfOption(line, knownLen - 1 - val.length) ? logError_('The environment name %c"%s"', colorRed, key, "has been used") : doesPass = true : logError_("Lack conditions in env declaration:", line));
        if (doesPass) {
          options = getOptions_(line, knownLen - 1 - val.length);
          doesMatchEnv_(options) !== false && (envMap || (envMap = new Map)).set(key, options);
        }
        break;

       case "unmap":
       case "unmap!":
        if (!key || val && !"#$".includes(val[0])) {
          logError_(`unmap: ${val ? "only " : ""}needs one mapped key:`, line);
        } else if (doesMatchEnv_(getOptions_(line, cmd.length + key.length + 1)) === false) {} else if (tmpInt = -1, 
        builtinToAdd !== 0 && (tmpInt = (builtinToAdd || (builtinToAdd = defaultKeyMappings_.split(" "))).indexOf(key)) >= 0 && !(tmpInt & 1) || registry.has(key) || key.length > 1 && registry.has(toKeyInInsert(key))) {
          registry.delete(key);
          cmd.length === 6 && key.length > 1 && registry.delete(toKeyInInsert(key));
          tmpInt < 0 || builtinToAdd.splice(tmpInt, 2);
        } else if (key.length === 1 ? key > "/" /* kChar.maxNotNum */ && key < ":" /* kChar.minNotNum */ || key[0] === "-" /* kChar.minus */ : exports.stripKey_(key) === "esc" /* kChar.esc */ || key === "<c-[>") {
          if (key2 = exports.stripKey_(key) + ":n" /* GlobalConsts.NormalModeId */ , mkReg && key2 in mkReg && mkReg[key2] !== "c-v-" /* GlobalConsts.ForcedMapNum */ + key) {
            logError_("`unmap %s...` and `mapKey <%s>` can not be used at the same time", key, key2);
          } else if (key.length === 1 && nonNumList_ && nonNumList_.has(key)) {
            cmd.length !== 6 && logError_('Number prefix: %c"%s"', colorRed, key, "has been unmapped");
          } else {
            key.length === 1 && (nonNumList_ || (nonNumList_ = new Set)).add(key);
            mkReg || (mkReg = BgUtils_.safeObj_());
            mkReg[key2] = "c-v-" /* GlobalConsts.ForcedMapNum */ + (key.length === 1 ? key : key[1] === "e" ? "esc" /* kChar.esc */ : "[");
            key.length > 1 && (mkReg[key2.slice(0, -1) + "i" /* GlobalConsts.InsertModeId */ ] = mkReg[key2]);
          }
        } else {
          cmd.length !== 6 && logError_('Unmap: %c"%s"', colorRed, key, "has not been mapped");
        }
        break;

       default:
        logError_('Unknown mapping command: %c"%s"', colorRed, cmd, "in", line);
        break;
      }
    }
    for (const shortcut of store_1.CONST_.GlobalCommands_) {
      shortcut.startsWith("user") || cmdMap.has(shortcut) || (regItem = exports.makeCommand_(shortcut, null)) && cmdMap.set(shortcut, regItem);
    }
    if (builtinToAdd !== 0) {
      builtinOffset_ = registry.size;
      builtinToAdd || (builtinToAdd = defaultKeyMappings_.split(" "));
      for (_len = builtinToAdd.length, _i = 0; _i < _len; _i += 2) {
        registry.has(builtinToAdd[_i]) || registry.set(builtinToAdd[_i], exports.makeCommand_(builtinToAdd[_i + 1], null));
      }
    }
    store_1.set_keyToCommandMap_(registry);
    exports.shortcutRegistry_ = shortcutRegistry_ = cmdMap;
    exports.envRegistry_ = envRegistry_ = envMap;
    store_1.set_mappedKeyRegistry_(mkReg);
    store_1.omniPayload_.m = omniMkReg;
  };
  const setupShortcut_ = (cmdMap, key, options) => {
    options = options && typeof options === "string" ? exports.parseOptions_(options, 3) : options;
    let regItem, has_cmd = 1, command = options && options.command || (has_cmd = 0, 
    key.startsWith("user") ? "" : key), ret = command ? 1 : 0;
    if (ret && command in exports.availableCommands_) {
      has_cmd && delete options.command;
      (regItem = exports.makeCommand_(command, options)) && cmdMap.set(key, regItem);
      ret = 2;
    }
    return ret < 1 ? 'requires a "command" option' : ret > 1 ? "" : "gets an unknown command";
  };
  const collectMapKeyTypes_ = mapKeys => {
    let types = 0 /* kMapKey.NONE */;
    for (const key in mapKeys) {
      const len = key.length;
      if (len > 2 && key[len - 2] === ":") {
        types |= key[len - 1] === "i" /* GlobalConsts.InsertModeId */ ? 2 /* kMapKey.insertMode */ : key[len - 1] === "n" /* GlobalConsts.NormalModeId */ ? 1 /* kMapKey.normalMode */ : 4 /* kMapKey.otherMode */;
      } else {
        let val = mapKeys[key], longVal = val.length > 1;
        const plainAndWorkInInsert = longVal && (val === "esc" /* kChar.esc */ || val === "c-[" /* kChar.bracketLeft */ || val.startsWith("v-") || (val = val.slice(val.lastIndexOf("-") + 1)) < "f:" /* kChar.minNotF_num */ && val > "f0" /* kChar.maxNotF_num */);
        types |= len > 1 || longVal ? plainAndWorkInInsert ? 40 /* kMapKey.plain_in_insert */ : 8 /* kMapKey.plain */ : key.toUpperCase() !== key && val.toUpperCase() !== val ? 16 /* kMapKey.char */ : 8 /* kMapKey.plain */;
      }
    }
    return types;
  };
  const populateKeyMap_ = value => {
    const ref = new Map, hasFoundChanges = value !== null, isOldWrong = errors_ !== null;
    if (hasFoundChanges) {
      store_1.set_keyFSM_(exports.keyMappingErrors_ = errors_ = null);
            parseKeyMappings_(value);
    }
    const orderedKeys = BgUtils_.keys_(store_1.keyToCommandMap_), doesLog = hasFoundChanges && flagDoesCheck_;
    hasFoundChanges && store_1.set_mappedKeyTypes_((store_1.mappedKeyRegistry_ ? collectMapKeyTypes_(store_1.mappedKeyRegistry_) : 0 /* kMapKey.NONE */) | (orderedKeys.join().includes(":i>") ? 64 /* kMapKey.directInsert */ : 0 /* kMapKey.NONE */));
    let tmp;
    for (let index = 0; index < orderedKeys.length; index++) {
      const key = orderedKeys[index], arr = key.match(keyRe_), last = arr.length - 1;
      const key1 = exports.stripKey_(arr[0]), val1 = ref.get(key1);
      if (index >= builtinOffset_ && val1 !== void 0 && (val1 === 1 /* KeyAction.cmd */ || last === 0 || typeof val1[arr[1]] === "object")) {
        store_1.keyToCommandMap_.delete(key);
        continue;
      }
      if (last === 0) {
        val1 !== void 0 && doesLog && logInactive_(key, val1);
        ref.set(key1, 1 /* KeyAction.cmd */);
        continue;
      }
      if (val1 === 1 /* KeyAction.cmd */) {
        doesLog && logInactive_(arr[0], key);
        continue;
      }
      let ref2 = val1, j = 1;
      val1 || ref.set(key1, ref2 = {});
      while ((tmp = ref2[exports.stripKey_(arr[j])]) && tmp !== 1 /* KeyAction.cmd */ && j < last) {
        j++;
        ref2 = tmp;
      }
      if (tmp === 1 /* KeyAction.cmd */) {
        doesLog && logInactive_(arr.slice(0, j + 1), key);
        continue;
      }
      tmp && doesLog && logInactive_(key, tmp);
      while (j < last) {
        ref2 = ref2[exports.stripKey_(arr[j++])] = {};
      }
      ref2[exports.stripKey_(arr[last])] = 1 /* KeyAction.cmd */;
    }
    if (nonNumList_) {
      for (const nonNumItem of nonNumList_) {
        const j = ref.get(nonNumItem);
        j && ref.set("c-v-" /* GlobalConsts.ForcedMapNum */ + nonNumItem, j);
      }
    }
    if (orderedKeys.length > 0) {
      ref.set("-", 2 /* KeyAction.count */);
      for (let num = 0; num <= 9; num++) {
        ref.set("" + num, 2 /* KeyAction.count */);
      }
    }
    nonNumList_ = null;
    if (hasFoundChanges) {
      if (errors_) {
        if (errors_.length > 1) {
          console.group(errors_.length + " Errors in custom Key mappings:");
          errors_.map(line => console.log(...line));
          console.groupEnd();
        } else {
          console.log.apply(console, errors_[0]);
        }
      } else {
        isOldWrong && console.log("The new key mappings have no errors");
      }
    }
    const maybePassed = Exclusions.getAllPassed_();
    const func = obj => {
      for (const key in obj) {
        const val = obj[key];
        val !== 1 /* KeyAction.cmd */ ? key.startsWith("v-") || func(val) : (maybePassed !== true && ref.get(key) === 1 /* KeyAction.cmd */ && (!maybePassed || !maybePassed.has(key)) && (key.length < 2 || !ref.has(key + ":i" /* GlobalConsts.InsertModeId */)) || key.startsWith("v-") && typeof ref.get(key) !== "object") && delete obj[key];
      }
    };
    ref.forEach((val, key) => {
      key.startsWith("v-") ? val === 1 /* KeyAction.cmd */ && ref.delete(key) : typeof val === "object" && func(val);
    });
    const refSorted = {}, keys2 = BgUtils_.keys_(ref).sort();
    for (const key of keys2) {
      refSorted[key] = ref.get(key);
    }
    store_1.set_keyFSM_(refSorted);
    value && 
     upgradeKeyMappings(value);
  };
  const logInactive_ = (prefix, suffix) => {
    const arr = [], toStr = (prefix, dict) => {
      for (let [k, v] of Object.entries(dict)) {
        k = prefix + wrapKey_(k);
        v === 1 /* KeyAction.cmd */ ? arr.push(k) : toStr(k, v);
      }
    };
    prefix = typeof prefix !== "string" ? prefix.map(wrapKey_).join("") : prefix;
    suffix = typeof suffix !== "string" ? (toStr("", suffix), arr.join(", ")) : suffix.slice(prefix.length);
    logError_('Inactive suffixes: %o under "%s"', suffix, prefix);
  };
  const logError_ = function() {
    (errors_ || (exports.keyMappingErrors_ = errors_ = [])).push([].slice.call(arguments, 0));
  };
  const AsC_ = i => i;
  const defaultKeyMappings_ = "? " + AsC_("showHelp") + " <a-c> " + AsC_("previousTab") + " <a-s-c> " + AsC_("nextTab") + " d " + AsC_("scrollPageDown") + " <c-e> " + AsC_("scrollDown") + " f " + AsC_("LinkHints.activate") + " <f1> " + AsC_("simBackspace") + " <s-f1> " + AsC_("switchFocus") + " <f2> " + AsC_("switchFocus") + " <f8> " + AsC_("enterVisualMode") + " G " + AsC_("scrollToBottom") + " gf " + AsC_("nextFrame") + " gg " + AsC_("scrollToTop") + " gi " + AsC_("focusInput") + " gn " + AsC_("toggleVomnibarStyle") + " gs " + AsC_("toggleViewSource") + " gt " + AsC_("nextTab") + " gu " + AsC_("goUp") + " gF " + AsC_("mainFrame") + " gS " + AsC_("openSidePanel") + " gT " + AsC_("previousTab") + " gU " + AsC_("goToRoot") + " g0 " + AsC_("firstTab") + " g$ " + AsC_("lastTab") + " h " + AsC_("scrollLeft") + " H " + AsC_("goBack") + " i " + AsC_("enterInsertMode") + " j " + AsC_("scrollDown") + " J " + AsC_("previousTab") + " K " + AsC_("nextTab") + " k " + AsC_("scrollUp") + " l " + AsC_("scrollRight") + " L " + AsC_("goForward") + " <a-m> " + AsC_("toggleMuteTab") + " N " + AsC_("performBackwardsFind") + " n " + AsC_("performFind") + " <a-n> " + AsC_("performAnotherFind") + " o " + AsC_("Vomnibar.activate") + " <a-p> " + AsC_("togglePinTab") + " r " + AsC_("reload") + " R " + AsC_("reloadGivenTab") + " <a-r> " + AsC_("reloadTab") + " <a-s-r> " + AsC_("reopenTab") + " t " + AsC_("createTab") + " <a-t> " + AsC_("createTab") + " u " + AsC_("scrollPageUp") + " V " + AsC_("enterVisualLineMode") + " v " + AsC_("enterVisualMode") + " <a-v> " + AsC_("nextTab") + " W " + AsC_("moveTabToNextWindow") + " x " + AsC_("removeTab") + " X " + AsC_("restoreTab") + " yt " + AsC_("duplicateTab") + " yy " + AsC_("copyCurrentUrl") + " yY " + AsC_("copyCurrentTitle") + " yg " + AsC_("toggleTabGroup") + " yG " + AsC_("collapseTabGroup") + " yr " + AsC_("addToReadingList") + " ym " + AsC_("toggleBookmark") + " yp " + AsC_("enterPictureInPicture") + " <c-y> " + AsC_("scrollUp") + " zH " + AsC_("scrollToLeft") + " zL " + AsC_("scrollToRight") + " zd " + AsC_("discardTab") + " gD " + AsC_("openDownloads") + " gH " + AsC_("Vomnibar.activateHistory") + " gW " + AsC_("cycleWindows") + " gA " + AsC_("Vomnibar.activateWindows") + " <a-left> " + AsC_("dockWindowLeft") + " <a-right> " + AsC_("dockWindowRight") + " <a-up> " + AsC_("dockWindowUp") + " <a-down> " + AsC_("dockWindowDown") + " <a-s-m> " + AsC_("dockWindowMax") + " co " + AsC_("closeOtherTabs") + " c> " + AsC_("closeTabsOnRight") + " c< " + AsC_("closeTabsOnLeft") + " yl " + AsC_("showLastDownload") + " / " + AsC_("enterFindMode") + " ` " + AsC_("Marks.activate") + " ^ " + AsC_("visitPreviousTab") + " [[ " + AsC_("goPrevious") + " ]] " + AsC_("goNext") + " << " + AsC_("moveTabLeft") + " >> " + AsC_("moveTabRight") + " b " + AsC_("Vomnibar.activateBookmarks") + " ge " + AsC_("Vomnibar.activateUrl") + " gE " + AsC_("Vomnibar.activateUrlInNewTab") + " m " + AsC_("Marks.activateCreate") + " p " + AsC_("openCopiedUrlInCurrentTab") + " yf " + AsC_("LinkHints.activateCopyLinkUrl") + " B " + AsC_("Vomnibar.activateBookmarksInNewTab") + " F " + AsC_("LinkHints.activateOpenInNewTab") + " O " + AsC_("Vomnibar.activateInNewTab") + " P " + AsC_("openCopiedUrlInNewTab") + " T " + AsC_("Vomnibar.activateTabs") + " <a-f> " + AsC_("LinkHints.activateWithQueue") + " yv " + AsC_("LinkHints.activateSelect") + " yi " + AsC_("LinkHints.activateCopyImage") + ` <a-s-f12> ${AsC_("debugBackground")} <s-f12> focusOptions`;
  exports.availableCommands_ = {
    __proto__: null,
    "LinkHints.activate": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 0
 /* HintMode.DEFAULT */    } ],
    "LinkHints.activateCopyImage": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 36
 /* HintMode.COPY_IMAGE */    } ],
    "LinkHints.activateCopyLinkText": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 40
 /* HintMode.COPY_TEXT */    } ],
    "LinkHints.activateCopyLinkUrl": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 42
 /* HintMode.COPY_URL */    } ],
    "LinkHints.activateDownloadImage": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 35
 /* HintMode.DOWNLOAD_MEDIA */    } ],
    "LinkHints.activateDownloadLink": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 44
 /* HintMode.DOWNLOAD_LINK */    } ],
    "LinkHints.activateEdit": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 1, {
      m: 67
 /* HintMode.FOCUS_EDITABLE */    } ],
    "LinkHints.activateFocus": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 34
 /* HintMode.FOCUS */    } ],
    "LinkHints.activateHover": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 32
 /* HintMode.HOVER */    } ],
    "LinkHints.activateLeave": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 33
 /* HintMode.UNHOVER */    } ],
    "LinkHints.activateMode": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 0
 /* HintMode.DEFAULT */    } ],
    "LinkHints.activateModeToCopyImage": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 36
 /* HintMode.COPY_IMAGE */    } ],
    "LinkHints.activateModeToCopyLinkText": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 40
 /* HintMode.COPY_TEXT */    } ],
    "LinkHints.activateModeToCopyLinkUrl": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 42
 /* HintMode.COPY_URL */    } ],
    "LinkHints.activateModeToDownloadImage": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 35
 /* HintMode.DOWNLOAD_MEDIA */    } ],
    "LinkHints.activateModeToDownloadLink": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 44
 /* HintMode.DOWNLOAD_LINK */    } ],
    "LinkHints.activateModeToEdit": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 1, {
      m: 67
 /* HintMode.FOCUS_EDITABLE */    } ],
    "LinkHints.activateModeToFocus": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 1, {
      m: 34
 /* HintMode.FOCUS */    } ],
    "LinkHints.activateModeToHover": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 32
 /* HintMode.HOVER */    } ],
    "LinkHints.activateModeToLeave": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 33
 /* HintMode.UNHOVER */    } ],
    "LinkHints.activateModeToOpenImage": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 37
 /* HintMode.OPEN_IMAGE */    } ],
    "LinkHints.activateModeToOpenIncognito": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 45
 /* HintMode.OPEN_INCOGNITO_LINK */    } ],
    "LinkHints.activateModeToOpenInNewForegroundTab": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 3
 /* HintMode.OPEN_IN_NEW_FG_TAB */    } ],
    "LinkHints.activateModeToOpenInNewTab": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 2
 /* HintMode.OPEN_IN_NEW_BG_TAB */    } ],
    "LinkHints.activateModeToOpenUrl": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 46
 /* HintMode.OPEN_LINK */    } ],
    "LinkHints.activateModeToOpenVomnibar": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 1, {
      m: 65
 /* HintMode.EDIT_TEXT */    } ],
    "LinkHints.activateModeToSearchLinkText": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 38
 /* HintMode.SEARCH_TEXT */    } ],
    "LinkHints.activateModeToSelect": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 66
 /* HintMode.ENTER_VISUAL_MODE */    } ],
    "LinkHints.activateModeToUnhover": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 33
 /* HintMode.UNHOVER */    } ],
    "LinkHints.activateModeWithQueue": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 18
 /* HintMode.OPEN_WITH_QUEUE */    } ],
    "LinkHints.activateOpenImage": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 37
 /* HintMode.OPEN_IMAGE */    } ],
    "LinkHints.activateOpenIncognito": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 45
 /* HintMode.OPEN_INCOGNITO_LINK */    } ],
    "LinkHints.activateOpenInNewForegroundTab": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 3
 /* HintMode.OPEN_IN_NEW_FG_TAB */    } ],
    "LinkHints.activateOpenInNewTab": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 2
 /* HintMode.OPEN_IN_NEW_BG_TAB */    } ],
    "LinkHints.activateOpenUrl": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 46
 /* HintMode.OPEN_LINK */    } ],
    "LinkHints.activateOpenVomnibar": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 1, {
      m: 65
 /* HintMode.EDIT_TEXT */    } ],
    "LinkHints.activateSearchLinkText": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 38
 /* HintMode.SEARCH_TEXT */    } ],
    "LinkHints.activateSelect": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 66
 /* HintMode.ENTER_VISUAL_MODE */    } ],
    "LinkHints.activateUnhover": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 33
 /* HintMode.UNHOVER */    } ],
    "LinkHints.activateWithQueue": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      m: 18
 /* HintMode.OPEN_WITH_QUEUE */    } ],
    "LinkHints.click": [ 2 /* kFgCmd.linkHints */ , 0 /* kCxt.fg */ , 0, {
      direct: true,
      m: 0
 /* HintMode.DEFAULT */    } ],
    "LinkHints.unhoverLast": [ 7 /* kFgCmd.insertMode */ , 0 /* kCxt.fg */ , 1, {
      u: true
    } ],
    "Marks.activate": [ 11 /* kBgCmd.marksActivate */ , 1 /* kCxt.bg */ , 0 ],
    "Marks.activateCreate": [ 11 /* kBgCmd.marksActivate */ , 1 /* kCxt.bg */ , 0, {
      mode: "create"
    } ],
    "Marks.activateCreateMode": [ 11 /* kBgCmd.marksActivate */ , 1 /* kCxt.bg */ , 0, {
      mode: "create"
    } ],
    "Marks.activateGoto": [ 11 /* kBgCmd.marksActivate */ , 1 /* kCxt.bg */ , 0 ],
    "Marks.activateGotoMode": [ 11 /* kBgCmd.marksActivate */ , 1 /* kCxt.bg */ , 0 ],
    "Marks.clearGlobal": [ 18 /* kBgCmd.clearMarks */ , 1 /* kCxt.bg */ , 1 ],
    "Marks.clearLocal": [ 18 /* kBgCmd.clearMarks */ , 1 /* kCxt.bg */ , 1, {
      local: true
    } ],
    "Vomnibar.activate": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 0 ],
    "Vomnibar.activateBookmarks": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 1, {
      mode: "bookm"
    } ],
    "Vomnibar.activateBookmarksInNewTab": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 1, {
      mode: "bookm",
      newtab: 1
    } ],
    "Vomnibar.activateEditUrl": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 0, {
      url: true
    } ],
    "Vomnibar.activateEditUrlInNewTab": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 0, {
      url: true,
      newtab: 1
    } ],
    "Vomnibar.activateHistory": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 1, {
      mode: "history"
    } ],
    "Vomnibar.activateHistoryInNewTab": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 1, {
      mode: "history",
      newtab: 1
    } ],
    "Vomnibar.activateInNewTab": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 0, {
      newtab: 1
    } ],
    "Vomnibar.activateTabs": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 1, {
      mode: "tab",
      newtab: 1
    } ],
    "Vomnibar.activateTabSelection": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 1, {
      mode: "tab",
      newtab: 1
    } ],
    "Vomnibar.activateWindows": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 1, {
      mode: "window"
    } ],
    "Vomnibar.activateUrl": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 0, {
      url: true
    } ],
    "Vomnibar.activateUrlInNewTab": [ 10 /* kBgCmd.showVomnibar */ , 1 /* kCxt.bg */ , 0, {
      url: true,
      newtab: 1
    } ],
    addBookmark: [ 13 /* kBgCmd.addBookmark */ , 1 /* kCxt.bg */ , /* 20 in all_commands.ts */ 0 ],
    autoCopy: [ 11 /* kFgCmd.autoOpen */ , 0 /* kCxt.fg */ , 1, {
      copy: true
    } ],
    autoOpen: [ 11 /* kFgCmd.autoOpen */ , 0 /* kCxt.fg */ , 1, {
      o: 1
    } ],
    blank: [ 0 /* kBgCmd.blank */ , 1 /* kCxt.bg */ , 0 ],
    captureTab: [ 15 /* kBgCmd.captureTab */ , 1 /* kCxt.bg */ , 1 ],
    clearContentSetting: [ 16 /* kBgCmd.clearCS */ , 1 /* kCxt.bg */ , 1 ],
    clearContentSettings: [ 16 /* kBgCmd.clearCS */ , 1 /* kCxt.bg */ , 1 ],
    clearCS: [ 16 /* kBgCmd.clearCS */ , 1 /* kCxt.bg */ , 1 ],
    clearFindHistory: [ 17 /* kBgCmd.clearFindHistory */ , 1 /* kCxt.bg */ , 1 ],
    closeDownloadBar: [ 49 /* kBgCmd.closeDownloadBar */ , 1 /* kCxt.bg */ , 1, {
      all: 1
    } ],
    closeOtherTabs: [ 35 /* kBgCmd.removeTabsR */ , 1 /* kCxt.bg */ , 1, {
      other: true,
      mayConfirm: true
    } ],
    closeSomeOtherTabs: [ 35 /* kBgCmd.removeTabsR */ , 1 /* kCxt.bg */ , 0 ],
    closeTabsOnLeft: [ 35 /* kBgCmd.removeTabsR */ , 1 /* kCxt.bg */ , 0, {
      $count: -1e6,
      mayConfirm: true
    } ],
    closeTabsOnRight: [ 35 /* kBgCmd.removeTabsR */ , 1 /* kCxt.bg */ , 0, {
      $count: 1e6,
      mayConfirm: true
    } ],
    confirm: [ 1 /* kBgCmd.confirm */ , 1 /* kCxt.bg */ , 0 ],
    copyCurrentTitle: [ 19 /* kBgCmd.copyWindowInfo */ , 1 /* kCxt.bg */ , 1, {
      type: "title"
    } ],
    copyCurrentUrl: [ 19 /* kBgCmd.copyWindowInfo */ , 1 /* kCxt.bg */ , 1 ],
    copyWindowInfo: [ 19 /* kBgCmd.copyWindowInfo */ , 1 /* kCxt.bg */ , 0, {
      type: "window"
    } ],
    createTab: [ 20 /* kBgCmd.createTab */ , 1 /* kCxt.bg */ , 20 ],
    debugBackground: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      reuse: 1 /* ReuseType.reuse */ ,
      url: "chrome://extensions/?id=$id",
      id_mask: "$id",
      url_mask: false
    } ],
    discardTab: [ 21 /* kBgCmd.discardTab */ , 1 /* kCxt.bg */ , /* 20 in all_commands.ts */ 0 ],
    dispatchEvent: [ 9 /* kBgCmd.dispatchEventCmd */ , 1 /* kCxt.bg */ , /** only 1 / -1, in fact */ 0 ],
    duplicateTab: [ 22 /* kBgCmd.duplicateTab */ , 1 /* kCxt.bg */ , 20 ],
    editText: [ 13 /* kFgCmd.editText */ , 0 /* kCxt.fg */ , 0 ],
    enableContentSettingTemp: [ 42 /* kBgCmd.toggleCS */ , 1 /* kCxt.bg */ , 0, {
      incognito: true
    } ],
    enableCSTemp: [ 42 /* kBgCmd.toggleCS */ , 1 /* kCxt.bg */ , 0, {
      incognito: true
    } ],
    enterFindMode: [ 6 /* kBgCmd.performFind */ , 1 /* kCxt.bg */ , 1, {
      active: true,
      selected: "auto-line"
    } ],
    enterInsertMode: [ 3 /* kBgCmd.insertMode */ , 1 /* kCxt.bg */ , 1, {
      insert: true
    } ],
    enterVisualLineMode: [ 12 /* kBgCmd.visualMode */ , 1 /* kCxt.bg */ , 1, {
      mode: "line"
    } ],
    enterVisualMode: [ 12 /* kBgCmd.visualMode */ , 1 /* kCxt.bg */ , 1 ],
    findSelected: [ 6 /* kBgCmd.performFind */ , 1 /* kCxt.bg */ , 0, {
      selected: "line"
    } ],
    findSelectedBackwards: [ 6 /* kBgCmd.performFind */ , 1 /* kCxt.bg */ , 0, {
      selected: "line",
      $count: -1
    } ],
    firstTab: [ 24 /* kBgCmd.goToTab */ , 1 /* kCxt.bg */ , 0, {
      absolute: true
    } ],
    focusInput: [ 12 /* kFgCmd.focusInput */ , 0 /* kCxt.fg */ , 0 ],
    focusOrLaunch: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      reuse: 1
 /* ReuseType.reuse */    } ],
    goBack: [ 18 /* kFgCmd.framesGoBack */ , 0 /* kCxt.fg */ , 0, {
      $count: -1
    } ],
    goForward: [ 18 /* kFgCmd.framesGoBack */ , 0 /* kCxt.fg */ , 0 ],
    goNext: [ 2 /* kBgCmd.goNext */ , 1 /* kCxt.bg */ , 0, {
      sed: true
    } ],
    goPrevious: [ 2 /* kBgCmd.goNext */ , 1 /* kCxt.bg */ , 0, {
      sed: true,
      rel: "prev"
    } ],
    goToRoot: [ 25 /* kBgCmd.goUp */ , 1 /* kCxt.bg */ , 0, {} ],
    goUp: [ 25 /* kBgCmd.goUp */ , 1 /* kCxt.bg */ , 0, {
      $count: -1,
      type: "frame"
    } ],
    joinTabs: [ 26 /* kBgCmd.joinTabs */ , 1 /* kCxt.bg */ , 0 ],
    lastTab: [ 24 /* kBgCmd.goToTab */ , 1 /* kCxt.bg */ , 0, {
      $count: -1,
      absolute: true
    } ],
    mainFrame: [ 27 /* kBgCmd.mainFrame */ , 1 /* kCxt.bg */ , 1 ],
    moveTabLeft: [ 28 /* kBgCmd.moveTab */ , 1 /* kCxt.bg */ , 0, {
      $count: -1
    } ],
    moveTabRight: [ 28 /* kBgCmd.moveTab */ , 1 /* kCxt.bg */ , 0 ],
    moveTabToGroup: [ 57 /* kBgCmd.moveTabToGroup */ , 1 /* kCxt.bg */ , 0 ],
    moveTabToIncognito: [ 29 /* kBgCmd.moveTabToNewWindow */ , 1 /* kCxt.bg */ , 1, {
      incognito: true
    } ],
    moveTabToNewWindow: [ 29 /* kBgCmd.moveTabToNewWindow */ , 1 /* kCxt.bg */ , /** 30 in tab_commands.ts */ 0 ],
    moveTabToNextWindow: [ 30 /* kBgCmd.moveTabToNextWindow */ , 1 /* kCxt.bg */ , 0 ],
    newTab: [ 20 /* kBgCmd.createTab */ , 1 /* kCxt.bg */ , 20 ],
    renameTabGroup: [ 56 /* kBgCmd.renameTabGroup */ , 1 /* kCxt.bg */ , 1 ],
    nextFrame: [ 4 /* kBgCmd.nextFrame */ , 1 /* kCxt.bg */ , 0 ],
    nextTab: [ 24 /* kBgCmd.goToTab */ , 1 /* kCxt.bg */ , 0 ],
    openBookmark: [ 51 /* kBgCmd.openBookmark */ , 1 /* kCxt.bg */ , 0 ],
    openCopiedUrlInCurrentTab: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      reuse: 0 /* ReuseType.current */ ,
      copied: true
    } ],
    openCopiedUrlInNewTab: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 20, {
      copied: true
    } ],
    openDownloads: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      url: "chrome://downloads"
    } ],
    openExtensions: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      url: "chrome://extensions"
    } ],
    openHistoryPage: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      url: "chrome://history"
    } ],
    openSettings: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      url: "chrome://settings"
    } ],
    openShortcuts: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
      url: "chrome://extensions/shortcuts"
    } ],
    openSidePanel: [ 53 /* kBgCmd.openSidePanel */ , 1 /* kCxt.bg */ , 1 ],
    openUrl: [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 20 ],
    addToReadingList: [ 58 /* kBgCmd.addToReadingList */ , 1 /* kCxt.bg */ , 1 ],
    parentFrame: [ 5 /* kBgCmd.parentFrame */ , 1 /* kCxt.bg */ , 0 ],
    pictureInPicture: [ 20 /* kFgCmd.pictureInPicture */ , 0 /* kCxt.fg */ , 1 ],
    enterPictureInPicture: [ 20 /* kFgCmd.pictureInPicture */ , 0 /* kCxt.fg */ , 1 ],
    collapseTabGroup: [ 55 /* kBgCmd.collapseTabGroup */ , 1 /* kCxt.bg */ , 1 ],
    cycleWindows: [ 60 /* kBgCmd.cycleWindows */ , 1 /* kCxt.bg */ , 0 ],
    dockWindow: [ 62 /* kBgCmd.dockWindow */ , 1 /* kCxt.bg */ , 1 ],
    dockWindowLeft: [ 62 /* kBgCmd.dockWindow */ , 1 /* kCxt.bg */ , 1, {
      direction: "left"
    } ],
    dockWindowRight: [ 62 /* kBgCmd.dockWindow */ , 1 /* kCxt.bg */ , 1, {
      direction: "right"
    } ],
    dockWindowUp: [ 62 /* kBgCmd.dockWindow */ , 1 /* kCxt.bg */ , 1, {
      direction: "up"
    } ],
    dockWindowDown: [ 62 /* kBgCmd.dockWindow */ , 1 /* kCxt.bg */ , 1, {
      direction: "down"
    } ],
    dockWindowMax: [ 62 /* kBgCmd.dockWindow */ , 1 /* kCxt.bg */ , 1, {
      direction: "max"
    } ],
    showLastDownload: [ 61 /* kBgCmd.showLastDownload */ , 1 /* kCxt.bg */ , 1 ],
    passNextKey: [ 9 /* kFgCmd.passNextKey */ , 0 /* kCxt.fg */ , 0 ],
    performAnotherFind: [ 6 /* kBgCmd.performFind */ , 1 /* kCxt.bg */ , 0, {
      index: "other"
    } ],
    performBackwardsFind: [ 6 /* kBgCmd.performFind */ , 1 /* kCxt.bg */ , 0, {
      $count: -1
    } ],
    performFind: [ 6 /* kBgCmd.performFind */ , 1 /* kCxt.bg */ , 0 ],
    previousTab: [ 24 /* kBgCmd.goToTab */ , 1 /* kCxt.bg */ , 0, {
      $count: -1
    } ],
    quickNext: [ 24 /* kBgCmd.goToTab */ , 1 /* kCxt.bg */ , 0 ],
    reload: [ 18 /* kFgCmd.framesGoBack */ , 0 /* kCxt.fg */ , 0, {
      r: 1
    } ],
    reloadGivenTab: [ 32 /* kBgCmd.reloadTab */ , 1 /* kCxt.bg */ , 0, {
      single: true
    } ],
    reloadTab: [ 32 /* kBgCmd.reloadTab */ , 1 /* kCxt.bg */ , /** 20 in tab_commands.ts */ 0 ],
    removeRightTab: [ 33 /* kBgCmd.removeRightTab */ , 1 /* kCxt.bg */ , 0 ],
    removeTab: [ 34 /* kBgCmd.removeTab */ , 1 /* kCxt.bg */ , /** 20 in tab_commands.ts */ 0 ],
    reopenTab: [ 36 /* kBgCmd.reopenTab */ , 1 /* kCxt.bg */ , 1 ],
    reset: [ 50 /* kBgCmd.reset */ , 1 /* kCxt.bg */ , 1 ],
    restoreGivenTab: [ 37 /* kBgCmd.restoreTab */ , 1 /* kCxt.bg */ , 0, {
      one: true
    } ],
    restoreTab: [ 37 /* kBgCmd.restoreTab */ , 1 /* kCxt.bg */ , 25 ],
    runKey: [ 38 /* kBgCmd.runKey */ , 1 /* kCxt.bg */ , 0 ],
    scrollDown: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0 ],
    scrollFullPageDown: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      view: 2
    } ],
    scrollFullPageUp: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dir: -1,
      view: 2
    } ],
    scrollLeft: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dir: -1,
      axis: "x"
    } ],
    scrollPageDown: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dir: .5,
      view: 2
    } ],
    scrollPageUp: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dir: -.5,
      view: 2
    } ],
    scrollPxDown: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      view: 1
    } ],
    scrollPxLeft: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dir: -1,
      axis: "x",
      view: 1
    } ],
    scrollPxRight: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      axis: "x",
      view: 1
    } ],
    scrollPxUp: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dir: -1,
      view: 1
    } ],
    scrollRight: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      axis: "x"
    } ],
    scrollSelect: [ 14 /* kFgCmd.scrollSelect */ , 0 /* kCxt.fg */ , 0 ],
    scrollTo: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dest: "min"
    } ],
    scrollToBottom: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dest: "max"
    } ],
    scrollToLeft: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      axis: "x",
      dest: "min"
    } ],
    scrollToRight: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      axis: "x",
      dest: "max"
    } ],
    scrollToTop: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dest: "min"
    } ],
    scrollUp: [ 4 /* kFgCmd.scroll */ , 0 /* kCxt.fg */ , 0, {
      dir: -1
    } ],
    searchAs: [ 11 /* kFgCmd.autoOpen */ , 0 /* kCxt.fg */ , 1, {
      s: 1,
      copied: true,
      selected: true
    } ],
    searchInAnother: [ 39 /* kBgCmd.searchInAnother */ , 1 /* kCxt.bg */ , 1 ],
    sendToExtension: [ 40 /* kBgCmd.sendToExtension */ , 1 /* kCxt.bg */ , 0 ],
    showHelp: [ 8 /* kBgCmd.showHelp */ , 1 /* kCxt.bg */ , 1 ],
    showHud: [ 41 /* kBgCmd.showHUD */ , 1 /* kCxt.bg */ , 1 ],
    showHUD: [ 41 /* kBgCmd.showHUD */ , 1 /* kCxt.bg */ , 1 ],
    showTip: [ 41 /* kBgCmd.showHUD */ , 1 /* kCxt.bg */ , 1 ],
    simBackspace: [ 12 /* kFgCmd.focusInput */ , 0 /* kCxt.fg */ , 1, {
      action: "backspace"
    } ],
    simulateBackspace: [ 12 /* kFgCmd.focusInput */ , 0 /* kCxt.fg */ , 1, {
      action: "backspace"
    } ],
    sortTabs: [ 26 /* kBgCmd.joinTabs */ , 1 /* kCxt.bg */ , 0, {
      sort: "recency",
      windows: "current"
    } ],
    switchFocus: [ 12 /* kFgCmd.focusInput */ , 0 /* kCxt.fg */ , 1, {
      action: "switch"
    } ],
    toggleContentSetting: [ 42 /* kBgCmd.toggleCS */ , 1 /* kCxt.bg */ , 0 ],
    toggleCS: [ 42 /* kBgCmd.toggleCS */ , 1 /* kCxt.bg */ , 0 ],
    toggleLinkHintCharacters: [ 7 /* kBgCmd.toggle */ , 1 /* kCxt.bg */ , 1, {
      key: "linkHintCharacters"
    } ],
    toggleMuteTab: [ 43 /* kBgCmd.toggleMuteTab */ , 1 /* kCxt.bg */ , 1 ],
    togglePinTab: [ 44 /* kBgCmd.togglePinTab */ , 1 /* kCxt.bg */ , /** 30 in all_commands.ts */ 0 ],
    toggleReaderMode: [ 45 /* kBgCmd.toggleTabUrl */ , 1 /* kCxt.bg */ , 1, {
      reader: true,
      reuse: 0 /* ReuseType.current */ ,
      opener: true
    } ],
    toggleStyle: [ 15 /* kFgCmd.toggleStyle */ , 0 /* kCxt.fg */ , 1 ],
    toggleSwitchTemp: [ 7 /* kBgCmd.toggle */ , 1 /* kCxt.bg */ , 1 ],
    toggleTabGroup: [ 54 /* kBgCmd.toggleTabGroup */ , 1 /* kCxt.bg */ , 1 ],
    toggleUrl: [ 45 /* kBgCmd.toggleTabUrl */ , 1 /* kCxt.bg */ , 1, {
      url_mask: true,
      reuse: 0
 /* ReuseType.current */    } ],
    toggleViewSource: [ 45 /* kBgCmd.toggleTabUrl */ , 1 /* kCxt.bg */ , 1, {
      opener: true,
      viewSource: true
    } ],
    toggleVomnibarStyle: [ 46 /* kBgCmd.toggleVomnibarStyle */ , 1 /* kCxt.bg */ , 1 ],
    toggleWindow: [ 52 /* kBgCmd.toggleWindow */ , 1 /* kCxt.bg */ , 0 ],
    toggleBookmark: [ 59 /* kBgCmd.toggleBookmark */ , 1 /* kCxt.bg */ , 1 ],
    visitPreviousTab: [ 48 /* kBgCmd.visitPreviousTab */ , 1 /* kCxt.bg */ , 0 ],
    wait: [ 0 /* kBgCmd.blank */ , 1 /* kCxt.bg */ , 0, {
      wait: "count"
    } ],
    zoom: [ 47 /* kBgCmd.toggleZoom */ , 1 /* kCxt.bg */ , 0 ],
    zoomIn: [ 47 /* kBgCmd.toggleZoom */ , 1 /* kCxt.bg */ , 0 ],
    zoomOut: [ 47 /* kBgCmd.toggleZoom */ , 1 /* kCxt.bg */ , 0, {
      $count: -1
    } ],
    zoomReset: [ 47 /* kBgCmd.toggleZoom */ , 1 /* kCxt.bg */ , 0, {
      reset: true
    } ]
  };
  const hintModes_ = {
    __proto__: null,
    newtab: 2 /* HintMode.OPEN_IN_NEW_BG_TAB */ ,
    queue: 18 /* HintMode.OPEN_WITH_QUEUE */ ,
    "cur-queue": 16 /* HintMode.queue */ ,
    "new-active": 3 /* HintMode.OPEN_IN_NEW_FG_TAB */ ,
    "newtab-active": 3 /* HintMode.OPEN_IN_NEW_FG_TAB */ ,
    hover: 32 /* HintMode.HOVER */ ,
    "hover-and-scroll": 32 /* HintMode.HOVER */ ,
    unhover: 33 /* HintMode.UNHOVER */ ,
    leave: 33 /* HintMode.UNHOVER */ ,
    focus: 34 /* HintMode.FOCUS */ ,
    "download-media": 35 /* HintMode.DOWNLOAD_MEDIA */ ,
    "download-image": 35 /* HintMode.DOWNLOAD_MEDIA */ ,
    image: 37 /* HintMode.OPEN_IMAGE */ ,
    "open-image": 37 /* HintMode.OPEN_IMAGE */ ,
    media: 37 /* HintMode.OPEN_IMAGE */ ,
    search: 38 /* HintMode.SEARCH_TEXT */ ,
    "search-text": 38 /* HintMode.SEARCH_TEXT */ ,
    copy: 40 /* HintMode.COPY_TEXT */ ,
    "copy-text": 40 /* HintMode.COPY_TEXT */ ,
    "copy-list": 57 /* HintMode.queue */ ,
    "copy-url": 42 /* HintMode.COPY_URL */ ,
    "copy-url-list": 59 /* HintMode.queue */ ,
    download: 44 /* HintMode.DOWNLOAD_LINK */ ,
    incognito: 45 /* HintMode.OPEN_INCOGNITO_LINK */ ,
    "open-incognito": 45 /* HintMode.OPEN_INCOGNITO_LINK */ ,
    "open-link": 46 /* HintMode.OPEN_LINK */ ,
    "open-url": 46 /* HintMode.OPEN_LINK */ ,
    "direct-open": 46 /* HintMode.OPEN_LINK */ ,
    "open-directly": 46 /* HintMode.OPEN_LINK */ ,
    "directly-open": 46 /* HintMode.OPEN_LINK */ ,
    "open-direct": 46 /* HintMode.OPEN_LINK */ ,
    "copy-image": 36 /* HintMode.COPY_IMAGE */ ,
    "edit-url": 64 /* HintMode.EDIT_LINK_URL */ ,
    edit: 65 /* HintMode.EDIT_TEXT */ ,
    "edit-text": 65 /* HintMode.EDIT_TEXT */ ,
    input: 67 /* HintMode.FOCUS_EDITABLE */ ,
    "focus-input": 67 /* HintMode.FOCUS_EDITABLE */ ,
    editable: 67 /* HintMode.FOCUS_EDITABLE */ ,
    "focus-editable": 67 /* HintMode.FOCUS_EDITABLE */ ,
    visual: 66 /* HintMode.ENTER_VISUAL_MODE */ ,
    select: 66
 /* HintMode.ENTER_VISUAL_MODE */  };
  exports.visualGranularities_ = [ "character", "word", "", "lineboundary", "line", "sentence", "paragraphboundary", "paragraph", "documentboundary" ];
  exports.visualKeys_ = {
    l: 1 /* VisualAction.inc */ ,
    h: 0 /* VisualAction.char */ /* VisualAction.dec */ ,
    j: 9 /* VisualAction.inc */ ,
    k: 8 /* VisualAction.line */ /* VisualAction.dec */ ,
    $: 7 /* VisualAction.inc */ ,
    0: 6 /* VisualAction.lineBoundary */ /* VisualAction.dec */ ,
    "}": 15 /* VisualAction.inc */ ,
    "{": 14 /* VisualAction.paragraph */ /* VisualAction.dec */ ,
    ")": 11 /* VisualAction.inc */ ,
    "(": 10 /* VisualAction.sentence */ /* VisualAction.dec */ ,
    w: 5 /* VisualAction.inc */ ,
    /* same as w */ W: 5 /* VisualAction.inc */ ,
    e: 3 /* VisualAction.inc */ ,
    b: 2 /* VisualAction.word */ /* VisualAction.dec */ ,
    /* same as b */ B: 2 /* VisualAction.word */ /* VisualAction.dec */ ,
    G: 17 /* VisualAction.inc */ ,
    gg: 16 /* VisualAction.documentBoundary */ /* VisualAction.dec */ ,
    o: 20 /* VisualAction.Reverse */ ,
    a: -2 /* VisualAction.NextKey */ ,
    g: -2 /* VisualAction.NextKey */ ,
    aw: 21 /* VisualAction.LexicalWord */ ,
    as: 25 /* VisualAction.LexicalSentence */ ,
    ap: 26 /* VisualAction.LexicalParagraph */ ,
    "a}": 26 /* VisualAction.LexicalParagraph */ ,
    y: 31 /* VisualAction.Yank */ ,
    Y: 32 /* VisualAction.YankLine */ ,
    C: 33 /* VisualAction.YankWithoutExit */ ,
    "c-s-c": 36 /* VisualAction.YankRichText */ ,
    p: 35 /* VisualAction.YankAndNewTab */ ,
    P: 34 /* VisualAction.YankAndOpen */ ,
    f: 55 /* VisualAction.EmbeddedFindAndExtendSelection */ ,
    F: 57 /* VisualAction.EmbeddedFindToPrevAndExtendSelection */ ,
    n: 47 /* VisualAction.FindNext */ ,
    N: 46 /* VisualAction.FindPrevious */ ,
    f1: 48 /* VisualAction.HighlightRange */ ,
    "a-f1": 48 /* VisualAction.HighlightRange */ ,
    v: 51 /* VisualAction.VisualMode */ ,
    V: 52 /* VisualAction.VisualLineMode */ ,
    c: 53 /* VisualAction.CaretMode */ ,
    "/": 54 /* VisualAction.EmbeddedFindMode */ ,
    "?": 56 /* VisualAction.EmbeddedFindModeToPrev */ ,
    "c-e": 62 /* VisualAction.ScrollDown */ ,
    "c-y": 61 /* VisualAction.ScrollUp */ ,
    "c-down": 62 /* VisualAction.ScrollDown */ ,
    "c-up": 61
 /* VisualAction.ScrollUp */  };
  exports.availableCommands_.focusOptions = [ 31 /* kBgCmd.openUrl */ , 1 /* kCxt.bg */ , 1, {
    reuse: 1 /* ReuseType.reuse */ ,
    url: "vimium://options"
  } ];
  const upgradeKeyMappings = value => {
    let newFlags = "", prefix = "#!";
    !errors_ && flagDoesCheck_ && (newFlags = `${prefix}no-check\n`);
    if (newFlags) {
      const old = store_1.updateHooks_.keyMappings;
      store_1.updateHooks_.keyMappings = void 0;
      try {
        settings_.set_("keyMappings", newFlags + value);
      } catch (_a) {}
      store_1.updateHooks_.keyMappings = old;
    }
  };
  if (store_1.bgIniting_ & 2 /* BackendHandlersNS.kInitStat.settings */) {
    populateKeyMap_(store_1.settingsCache_.keyMappings);
    store_1.os_ || (exports.visualKeys_["m-s-c"] = 36 /* VisualAction.YankRichText */);
  }
  store_1.updateHooks_.keyMappings = value => {
    const oldMappedKeys = store_1.mappedKeyRegistry_, oldOmniMapKeys = store_1.omniPayload_.m, oldFSM = store_1.keyFSM_;
    populateKeyMap_(value);
    const f = JSON.stringify, curMapped = store_1.mappedKeyRegistry_, curOmniMapped = store_1.omniPayload_.m, updatesInKeyFSM = !!oldFSM && f(store_1.keyFSM_) !== f(oldFSM), updatesInMappedKeys = oldMappedKeys ? !curMapped || f(oldMappedKeys) !== f(curMapped) : !!oldFSM && !!curMapped;
    (updatesInMappedKeys || updatesInKeyFSM) && settings_.broadcast_({
      N: 9 /* kBgReq.keyFSM */ ,
      m: store_1.mappedKeyRegistry_,
      t: store_1.mappedKeyTypes_,
      k: updatesInKeyFSM ? store_1.keyFSM_ : null,
      v: BgUtils_.nextConfUpdate(0)
    });
    (oldOmniMapKeys ? !curOmniMapped || f(oldOmniMapKeys) !== f(curOmniMapped) : curOmniMapped) && settings_.broadcastOmniConf_({
      m: curOmniMapped
    });
  };
});
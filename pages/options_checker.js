import { browser_, OnFirefox, post_ } from "./async_bg.js";

import { bgSettings_, Option_, oTrans_ } from "./options_base.js";

import { CssSelectorOption_, TextOption_ } from "./options_defs.js";

const spaceKindRe = /\s/g;

const detectSubExpressions_ = (expression, start) => {
  let curlyBraces = 0, end = expression.length, pos = start;
  for (;pos < end; pos++) {
    switch (expression[pos]) {
     case "{":
     case "[":
      curlyBraces++;
      break;

     case "]":
     case "}":
      --curlyBraces;
      if (curlyBraces > 0) {
        break;
      }

      // no break;
           default:
      {
        const literal = (expression[pos] === '"' ? /^"([^"\\]|\\[^])*"/ : curlyBraces > 0 ? /^(?:[$a-zA-Z_][$\w]*|\d[\d.eE+-]|\s+)/ : /^\S+/).exec(expression.slice(pos));
        if (!literal && !curlyBraces && /\s/.test(expression[pos])) {
          return pos;
        }
        pos += literal ? literal[0].length - 1 : 0;
      }
    }
  }
  if (curlyBraces > 0) {
    const literal = /^\S*/.exec(expression.slice(start));
    return start + (literal ? literal[0].length : 0);
  }
  return pos;
};

const keyMappingChecker_ = {
  status_: 0,
  normalizeKeys_: null,
  init_() {
    function sortModifiers(option) {
      return option.length < 4 ? option : option.slice(0, -1).split("-").sort().join("-") + "-";
    }
    function func(_0, modifiers, body) {
      let suffix = "";
      if (body.length > 2 && body[body.length - 2] === ":") {
        suffix = body.slice(-2);
        body = body.slice(0, -2);
      }
      modifiers = modifiers.toLowerCase();
      const isLong = body.length > 1, hasShift = modifiers.includes("s-"), bodyUpper = body.toUpperCase();
      if (!isLong) {
        if (!modifiers) {
          return _0;
        }
        if (hasShift && modifiers.length < 3) {
          return suffix ? `<${bodyUpper}${suffix}>` : bodyUpper;
        }
      }
      // not force a virtual key body lower, since it's only used to search in key mappings;
      // abort any suffix, so that other checks don't need to worry about its mode
            if (modifiers.includes("v-")) {
        return `<v-${body}>`;
      }
      const bodyLower = body.toLowerCase();
      modifiers = sortModifiers(modifiers);
      body !== bodyLower && !hasShift && (modifiers += "s-");
      // not convert "-" in body to "_", in case of new modifiers in the future
            return modifiers || isLong || suffix ? `<${modifiers}${bodyLower}${suffix}>` : body;
    }
    this.normalizeKeys_ = k => k.replace(/<(?!<)((?:[ACMSVacmsv]-){0,4})(.[^>]*)>/g, func);
    this.init_ = null;
  },
  onHex_(_s, hex) {
    return hex ? "\\u00" + hex : "\\\\";
  },
  normalizeOptions_(str) {
    let value = str.slice(1), s2 = "", s3 = "";
    if (value.startsWith('"') && value.endsWith('"')) {
      s2 = value.slice(1, -1);
      s2 = s2.replace(/\\(?:x([\da-z]{2})|\\)/gi, keyMappingChecker_.onHex_);
      value = `"${s2}"`;
    } else if (value && "{[".includes(value[0])) {
      value = value.replace(/([{,](?: |\x7f\d*\x80)*)(\w+):|"(?:[^"\\]|\\[^])*"/g, (full, s1, s2) => s1 ? `${s1}"${s2}":` : full);
      s3 = value;
    }
    const multiLines = value.includes("\x7f");
    const p1 = multiLines && !s2 ? (/^(?:\x7f\d*\x80)+/.exec(value) || [ "" ])[0] : "";
    const p2 = !multiLines || s2 ? "" : (/(?:\x7f\d*\x80)+$/.exec(value.slice(p1.length + 1)) || [ "" ])[0];
    try {
      const obj = JSON.parse(multiLines ? value.replace(/\x7f\d*\x80/g, "") : value);
      if (typeof obj !== "string" && !/\s/.test(value)) {
        return obj === true ? "" : s3 ? "=" + s3 : str;
      }
      value = multiLines ? JSON.parse(value.slice(p1.length, p2 ? -p2.length : void 0)) : obj;
    } catch (_a) {
      value = multiLines ? s2 || value.slice(p1.length, p2 ? -p2.length : void 0) : s2 || value;
    }
    value = value && typeof value === "string" ? value.replace(/\\(\\|s)/g, (a, i) => i === "s" ? " " : a) : value;
    value = value && JSON.stringify(value).replace(spaceKindRe, keyMappingChecker_.onToHex_);
    return "=" + p1 + value + p2;
  },
  onToHex_(s) {
    const hex = s.charCodeAt(0) + 1048576;
    return "\\u" + hex.toString(16).slice(2);
  },
  normalizeMap_(_0, prefix, cmd, keys, options) {
    const keys2 = keyMappingChecker_.normalizeKeys_(keys);
    if (keys2 !== keys) {
      console.log("KeyMappings Checker:", keys, "is corrected into", keys2);
      keys = keys2;
    }
    if (cmd.toLowerCase() === "mapkey") {
      const destKeyArr = /^\S+/.exec(options.trimLeft());
      const destKey = destKeyArr && destKeyArr[0];
      const destKey2 = destKey && keyMappingChecker_.normalizeKeys_(destKey);
      if (destKey2 !== destKey) {
        console.log("KeyMappings Checker:", destKey, "is corrected into", destKey2);
        options = options.replace(destKey, destKey2);
      }
    } else if (!cmd.startsWith("unmap")) {
      const mapped = options.trimLeft().split(/\s/, 1)[0];
      if (mapped) {
        const offset = options.indexOf(mapped) + mapped.length;
        keys += options.slice(0, offset);
        options = options.slice(offset);
      }
    }
    return keyMappingChecker_.normalizeCmd_("", prefix, keys, options);
  },
  correctMapKey_(_0, mapA, B) {
    return mapA.replace("map", "mapKey") + (B.length === 3 ? B[1] : B);
  },
  normalizeCmd_(_0, prefix, name, options) {
    /\s(createTab|openUrl)/.test(name) && !/\surls?=/i.test(options) && (options = keyMappingChecker_.convertFromLegacyUrlList_(options));
    if (!options) {
      return prefix + name;
    }
    let before = 0, cur = -1, outOptions = "";
    while (cur < options.length) {
      cur = options.indexOf("=", cur + 1);
      outOptions += options.slice(before, cur >= 0 ? cur : void 0);
      if (cur < 0) {
        break;
      }
      let next = cur + 1;
      if (next < options.length && '"[{'.includes(options[next])) {
        next = detectSubExpressions_(options, next);
      } else {
        spaceKindRe.lastIndex = cur;
        const arr = spaceKindRe.exec(options);
        next = arr ? arr.index : options.length;
      }
      outOptions += keyMappingChecker_.normalizeOptions_(options.slice(cur, next));
      before = cur = next;
    }
    return prefix + name + outOptions;
  },
  convertFromLegacyUrlList_(options) {
    const urls = [];
    options = (options + " ").replace(/\s+(\w+:[^=\s]+|[^\s=]+:\/\/\S+)(?=\s|$)/g, (_, url) => (urls.push(url), 
    "")).trimRight();
    const len = urls.length;
    return options + (len > 1 ? " urls=" : len ? " url=" : "") + (len ? JSON.stringify(len > 1 ? urls : urls[0]) : "");
  },
  check_(str) {
    if (!str) {
      return str;
    }
    this.init_ && this.init_();
    str = str.replace(/\\(?:\n|\\\n[^\S\n]*)/g, s => s[1] === "\n" ? "\x7f\x80" : `\x7f${s.length - 3}\x80`);
    str = str.replace(/^([ \t]*(?:#\s?)?map\s+(?:<(?!<)(?:.-){0,4}.[\w:]*?>|\S)\s+)(<(?!<)(?:[ACMSVacmsv]-){0,4}.\w*?>|\S)(?=\s|$)/gm, this.correctMapKey_);
    str = str.replace(/^([ \t]*(?:#\s?)?(map(?:[kK]ey|!)?|run!?|unmap!?)\s+)(\S+)([^\n]*)/gm, this.normalizeMap_);
    str = str.replace(/^([ \t]*(?:#\s?)?(?:command|shortcut)\s+)(\S+)([^\n]*)/gm, this.normalizeCmd_);
    str = str.replace(/\x7f(\d*)\x80/g, (_, num) => num === "" ? "\\\n" : "\\\\\n" + " ".repeat(+num));
    str = str.replace(/\\(?:\n|\\\n\s*)$/, "").trim();
    return str;
  }
};

Option_.all_.keyMappings.checker_ = keyMappingChecker_;

Option_.all_.searchUrl.checker_ = {
  status_: 0,
  check_(str) {
    return post_(14 /* kPgReq.checkSearchUrl */ , str).then(obj => {
      const opt = Option_.all_.searchUrl;
      if (obj == null) {
        return opt.innerFetch_();
      }
      let str2 = obj[1];
      if (!obj[0]) {
        const err = oTrans_("nonPlainURL", [ str2 ]);
        console.log("searchUrl checker:", err);
        opt.showError_(err);
        return opt.innerFetch_();
      }
      opt.showError_("");
      return str2;
    });
  }
};

Option_.all_.newTabUrl.checker_ = {
  status_: 0,
  check_(value) {
    return post_(13 /* kPgReq.checkNewTabUrl */ , /^\/?pages\/[a-z]+.html\b/i.test(value) ? browser_.runtime.getURL(value) : value.toLowerCase()).then(([url, type]) => {
      url = url.split("?", 1)[0].split("#", 1)[0];
      return value.startsWith("http") || type !== 1 /* Urls.NewTabType.browser */ && !/^(?!http|s?ftp)[a-z\-]+:\/?\/?newtab\b\/?/i.test(value) ? value : bgSettings_.defaults_.newTabUrl;
    });
  }
};

Option_.all_.vimSync.allowToSave_ = function() {
  const newlyEnableSyncing = !this.saved_ && this.readValueFromElement_() === true;
  if (newlyEnableSyncing) {
    const arr = Option_.all_;
    let delta = 0;
    for (const i in arr) {
      arr[i].saved_ || ++delta;
    }
    let tooMany = delta > 1;
    setTimeout(alert, 100, oTrans_(tooMany ? "changedBeforeSync" : "warningForSync"));
    if (tooMany) {
      return false;
    }
  }
  return true;
};

Option_.all_.keyboard.checker_ = {
  status_: 0,
  check_(data) {
    if (data == null || data.length < 2 || !(data[0] > 0 && data[0] < 4e3) || !(data[1] > 0 && data[1] < 1e3)) {
      return bgSettings_.defaults_.keyboard;
    }
    return [ +data[0], +data[1] ].concat(data.slice(2));
  }
};

let _validCssSelectors = {};

const isValidCssSelector = (option, selector, errors) => {
  selector = selector.replace(/[,;]\s*$/, "").trim();
  selector === ":default" /* GlobalConsts.kCssDefault */ && (// EdgeHTML may have no `:default`
  selector = option.getRealDefault());
  if (selector.includes(",")) {
    return selector.split(",").map(i => isValidCssSelector(option, i, errors)).reduce((old, x) => old && x, true);
  }
  let valid = selector ? _validCssSelectors[selector] : 1;
  if (valid == null) {
    try {
      option.element_.querySelector(selector);
      _validCssSelectors[selector] = 1;
      return true;
    } catch (_a) {}
    valid = _validCssSelectors[selector] = 0;
  }
  valid || errors.push(selector);
  return !!valid;
};

const checkCssSelector = (opt, value) => {
  var _a;
  let selectorsInDefault;
  selectorsInDefault = (_a = /:default\(([^)]*)\)/.exec(TextOption_.prototype.readRaw_.call(opt))) === null || _a === void 0 ? void 0 : _a[1];
  let outputs = [];
  let lastRule = {
    s: ";",
    c: ""
  };
  for (const line of value.split("\n")) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("//") || trimmedLine.startsWith("# ")) {
      outputs.push({
        s: "",
        c: trimmedLine
      });
      continue;
    }
    const commentSep = line.indexOf("//");
    const mid = (commentSep > 0 ? line.slice(0, commentSep) : line).replace(/;[\s;]+|,[\s,]+/g, s => s[0]).replace(/,;/g, ";");
    const subLines = mid.split(";").map((i, ind, arr) => {
      i = ind ? i.trim() : i.trimRight();
      return {
        s: ind < arr.length - 1 ? i + ";" : i,
        c: ""
      };
    });
    subLines[subLines.length - 1].s || subLines.pop();
    commentSep > 0 && (subLines[subLines.length - 1].c = line.slice(commentSep));
    const prevChar = lastRule.s.slice(-1);
    prevChar !== ";" && subLines[0].s.includes("##") ? lastRule.s = (prevChar === "," ? lastRule.s.slice(0, -1) : lastRule.s) + ";" : ",;#".includes(prevChar) || ",;".includes(subLines[0].s[0]) || (lastRule.s += ",");
    outputs.push(...subLines);
    lastRule = outputs[outputs.length - 1];
  }
  lastRule.s.endsWith(";") || (lastRule.s = (lastRule.s.endsWith(",") ? lastRule.s.slice(0, -1) : lastRule.s) + ";");
  const groups = [];
  let lastGroup = {
    l: [ {
      s: ";",
      c: ""
    } ],
    s: "",
    i: 0
  };
  for (const line of outputs) {
    if (lastGroup.l[lastGroup.l.length - 1].s.endsWith(";")) {
      groups.push(lastGroup = {
        l: [ line ],
        s: "",
        i: 0
      });
    } else {
      lastGroup.l.push(line);
      lastGroup.s || (lastGroup.s = line.s);
    }
    if (!lastGroup.s && line.s) {
      lastGroup.s = line.s;
      lastGroup.i = groups.length - outputs.length * (line.s.includes("##") ? 2 : 1);
    }
  }
  groups.sort((a, b) => a.i - b.i);
  const errors = [];
  let stream = "";
  selectorsInDefault && isValidCssSelector(opt, selectorsInDefault, errors);
  for (const group of groups) {
    let prevChar = ";", hasHost = 0;
    for (const line of group.l) {
      if (!line.s) {
        stream += line.c + "\n";
        continue;
      }
      hasHost || (hasHost = line.s.includes("##") ? 2 : 1);
      let s = line.s.replace(/\s{2,}/g, " ").replace(/^ | ?([,>]) ?/g, (_, x) => x || "  ");
      prevChar !== ";" && (s = hasHost === 2 ? s[0] !== " " ? "  " + s : s : s[0] !== " " ? s : s.trimLeft());
      s = CssSelectorOption_.WrapAndOutput_(s);
      const hostSep = s.indexOf("##");
      const selectors = s.slice(hostSep >= 0 ? hostSep + 2 : 0).replace(/\n /g, "");
      selectors.split(",").forEach(i => isValidCssSelector(opt, i, errors));
      s = s.replace(/, | > /g, s => s.trim());
      s = line.c ? s + " " + line.c + "\n" : s + "\n";
      stream += s;
      prevChar = line.s.slice(-1);
    }
  }
  stream = stream.trim();
  (stream.endsWith(";") || stream.endsWith(",")) && (stream = stream.slice(0, -1));
  if (errors.length > 0) {
    errors.unshift(oTrans_("invalidCss"));
    opt.showError_(errors.join("\n"), "has-error");
  } else {
    _validCssSelectors = {};
    opt.showError_("");
  }
  return stream;
};

Option_.all_.passEsc.checker_ = {
  status_: 0,
  check_: checkCssSelector.bind(null, Option_.all_.passEsc)
};

Option_.all_.ignoreReadonly.checker_ = {
  status_: 0,
  check_: checkCssSelector.bind(null, Option_.all_.ignoreReadonly)
};
"use strict";
__filename = "background/parse_urls.js";
define([ "require", "exports", "./store", "./utils", "./normalize_urls" ], (require, exports, store_1, BgUtils_, normalize_urls_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.prepareReParsingPrefix_ = exports.parseSearchEngines_ = exports.fixCharsInUrl_ = exports.findUrlEndingWithPunctuation_ = exports.findUrlInText_ = exports.parseUpperUrl_ = exports.parseSearchUrl_ = void 0;
  BgUtils_ = __importStar(BgUtils_);
  const parseSearchUrl_ = request => {
    let pattern, httpType, s0 = request.u, url = s0.toLowerCase(), arr = null, selectLast = false;
    if (!BgUtils_.protocolRe_.test(normalize_urls_1.removeComposedScheme_(url))) {
      BgUtils_.resetRe_();
      return null;
    }
    if (request.p) {
      const obj = exports.parseUpperUrl_(request);
      return {
        k: "",
        s: 0,
        u: obj.p != null ? obj.u : s0,
        e: obj.p != null ? obj.p : obj.u
      };
    }
    if (httpType = BgUtils_.IsURLHttp_(url)) {
      url = url.slice(httpType);
      s0 = s0.slice(httpType);
    }
    for (pattern of store_1.searchEngines_.rules) {
      if (!url.startsWith(pattern.prefix_)) {
        continue;
      }
      arr = s0.slice(pattern.prefix_.length).match(pattern.matcher_);
      if (arr) {
        break;
      }
    }
    if (!arr || !pattern) {
      const showPage = store_1.CONST_.ShowPage_;
      if (url.startsWith(showPage)) {
        s0 = s0.slice(showPage.length).replace(/^#!?/, "");
        return {
          k: "vimium://show",
          u: s0,
          s: s0.startsWith("image") && s0.lastIndexOf("&", s0.indexOf(":") + 1) + 1 || s0.indexOf(" ") + 1
        };
      }
      BgUtils_.resetRe_();
      return null;
    }
    arr.length > 1 && !pattern.matcher_.global && arr.shift();
    const re = pattern.delimiter_;
    let isResultUrl = 0;
    if (arr.length > 1) {
      selectLast = true;
    } else if (re instanceof RegExp) {
      url = arr[0];
      if (arr = url.match(re)) {
        arr.shift();
        selectLast = true;
      } else {
        arr = [ url ];
      }
    } else if (re == " " || re === "+" || re instanceof Array) {
      url = arr[0].toLowerCase();
      let colon = url.indexOf(":");
      colon = colon > 0 && colon < url.length ? colon : 0;
      if (colon && !BgUtils_.protocolRe_.test(url) && !url.startsWith("file:")) {
        const schemeType = normalize_urls_1.checkSpecialSchemes_(url, colon, url.indexOf(" "));
        colon = schemeType !== -1 /* Urls.TempType.Unspecified */ && schemeType <= 3 /* Urls.Type.PlainVimium */ ? colon : 0;
      }
      isResultUrl = colon > 0 ? url.startsWith("data:") ? 2 : 1 : 0;
      if (isResultUrl) {
        arr = [ arr[0] ];
      } else {
        const useDefaultDelimiter = typeof re === "object";
        let re2 = useDefaultDelimiter ? re[0] : re;
        if (useDefaultDelimiter && re2 === "+") {
          let offset = pattern.prefix_.length;
          pattern.matcher_.global || (offset += arr.index);
          offset = httpType + offset + Math.max(0, s0.slice(offset).indexOf(arr[0]));
          re2 = normalize_urls_1.getDelimiter_(request.u, offset);
          re2 = re2 === "%20" ? /%20| / : "+";
        }
        arr = arr[0].split(re2);
      }
    } else {
      arr = arr[0].split(re);
    }
    url = "";
    for (const item of arr) {
      url += " " + (isResultUrl ? item : BgUtils_.DecodeURLPart_(item));
    }
    url = url.trim().replace(isResultUrl > 1 ? /\xa0/g : BgUtils_.spacesRe_, " ");
    const theDefault = store_1.searchEngines_.map.get("~");
    const canSkip = !!url && theDefault.url_ === store_1.searchEngines_.map.get(pattern.name_).url_ && !store_1.searchEngines_.map.has(url.split(" ", 1)[0]);
    BgUtils_.resetRe_();
    return {
      k: pattern.name_,
      c: canSkip,
      u: url,
      s: selectLast ? url.lastIndexOf(" ") + 1 : 0
    };
  };
  exports.parseSearchUrl_ = parseSearchUrl_;
  const parseUpperUrl_ = request => {
    let {u: url} = request, url_l = url.toLowerCase();
    if (request.p === 1) {
      let url2 = store_1.substitute_(url, 131072 /* SedContext.goToRoot */ , request.s);
      if (url2 !== url && url2 && url2 !== url + "/" && url2 + "/" !== url) {
        const url3 = normalize_urls_1.convertToUrl_(url2, null, -2 /* Urls.WorkType.KeepAll */);
        if (normalize_urls_1.lastUrlType_ === 0 /* Urls.Type.Full */) {
          return {
            u: url3,
            p: "(sed)"
          };
        }
      }
    }
    if (!BgUtils_.protocolRe_.test(normalize_urls_1.removeComposedScheme_(url_l))) {
      return {
        u: "This url has no upper paths",
        p: null
      };
    }
    const enc = encodeURIComponent;
    let str, arr, i, arr2, hash = "", startWithSlash = false, endSlash = false, removeSlash = false, path = null, start = 0, end = 0, decoded = false;
    if (i = url.lastIndexOf("#") + 1) {
      hash = url.slice(i + +(url.substr(i, 1) === "!"));
      str = BgUtils_.DecodeURLPart_(hash);
      i = str.lastIndexOf("/");
      if (i > 0 || i === 0 && str.length > 1) {
        decoded = str !== hash;
        const argRe = /([^&=]+=)([^&\/=]*\/[^&]*)/;
        arr = argRe.exec(str) || /(^|&)([^&\/=]*\/[^&=]*)(?:&|$)/.exec(str);
        path = arr ? arr[2] : str;
        // here `path` is ensured not empty
                if (path === "/" || path.includes("://")) {
          path = null;
        } else if (arr) {
          if (decoded) {
            str = "https://example.com/";
            str = encodeURI(str + path).slice(str.length);
            i = (hash.indexOf(str) + 1 || hash.indexOf(str = enc(path)) + 1) - 1;
            i < 0 && (decoded = false, i = hash.indexOf(str = path));
            end = i + str.length;
            if (i < 0 && arr[1] !== "&") {
              i = hash.indexOf(str = arr[1]);
              i < 0 && (decoded = true, str = enc(arr[1].slice(0, -1)), i = hash.indexOf(str));
              if (i >= 0) {
                i += str.length;
                end = hash.indexOf("&", i) + 1;
              }
            }
            if (i >= 0) {
              start = i;
            } else if (arr2 = argRe.exec(hash)) {
              path = BgUtils_.DecodeURLPart_(arr2[2]), start = arr2.index + arr2[1].length, end = start + arr2[2].length;
            } else if ((str = arr[1]) !== "&") {
              i = url.length - hash.length;
              hash = str + enc(path), url = url.slice(0, i) + hash, start = str.length, end = 0;
            }
          } else {
            start = arr.index + arr[1].length;
          }
        } else {
          start = 0;
        }
        if (path) {
          i = url.length - hash.length;
          start += i, end > 0 && (end += i);
        }
      }
    }
    if (!path) {
      if (url_l.startsWith(store_1.CONST_.BrowserProtocol_) && !request.f) {
        return {
          u: "An extension has no upper-level pages",
          p: null
        };
      }
      hash = "";
      start = url.indexOf("/", url.indexOf("://") + 3);
      url_l.startsWith("filesystem:") && (start = url.indexOf("/", start + 1));
      start = start < 0 ? 0 : start;
      i = url.indexOf("?", start), end = url.indexOf("#", start);
      i = end < 0 ? i : i < 0 ? end : i < end ? i : end;
      i = i > 0 ? i : url.length;
      path = url.slice(start, i), end = 0, decoded = false;
    }
    // Note: here should ensure `end` >= 0
        i = request.p;
    startWithSlash = path.startsWith("/");
    if (!hash && url_l.startsWith("file:")) {
      if (path.length <= 1 || url.length === 11 && url.endsWith(":/")) {
        if (!request.f) {
          return {
            u: "Here has been the root path",
            p: null
          };
        }
        i = 0;
      }
      endSlash = true;
      request.f || i === 1 && (i = -1);
    } else {
      endSlash = !(hash || !url_l.startsWith("ftp")) || (request.t != null ? !!request.t : request.r != null ? !!request.r : path.length > 1 && path.endsWith("/") || /\.([a-z]{2,3}|apng|avif|icon|jpeg|tiff|webp)$/i.test(path));
    }
    const arr3 = path.slice(+startWithSlash, path.length - +path.endsWith("/")).split("/");
    const len3 = arr3.length, level = i < 0 ? i + len3 : i;
    removeSlash = len3 <= 1 && i <= -2 && url.lastIndexOf("#", start) > 0;
    i = level > len3 ? len3 : i > 0 ? level - 1 : level > 0 ? level : 0;
    arr3.length = i;
    path = arr3.join("/");
    (str = request.a || "") && (path += str[0] === "/" ? str : "/" + str);
    path = path ? (path[0] === "/" ? "" : "/") + path + (!endSlash || path.endsWith("/") ? "" : "/") : "/";
    !end && url.lastIndexOf("git", start - 3) > 0 && (path =  upperGitUrls(url, path) || path);
    !end && /[/.](?:askubuntu|serverfault|stack(?:overflow|exchange)|superuser)\.com$/.test(url.slice(0, start)) && /^\/questions\/\d+$/i.test(path) && (path = "/questions");
    if (!removeSlash || path && path !== "/") {
      str = decoded ? enc(path) : path;
      url = url.slice(0, start) + (end ? str + url.slice(end) : str);
    } else {
      url = url.split("#", 1)[0];
    }
    let substituted = store_1.substitute_(url, 64 /* SedContext.gotoUpperUrl */ , request.s) || url;
    if (substituted !== url) {
      // if substitution returns an invalid URL, then refuse it
      const url4 = normalize_urls_1.convertToUrl_(substituted, null, -2 /* Urls.WorkType.KeepAll */);
      url = normalize_urls_1.lastUrlType_ === 0 /* Urls.Type.Full */ ? url4 : url;
    }
    return {
      u: url,
      p: path
    };
  };
  exports.parseUpperUrl_ = parseUpperUrl_;
  const upperGitUrls = (url, path) => {
    var _a;
    const host = (_a = BgUtils_.safeParseURL_(url)) === null || _a === void 0 ? void 0 : _a.host;
    if (!host) {
      return;
    }
    if (!/git\b|\bgit/i.test(host) || !/^[\w\-]+(\.\w+)?(:\d{2,5})?$/.test(host)) {
      return;
    }
    let arr = path.split("/"), lastIndex = arr.length - 1;
    arr[lastIndex] || (lastIndex--, arr.pop());
    let last = arr[lastIndex];
    if (host.startsWith("github.")) {
      if (lastIndex === 3) {
        return last === "pull" || last === "milestone" || last === "commit" ? path + "s" : last === "tree" || last === "blob" ? arr.slice(0, 3).join("/") : null;
      }
      if (lastIndex === 4 && arr[3] === "releases" && (arr[4] === "tag" || arr[4] === "edit")) {
        return arr.slice(0, 4).join("/");
      }
      if (lastIndex > 3) {
        return arr[3] === "blob" ? (arr[3] = "tree", arr.join("/")) : null;
      }
    } else if (host.startsWith("gitee.") && lastIndex === 4 && arr[3] === "releases" && arr[4] === "tag") {
      return arr.slice(0, 4).join("/");
    }
  };
  const findUrlInText_ = (url, testUrl) => typeof testUrl === "string" && testUrl.toLowerCase().startsWith("whole") ? exports.fixCharsInUrl_(url) : detectLinkDeclaration_(url);
  exports.findUrlInText_ = findUrlInText_;
  const findUrlEndingWithPunctuation_ = url => {
    if (!/^https?:\/\//i.test(url)) {
      return url;
    }
    let start = url.indexOf("://") + 3, end = url.indexOf("/", start);
    const host = url.slice(start, end > 0 ? end : url.length).toLowerCase();
    const sepMatch = new RegExp("\\p{S}|[^\\P{P}.:\\uff1a%-]", "u").exec(host);
    if (sepMatch) {
      return url.slice(0, start + sepMatch.index);
    }
    const percentage = host.indexOf("%", host.indexOf("@") + 1);
    const tldInd = host.lastIndexOf(".xn--", percentage > 0 ? percentage : void 0) + 5;
    if (tldInd > 5 && /^[a-z\d]{2}/.test(host.slice(tldInd)) && !/\.[a-z]/.test(host.slice(tldInd)) && host.lastIndexOf("xn--", tldInd - 6) < 0 && !/[\x7f-\uffff]/.test(host.slice(0, tldInd - 6))) {
      const tldWithSuffix = host.slice(tldInd), mayTld = (/^[a-z\d]+/.exec(tldWithSuffix) || [ "" ])[0];
      if (mayTld && mayTld.length < tldWithSuffix.length && (BgUtils_.isTld_(mayTld, true) || "%-".includes(tldWithSuffix[mayTld.length]))) {
        return url.slice(0, start + tldInd - 4) + url.substr(start + tldInd, mayTld.length);
      }
    }
    return url;
  };
  exports.findUrlEndingWithPunctuation_ = findUrlEndingWithPunctuation_;
  const detectLinkDeclaration_ = str => {
    let i = str.indexOf("\uff1a") + 1 || str.indexOf(":") + 1;
    let url;
    if (i && str[i] !== "/") {
      let s = str.slice(0, i - 1).trim().toLowerCase();
      if (s !== "link" && s !== "\u94fe\u63a5") {
        return str;
      }
      url = str.slice(i).trim();
      let j = url.indexOf("\uff1a") + 1;
      i = url.indexOf(":") + 1;
      i = i && j ? Math.min(i, j) : i || j;
      if (!i || !BgUtils_.protocolRe_.test(url.slice(0, i - 1) + "://")) {
        return str;
      }
      normalize_urls_1.convertToUrl_(url.slice(i), null, -2 /* Urls.WorkType.KeepAll */);
      if (normalize_urls_1.lastUrlType_ !== 1 /* Urls.Type.NoProtocolName */) {
        return str;
      }
    } else {
      if (!i || str.substr(i + 1, 1) !== "/") {
        return str;
      }
      url = str;
    }
    const sepArr = /\s|[^=][\u3002\uff0c\uff1b]([^a-z?&#-]|$)/.exec(url);
    const endChar = ",.;\u3002\uff0c\uff1b";
    const isSepSpace = !!sepArr && sepArr[0].length === 1;
    const first = sepArr ? url.slice(0, sepArr.index + (isSepSpace ? 0 : 1)) : null;
    const leftCharRe = /["(\u2018\u201c\u300a\uff08\uff1c]/;
    const rightChar = '")\u2019\u201d\u300b\uff09\uff1e';
    let nextTasks = (first || url).includes("#~:text=") ? 0 : 7;
 // 1: left, 2: right, 4: end
        nextTasks && first && (isSepSpace ? endChar.lastIndexOf(first.slice(-1), 2) >= 0 ? (url = first.slice(0, -1), 
    nextTasks = 3) : rightChar.includes(first.slice(-1)) && (nextTasks = leftCharRe.test(first.slice(i)) ? 0 : (url = first.slice(0, -1), 
    1)) : (url = first, nextTasks = 3));
    nextTasks & 4 && endChar.includes(url.slice(-1)) && (url = url.slice(0, -1));
    nextTasks & 2 && rightChar.includes(url.slice(-1)) && (leftCharRe.test(url.slice(i)) ? nextTasks = 0 : url = url.slice(0, -1));
    url && endChar.includes(url[0]) && (url = url.slice(1).trim());
    nextTasks & 1 && url && leftCharRe.test(url[0]) && (url = url.slice(1));
    normalize_urls_1.resetLastUrlType_();
    url = exports.fixCharsInUrl_(url, false, true);
    return normalize_urls_1.lastUrlType_ <= 2 /* Urls.Type.MaxOfInputIsPlainUrl */ && !url.startsWith("vimium:") ? url : str;
  };
  const fixCharsInUrl_ = (url, alwaysNo3002, forceConversion) => {
    let type = +url.includes("\u3002") + 2 * +url.includes("\uff1a");
    if (!type && !forceConversion) {
      return url;
    }
    let i = url.indexOf("//");
    i = url.indexOf("/", i >= 0 ? i + 2 : 0);
    if (i >= 0 && i < 4) {
      return url;
    }
    let str = i > 0 ? url.slice(0, i) : url;
    if (/^(data|javascript)[:\uff1a]/i.test(str)) {
      return url;
    }
    type & 1 && (str = str.replace(/\u3002/g, "."));
    type & 2 && (str = str.replace("\uff1a", ":").replace("\uff1a", ":"));
    i > 0 && (str += url.slice(i));
    normalize_urls_1.convertToUrl_(str, null, -2 /* Urls.WorkType.KeepAll */);
    return normalize_urls_1.lastUrlType_ <= 2 /* Urls.Type.MaxOfInputIsPlainUrl */ ? str : type !== 1 || !alwaysNo3002 || /[^.\w\u3002-]/.test(url) ? url : url.replace(/\u3002/g, ".");
  };
  exports.fixCharsInUrl_ = fixCharsInUrl_;
  const parseSearchEngines_ = (str, map) => {
    let ids, tmpRule, delimiter, key, obj, ind, pair, rules = [], reWhiteSpace = /\s/, register = k => !!((k = k.trim()) && k.length < 51 /* Consts.MinInvalidLengthOfSearchKey */) && (map.set(k, obj), 
    true);
    for (let val of str.replace(/\\(?:\n|\\\n[^\S\n]*)/g, "").split("\n")) {
      val = val.trim();
      if (val < "$" /* kChar.minNotCommentHead */) {
        continue;
      }
 // mask: /[!"#]/
            ind = 0;
      do {
        ind = val.indexOf(":", ind + 1);
      } while (val.charCodeAt(ind - 1) === 92 /* kCharCode.backslash */);
      if (ind <= 0 || !(key = val.slice(0, ind).trimRight())) {
        continue;
      }
      ids = key.replace(/\\:/g, ":").split("|");
      val = val.slice(ind + 1).trimLeft();
      if (!val) {
        continue;
      }
      key = val.replace(/\\\s/g, "\\s");
      ind = key.search(reWhiteSpace);
      let blank = "";
      if (ind >= 0) {
        str = val.slice(ind);
        val = key.slice(0, ind);
        ind = str.search(/\sblank=/i);
        if (ind >= 0) {
          let ind2 = str.slice(ind + 7).search(reWhiteSpace);
          ind2 = ind2 > 0 ? ind + 7 + ind2 : 0;
          blank = str.slice(ind + 7, ind2 || void 0);
          str = str.slice(0, ind) + (ind2 ? str.slice(ind2) : "");
        }
        ind = str.search(/\sre=/i);
      } else {
        val = key;
        str = "";
      }
      val = val.replace(/\\s/g, " ").trim().replace(/([^\\]|^)%(s)/gi, "$1$$$2").replace(/\\%/g, "%");
      obj = {
        name_: "",
        url_: val,
        blank_: blank,
        complex_: map.size > 1
      };
      if (ids.includes("~") && obj.complex_) {
        normalize_urls_1.convertToUrl_(val, null, -2 /* Urls.WorkType.KeepAll */);
        normalize_urls_1.lastUrlType_ > 2 /* Urls.Type.MaxOfInputIsPlainUrl */ && (ids = ids.filter(i => i !== "~"));
      }
      ids = ids.filter(register);
      if (ids.length === 0) {
        continue;
      }
      if (ind === -1) {
        normalize_urls_1.searchWordRe_.lastIndex = 0;
        while ((pair = normalize_urls_1.searchWordRe_.exec(val)) && pair[0].endsWith("$")) {}
        if (pair && (ind = pair.index + 1)) {
          key = pair[2];
          if (key) {
            key = /^s:/i.test(key) ? key[0] === "s" ? "+" : " " : key;
            delimiter = "";
          } else {
            key = pair[1] === "s" ? "+" : " ";
            delimiter = [ key ];
          }
          val = val.replace(normalize_urls_1.searchWordRe_, (_, s1) => "$" + (s1 || "s")).toLowerCase();
          val = normalize_urls_1.convertToUrl_(val, null, -1 /* Urls.WorkType.ConvertKnown */);
          normalize_urls_1.lastUrlType_ > 2 /* Urls.Type.MaxOfInputIsPlainUrl */ && (val = val.replace(/%24(%24|s)/g, decodeURIComponent));
          ind = 0;
          val = val.replace(/\$[$s]/g, (s, index) => s === "$$" ? (ind > 0 || ind--, "$") : (ind = ind > 0 ? ind : ind + index + 1, 
          s));
          if (tmpRule = reParseSearchUrl_(val, ind, key)) {
            if (key.includes("$")) {
              key = key.replace(normalize_urls_1.searchVariableRe_, s => s === "$$" ? "\\$" : "(.*)");
              delimiter = new RegExp("^" + key, /[a-z]/i.test(key) ? "i" : "");
            } else {
              delimiter = delimiter || key.trim() || " ";
            }
            rules.push({
              prefix_: tmpRule.prefix_,
              matcher_: tmpRule.matcher_,
              name_: ids[0].trimRight(),
              delimiter_: delimiter
            });
          }
        }
      } else if (str.charAt(ind + 4) && !reWhiteSpace.test(str.charAt(ind + 4))) {
        key = ind > 1 ? str.slice(1, ind).trim() : "";
        const useSlash = str.charCodeAt(ind + 4) === 47 /* kCharCode.slash */;
        if (useSlash) {
          str = str.slice(ind + 5);
          ind = str.search(/[^\\]\//) + 1;
        } else {
          str = str.slice(ind + 4);
          ind = str.search(reWhiteSpace);
        }
        val = str.slice(0, ind);
        str = str.slice(useSlash ? ind + 1 : ind);
        ind = str.search(reWhiteSpace);
        const tmpKey2 = BgUtils_.makeRegexp_(val, useSlash ? ind >= 0 ? str.slice(0, ind) : str : "");
        if (tmpKey2) {
          key = exports.prepareReParsingPrefix_(key);
          rules.push({
            prefix_: key,
            matcher_: tmpKey2,
            name_: ids[0].trimRight(),
            delimiter_: [ obj.url_.lastIndexOf("$S") >= 0 ? " " : "+" ]
          });
        }
        str = ind >= 0 ? str.slice(ind + 1) : "";
      } else {
        str = str.slice(ind + 4);
      }
      str = str.trimLeft();
      obj.name_ = str ? BgUtils_.DecodeURLPart_(str) : ids[ids.length - 1].trimLeft();
    }
    return rules;
  };
  exports.parseSearchEngines_ = parseSearchEngines_;
  const reParseSearchUrl_ = (url, ind, pattern) => {
    if (ind < 1 || !BgUtils_.protocolRe_.test(url)) {
      return null;
    }
    let prefix, str, str2, ind2;
    prefix = url.slice(0, ind - 1);
    if (ind = Math.max(prefix.lastIndexOf("?"), prefix.lastIndexOf("#")) + 1) {
      str2 = str = prefix.slice(ind);
      prefix = prefix.slice(0, prefix.search(/[#?]/));
      (ind2 = str.lastIndexOf("&") + 1) && (str2 = str.slice(ind2));
      const excluded = (pattern.includes("&") ? "" : "&") + (pattern.includes("#") ? "" : "#");
      if (str2 && str2.indexOf("=") >= 1) {
        str = "[#&?]";
        url = `([^${excluded}]*)`;
      } else {
        str2 = str;
        str = url[ind - 1] === "#" ? "#" : str2 ? "[#?]" : "\\?";
        url = `([^${excluded}?]*)`;
      }
    } else {
      const excluded = (pattern.includes("#") ? "" : "#") + (pattern.includes("?") ? "" : "?");
      str = `^([^${excluded}]*)`;
      (str2 = url.slice(prefix.length + 2)) && (ind = str2.search(/[#?]/) + 1) && (str2 = str2.slice(0, ind - 1));
      url = "";
    }
    str2 = str2 && BgUtils_.escapeAllForRe_(str2).replace(/\\\+|%20| /g, "(?:\\+|%20| )");
    prefix = exports.prepareReParsingPrefix_(prefix);
    return {
      prefix_: prefix,
      matcher_: new RegExp(str + str2 + url, /[a-z]/i.test(str2) ? "i" : "")
    };
  };
  const prepareReParsingPrefix_ = prefix => {
    const head = prefix.slice(0, 9).toLowerCase(), httpType = BgUtils_.IsURLHttp_(head);
    httpType ? prefix = prefix.slice(httpType) : head === "vimium://" && (prefix = normalize_urls_1.formatVimiumUrl_(prefix.slice(9), false, -1 /* Urls.WorkType.ConvertKnown */));
    return prefix;
  };
  exports.prepareReParsingPrefix_ = prepareReParsingPrefix_;
});
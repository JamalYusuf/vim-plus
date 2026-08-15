"use strict";
__filename = "background/normalize_urls.js";
define([ "require", "exports", "./store", "./utils" ], (require, exports, store_1, utils_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.normalizeSVG_ = exports.decodeFileURL_ = exports.reformatURL_ = exports.createSearch_ = exports.getDelimiter_ = exports.createSearchUrl_ = exports.formatVimiumUrl_ = exports.removeComposedScheme_ = exports.checkSpecialSchemes_ = exports.convertToUrl_ = exports.resetLastUrlType_ = exports.hasUsedKeyword_ = exports.lastUrlType_ = exports.tailSedKeysRe_ = exports.tailClipNameRe_ = exports.headClipNameRe_ = exports.searchVariableRe_ = exports.searchWordRe_ = exports.quotedStringRe_ = exports.customProtocolRe_ = exports.hostRe_ = void 0;
  exports.hostRe_ = /^([^:]+(:[^:]+)?@)?([^:]+|\[[^\]]+])(:\d{2,5})?$/;
  exports.customProtocolRe_ = /^(?:ext|web)\+[a-z]+:/;
  exports.quotedStringRe_ = /^"[^"]*"$|^'[^']*'$|^\u201c[^\u201d]*\u201d$/;
  exports.searchWordRe_ = /\$([sS$])?(?:\{([^}]*)})?/g;
  exports.searchVariableRe_ = /\$([+-]?\d+|\$)/g;
  exports.headClipNameRe_ = /^[\w\x80-\ufffd]{1,8}!?>/;
  exports.tailClipNameRe_ = /<[\w\x80-\ufffd]{1,8}!?$/;
  exports.tailSedKeysRe_ = /\|([\w\x80-\ufffd]{1,8}|(,|%2[cC])[\w,-]*)$/;
  const KnownPages_ = [ "blank", "newtab", "options", "show", "wiki", "sidepanel" ];
  const kOpts = "options.html";
  const kWiki = "wiki.html";
  // Internal-only redirects (no external GitHub / upstream project links)
    const RedirectedUrls_ = {
    __proto__: null,
    about: kWiki + "#about",
    changelog: kWiki + "#changelog",
    help: kWiki,
    home: kWiki,
    license: kWiki + "#license",
    option: kOpts,
    permissions: kWiki + "#permissions",
    policy: kWiki + "#privacy",
    action: kOpts,
    popup: kOpts,
    preference: kOpts,
    preferences: kOpts,
    privacy: kWiki + "#privacy",
    profile: kOpts,
    profiles: kOpts,
    readme: kWiki,
    release: kWiki + "#changelog",
    releases: kWiki + "#changelog",
    "release-notes": kWiki + "#changelog",
    setting: kOpts,
    settings: kOpts,
    wiki: kWiki,
    docs: kWiki,
    documentation: kWiki,
    hashbang: kWiki + "#hashbangs",
    hashbangs: kWiki + "#hashbangs",
    bangs: kWiki + "#hashbangs",
    keys: kWiki + "#keys",
    shortcuts: kWiki + "#keys",
    panel: kWiki + "#side-panel",
    "view-fx": kWiki + "#view-fx",
    viewfx: kWiki + "#view-fx",
    views: kWiki + "#view-fx",
    colors: kWiki + "#look-colors",
    "look-colors": kWiki + "#look-colors",
    faq: kWiki + "#faq",
    recipes: kWiki + "#daily-loop",
    daily: kWiki + "#daily-loop",
    palette: kWiki + "#command-palette",
    commands: kWiki + "#command-palette",
    troubleshoot: kWiki + "#troubleshooting",
    troubleshooting: kWiki + "#troubleshooting",
    yank: kWiki + "#copy-yank",
    copy: kWiki + "#copy-yank",
    visual: kWiki + "#visual-mode",
    find: kWiki + "#find-mode",
    tabs: kWiki + "#tabs-windows"
  };
  exports.lastUrlType_ = 0 /* Urls.Type.Full */;
  exports.hasUsedKeyword_ = false;
  const resetLastUrlType_ = () => {
    exports.lastUrlType_ = 0 /* Urls.Type.Full */;
  };
  exports.resetLastUrlType_ = resetLastUrlType_;
  exports.convertToUrl_ = (str, keyword, vimiumUrlWork, _isNested) => {
    str = str.trim();
    exports.lastUrlType_ = 0 /* Urls.Type.Full */;
    if (utils_1.isJSUrl_(str)) {
      str = str.replace(/\xa0/g, " ");
      utils_1.resetRe_();
      return str;
    }
    let index, index2, oldString, arr, type = -1 /* Urls.TempType.Unspecified */ , expected = 0 /* Urls.Type.Full */ , hasPath = false;
    // refer: https://cs.chromium.org/chromium/src/url/url_canon_etc.cc?type=cs&q=IsRemovableURLWhitespace&g=0&l=18
    // here's not its copy, but a more generalized strategy
        oldString = str.replace(/[\n\r]+[\t \xa0]*/g, "").replace(/\xa0/g, " ");
    const isQuoted = oldString[0] === '"' && oldString.endsWith('"'), oldStrForSearch = oldString;
    str = oldString = isQuoted ? oldString.slice(1, -1) : oldString;
    if (/^[A-Za-z]:(?:[\\/](?![:*?"<>|/])|$)|^\/(?:Users|home|root)\/[^:*?"<>|/]+/.test(str) || str.startsWith("\\\\") && str.length > 3) {
      return convertFromFilePath(str);
    }
    str = oldString.toLowerCase();
    (index = str.indexOf(" ") + 1 || str.indexOf("\t") + 1) > 1 && (str = str.slice(0, index - 1));
    if ((index = str.indexOf(":")) === 0) {
      type = 4 /* Urls.Type.Search */;
    } else if (index !== -1 && utils_1.protocolRe_.test(str)) {
      if (str.startsWith("vimium:")) {
        type = 3 /* Urls.Type.PlainVimium */;
        vimiumUrlWork |= 0;
        str = oldString.slice(9);
        vimiumUrlWork < -1 /* Urls.WorkType.ConvertKnown */ || !str ? oldString = "vimium://" + str : vimiumUrlWork === -1 /* Urls.WorkType.ConvertKnown */ || isQuoted || !(oldString = store_1.evalVimiumUrl_(str, vimiumUrlWork, null, (_isNested || 0) + 1)) ? oldString = exports.formatVimiumUrl_(str, false, vimiumUrlWork) : typeof oldString !== "string" && (type = 5 /* Urls.Type.Functional */);
      } else {
        exports.customProtocolRe_.test(str) ? type = 0 /* Urls.Type.Full */ : ((index2 = str.indexOf("/", index + 3)) === -1 ? str.length < oldString.length : str.charCodeAt(index2 + 1) < 33 /* kCharCode.minNotSpace */) ? type = 4 /* Urls.Type.Search */ : /[^a-z]/.test(str.slice(0, index)) ? type = (index = str.charCodeAt(index + 3)) > 32 /* kCharCode.space */ && index !== 47 /* kCharCode.slash */ ? 0 /* Urls.Type.Full */ : 4 /* Urls.Type.Search */ : str.startsWith("file:") ? type = 0 /* Urls.Type.Full */ : str.startsWith("chrome:") ? type = str.length < oldString.length && str.includes("/") ? 4 /* Urls.Type.Search */ : 0 /* Urls.Type.Full */ : store_1.IsEdg_ && str.startsWith("read:") ? 
        // read://http_xn--6qq79v_8715/?url=http%3A%2F%2Fxn--6qq79v%3A8715%2Fhello%2520-%2520world.html
        type = !/^read:\/\/([a-z]+)_([.\da-z\-]+)(?:_(\d+))?\/\?url=\1%3a%2f%2f\2(%3a\3)?(%2f|$)/.test(str) || str.length < oldString.length ? 4 /* Urls.Type.Search */ : 0 /* Urls.Type.Full */ : str = str.slice(index + 3, index2 >= 0 ? index2 : void 0);
        // Note: here `string` should be just a host, and can only become a hostname.
            }
    } else {
      index !== -1 && str.lastIndexOf("/", index) < 0 && (type = exports.checkSpecialSchemes_(oldString.toLowerCase(), index, str.length % oldString.length));
      expected = 2 /* Urls.Type.NoScheme */;
      index2 = oldString.length;
      if (type === -1 /* Urls.TempType.Unspecified */ && str.startsWith("//")) {
        str = str.slice(2);
        expected = 1 /* Urls.Type.NoProtocolName */;
        index2 -= 2;
      }
      if (type !== -1 /* Urls.TempType.Unspecified */) {
        str === "about:blank/" && (oldString = "about:blank");
      } else if ((index = str.indexOf("/")) <= 0) {
        (index === 0 || str.length < index2) && (type = 4 /* Urls.Type.Search */);
      } else if (str.length >= index2 || str.charCodeAt(index + 1) > 32 /* kCharCode.space */) {
        hasPath = str.length > index + 1;
        str = str.slice(0, index);
      } else {
        type = 4 /* Urls.Type.Search */;
      }
    }
    if (type === -1 /* Urls.TempType.Unspecified */ && str.lastIndexOf("%") >= 0) {
      str = utils_1.DecodeURLPart_(str);
      str.includes("/") && (type = 4 /* Urls.Type.Search */);
    }
    type === -1 /* Urls.TempType.Unspecified */ && str.startsWith(".") && (str = str.slice(1));
    if (type !== -1 /* Urls.TempType.Unspecified */) {} else if (arr = exports.hostRe_.exec(str)) {
      if ((str = arr[3]).endsWith("]")) {
        type = utils_1.isIPHost_(str, 6) ? expected : 4 /* Urls.Type.Search */;
      } else if (str === "localhost" || str.endsWith(".localhost") || utils_1.isIPHost_(str, 4) || arr[4] && hasPath) {
        type = expected;
      } else if ((index = str.lastIndexOf(".")) < 0 || (type = utils_1.isTld_(str.slice(index + 1), false, str)) === 0 /* Urls.TldType.NotTld */) {
        index2 = str.length - index - 1;
        // the new gTLDs allow long and notEnglish TLDs
        // https://en.wikipedia.org/wiki/Generic_top-level_domain#New_top-level_domains
                type = expected !== 2 /* Urls.Type.NoScheme */ && (index < 0 || (expected !== 0 /* Urls.Type.Full */ ? index2 >= 3 && index2 <= 5 : index2 >= 2 && index2 <= 14) && !/[^a-z]/.test(str.slice(index + 1))) || checkInDomain_(str, arr[4]) > 0 ? expected : 4 /* Urls.Type.Search */;
      } else {
        // non-English domain, maybe with an English but non-CC TLD
        type = /[^.\da-z_\-]|xn--|^-/.test(str) ? str.startsWith("xn--") || str.includes(".xn--") || (str.length === index + 3 || type !== 1 /* Urls.TldType.ENTld */ ? !expected : checkInDomain_(str, arr[4])) ? expected : 4 /* Urls.Type.Search */ : expected !== 2 /* Urls.Type.NoScheme */ || hasPath ? expected : str.endsWith(".so") && str.startsWith("lib") && str.indexOf(".") === str.length - 3 ? 4 /* Urls.Type.Search */ : arr[2] || arr[4] || !arr[1] || /^ftps?(\b|_)/.test(str) ? 2 /* Urls.Type.NoScheme */ : str.startsWith("mail") || str.indexOf(".mail") > 0 || (index2 = str.indexOf(".")) === index ? 4 /* Urls.Type.Search */ : str.indexOf(".", ++index2) !== index ? 2 /* Urls.Type.NoScheme */ : str.length === index + 3 && type === 1 /* Urls.TldType.ENTld */ && utils_1.isTld_(str.slice(index2, index), true) ? 4 /* Urls.Type.Search */ : 2 /* Urls.Type.NoScheme */;
      }
    } else {
      type = 4 /* Urls.Type.Search */;
      if (str.length === oldString.length && utils_1.isIPHost_(str = `[${str}]`, 6)) {
        oldString = str;
        type = 2 /* Urls.Type.NoScheme */;
      }
    }
    utils_1.resetRe_();
    _isNested || (exports.hasUsedKeyword_ = false);
    exports.lastUrlType_ = type;
    return type === 0 /* Urls.Type.Full */ ? /^extension:\/\//i.test(oldString) ? "chrome-" + oldString : oldString : type === 4 /* Urls.Type.Search */ ? // not increase _isNested here
    exports.createSearchUrl_(oldStrForSearch.split(utils_1.spacesRe_), keyword, vimiumUrlWork, _isNested) : type <= 2 /* Urls.Type.MaxOfInputIsPlainUrl */ ? type === 2 /* Urls.Type.NoScheme */ && _guessDomain(oldString, str) || (checkInDomain_(str, arr && arr[4]) === 2 ? "https:" : "http:") + (type === 2 /* Urls.Type.NoScheme */ ? "//" : "") + oldString : oldString;
  };
  const checkInDomain_ = (host, port) => {
    const domain = port && store_1.historyCache_.domains_.get(host + port) || store_1.historyCache_.domains_.get(host);
    return domain ? domain.https_ ? 2 : 1 : 0;
  };
  const _guessDomain = (url, host) => {
    if (/^(?!www\.)[a-z\d-]+\.([a-z]{3}(\.[a-z]{2})?|[a-z]{2})\/?$/i.test(url) && !checkInDomain_(host)) {
      const domain2 = store_1.historyCache_.domains_.get("www." + host);
      if (domain2) {
        return `${domain2.https_ ? "https" : "http"}://www.${url.toLowerCase().replace("/", "")}/`;
      }
    }
    return "";
  };
  const checkSpecialSchemes_ = (str, i, spacePos) => {
    const isSlash = str.substr(i + 1, 1) === "/";
    if (str.substr(i + 1, 1) === "%") {
      return 4 /* Urls.Type.Search */;
    }
    switch (str.slice(0, i)) {
     case "about":
      return isSlash ? 4 /* Urls.Type.Search */ : spacePos > 0 || str.includes("@", i) ? -1 /* Urls.TempType.Unspecified */ : 0 /* Urls.Type.Full */;

     case "blob":
     case "view-source":
      str = str.slice(i + 1);
      if (str.startsWith("blob:") || str.startsWith("view-source:")) {
        return 4 /* Urls.Type.Search */;
      }
      exports.convertToUrl_(str, null, -2 /* Urls.WorkType.KeepAll */ , 1);
      return exports.lastUrlType_ <= 2 /* Urls.Type.MaxOfInputIsPlainUrl */ ? 0 /* Urls.Type.Full */ : 4 /* Urls.Type.Search */;

     case "data":
      return isSlash ? 4 /* Urls.Type.Search */ : (i = str.indexOf(",", i)) < 0 || spacePos > 0 && spacePos < i ? -1 /* Urls.TempType.Unspecified */ : 0 /* Urls.Type.Full */;

     case "file":
      return 0 /* Urls.Type.Full */;

     case "filesystem":
      str = str.slice(i + 1);
      if (!utils_1.protocolRe_.test(str)) {
        return 4 /* Urls.Type.Search */;
      }
      exports.convertToUrl_(str, null, -2 /* Urls.WorkType.KeepAll */ , 1);
      return exports.lastUrlType_ === 0 /* Urls.Type.Full */ && /[^/]\/(?:persistent|temporary)(?:\/|$)/.test(str) ? 0 /* Urls.Type.Full */ : 4 /* Urls.Type.Search */;

     case "magnet":
      return str[i + 1] !== "?" ? -1 /* Urls.TempType.Unspecified */ : 0 /* Urls.Type.Full */;

     case "mailto":
      return isSlash ? 4 /* Urls.Type.Search */ : (i = str.indexOf("/", i)) > 0 && str.lastIndexOf("?", i) < 0 ? -1 /* Urls.TempType.Unspecified */ : 0 /* Urls.Type.Full */;

     case "tel":
      return /\d/.test(str) ? 0 /* Urls.Type.Full */ : 4 /* Urls.Type.Search */;

     default:
      return exports.customProtocolRe_.test(str) ? 0 /* Urls.Type.Full */ : isSlash ? 4 /* Urls.Type.Search */ : -1 /* Urls.TempType.Unspecified */;
    }
  };
  exports.checkSpecialSchemes_ = checkSpecialSchemes_;
  const removeComposedScheme_ = url => {
    const i = url.startsWith("filesystem:") ? 11 : url.startsWith("view-source:") ? 12 : 0;
    return i ? url.slice(i) : url;
  };
  exports.removeComposedScheme_ = removeComposedScheme_;
  const formatVimiumUrl_ = (fullPath, partly, vimiumUrlWork) => {
    let ind, tempStr, subPath = "", query = "", path = fullPath.trim();
    if (!path) {
      return partly ? "" : store_1.Origin2_ + "pages/";
    }
    if (ind = path.indexOf(" ") + 1) {
      query = path.slice(ind).trim();
      path = path.slice(0, ind - 1);
    }
    if (ind = path.search(/[\/#?]/) + 1) {
      subPath = path.slice(ind - 1).trim();
      path = path.slice(0, ind - 1);
    }
    path === "display" && (path = "show");
    if (!/\.\w+$/.test(path)) {
      path = path.toLowerCase();
      if ((tempStr = RedirectedUrls_[path]) != null) {
        // Always resolve to in-extension pages (no external project wiki)
        tempStr = path = tempStr || kWiki;
      } else {
        if (path === "newtab") {
          return store_1.newTabUrl_f;
        }
        if (path[0] === "/" || KnownPages_.indexOf(path) >= 0) {
          path += ".html";
        } else {
          if (vimiumUrlWork === 1 /* Urls.WorkType.ActIfNoSideEffects */ || vimiumUrlWork === -1 /* Urls.WorkType.ConvertKnown */) {
            return "vimium://" + fullPath.trim();
          }
          path = "show.html#!url vimium://" + path;
        }
      }
    }
    partly || tempStr && tempStr.includes("://") || (path = store_1.Origin2_ + (path[0] === "/" ? path.slice(1) : "pages/" + path));
    subPath && (path += subPath);
    return path + (query && (path.includes("#") ? " " : "#!") + query);
  };
  exports.formatVimiumUrl_ = formatVimiumUrl_;
  exports.createSearchUrl_ = (query, keyword, vimiumUrlWork, _isNested) => {
    keyword = keyword || "~";
    const pattern = store_1.searchEngines_.map.get(keyword);
    const url = pattern ? exports.createSearch_(query, pattern.url_, pattern.blank_) : query.join(" ");
    _isNested || (exports.hasUsedKeyword_ = !!pattern && keyword !== "~");
    if (keyword !== "~") {
      return exports.convertToUrl_(url, null, vimiumUrlWork, (_isNested || 0) + 1);
    }
    exports.lastUrlType_ = 4 /* Urls.Type.Search */;
    return url;
  };
  const getDelimiter_ = (url, limit) => url.lastIndexOf("://", 21) < 0 || utils_1.isJSUrl_(url) || url.startsWith("vimium://run") || url.startsWith("data:") || !/\?|#.*=/.test(url.slice(0, limit)) ? "%20" : "+";
  exports.getDelimiter_ = getDelimiter_;
  exports.createSearch_ = (query, url, blank, indexes) => {
    let q2, delta = 0;
    url = query.length === 0 && blank ? blank : url.replace(exports.searchWordRe_, (full, s1, s2, ind) => {
      let arr;
      if (full.endsWith("$") || !s1 && !s2) {
        return "$";
      }
      if (!s1) {
        if (/^s:/i.test(s2)) {
          s1 = s2[0];
          s2 = s2 === null || s2 === void 0 ? void 0 : s2.slice(2);
        } else {
          s1 = "s";
        }
      }
      let localQuery = query;
      let sed = s2 ? exports.tailSedKeysRe_.exec(s2) : null;
      sed && s2.charAt(sed.index - 1) !== "\\" ? s2 = s2.slice(0, sed.index) : sed = null;
      const clip = s2 ? exports.tailClipNameRe_.exec(s2) || exports.headClipNameRe_.exec(s2) : null;
      if (clip && (clip[0][0] !== "<" || s2.charAt(clip.index - 1) !== "\\")) {
        s2 = clip[0][0] === "<" ? s2.slice(0, clip.index) : s2.slice(clip[0].length);
        localQuery = store_1.readInnerClipboard_(clip[0][0] === "<" ? clip[0].slice(1) : clip[0].slice(0, -1)).split(" ");
      }
      if (s1 === "S") {
        arr = localQuery;
        s1 = " ";
      } else {
        arr = localQuery === query && q2 ? q2 : localQuery.map(utils_1.encodeAsciiComponent_);
        localQuery === query && !q2 && (q2 = arr);
        s1 = exports.getDelimiter_(url, ind);
      }
      s2 && s2.includes("\\") && (s2 = s2.replace(/\\([\\<>|])/g, "$1"));
      s2 = arr.length === 0 ? "" : s2 && s2.includes("$") ? s2.replace(exports.searchVariableRe_, (_t, s3) => {
        if (s3 === "$") {
          return "$";
        }
        let i = parseInt(s3, 10);
        if (!i) {
          return arr.join(s1);
        }
        if (i < 0) {
          i += arr.length + 1;
        } else if (s3[0] === "+") {
          return arr.slice(i - 1).join(s1);
        }
        return arr[i - 1] || "";
      }) : arr.join(s2 != null ? s2 : s1);
      sed && (s2 = store_1.substitute_(s2, 0 /* SedContext.NONE */ , utils_1.DecodeURLPart_(sed[0].slice(1))));
      if (indexes != null && s2) {
        ind += delta;
        indexes.push(ind, ind + s2.length);
        delta += s2.length - full.length;
      }
      return s2;
    });
    utils_1.resetRe_();
    return indexes == null ? url : {
      url_: url,
      indexes_: indexes
    };
  };
  const reformatURL_ = url => {
    let ind = url.indexOf(":"), ind2 = ind;
    if (ind <= 0) {
      return url;
    }
    if (exports.customProtocolRe_.test(url.slice(0, ind + 1).toLowerCase())) {
      return url.slice(0, ind).toLowerCase() + url.slice(ind);
    }
    if (url.substr(ind, 3) === "://") {
      ind = url.indexOf("/", ind + 3);
      if (ind < 0) {
        ind = ind2;
        ind2 = -1;
      } else if (ind === 7 && url.slice(0, 4).toLowerCase() === "file") {
        ind = url.charAt(9) === ":" ? 3 : url.substr(9, 3).toLowerCase() === "%3a" ? 5 : 0;
        return "file:///" + (ind ? url[8].toUpperCase() + ":/" : "") + url.slice(ind + 8);
      }
      // may be file://*/
        }
    const origin = url.slice(0, ind), o2 = origin.toLowerCase();
    ind2 === -1 && /^(file|ftp|https?|rt[ms]p|wss?)$/.test(origin) && (url += "/");
    return origin !== o2 ? o2 + url.slice(ind) : url;
  };
  exports.reformatURL_ = reformatURL_;
  const normalizeFileHost = host => {
    const host2 = utils_1.DecodeURLPart_(host);
    return /[^\w.$+-\x80-\ufffd]|\s/.test(host2) ? host.replace(/%24/g, "$") : host2;
  };
  const convertFromFilePath = path => {
    path = path.replace(/\\/g, "/");
    if (path.startsWith("//") && !path.startsWith("//./")) {
      path = path.slice(2);
      const host = path.split("/", 1)[0];
      host.includes("%") && (path = normalizeFileHost(host) + path.slice(host.length));
      path.includes("/") || (path += "/");
    } else {
      path.startsWith("//") && (path = path.slice(4));
      path[1] === ":" && (path = path[0].toUpperCase() + ":/" + path.slice(3));
      path[0] !== "/" && (path = "/" + path);
    }
    if (!/[%?#&\s]/.test(path)) {
      utils_1.resetRe_();
      return "file://" + path;
    }
    let hash = "";
    if (path.indexOf("#")) {
      let arr = /\.[A-Za-z\d]{1,4}(\?[^#]*)?#/.exec(path);
      if (arr) {
        hash = path.slice(arr.index + arr[0].length - 1);
        hash = hash.includes("=") || !hash.includes("/") || hash.includes(":~:") ? arr[1] ? arr[1] + hash : hash : "";
      } else {
        (arr = /#(\w+=|:~:)/.exec(path)) && (hash = path.slice(arr.index));
      }
      hash && (path = path.slice(0, -hash.length));
    }
    path = "file://" + path.replace(/[?#&\s]/g, encodeURIComponent) + hash.replace(/\s/g, encodeURIComponent);
    utils_1.resetRe_();
    return path;
  };
  const decodeFileURL_ = (url, rawUrl) => {
    if (store_1.os_ > 1 /* kOS.MAX_NOT_WIN */ && url.startsWith("file://")) {
      const slash = url.indexOf("/", 7);
      if (slash < 0 || slash === url.length - 1) {
        return slash < 0 ? url + "/" : url;
      }
      const type = slash === 7 ? url.charAt(9) === ":" ? 3 : url.substr(9, 3).toLowerCase() === "%3a" ? 5 : 0 : 0;
      const prefix = type ? url[8].toUpperCase() + ":" : slash > 7 ? "\\\\" + normalizeFileHost(url.slice(7, slash)) : "";
      let path = url.slice(type ? type + 7 : slash > 7 ? slash : 0);
      const rawHash = rawUrl ? /[?#]/.exec(rawUrl) : null;
      const _sep = !rawUrl || rawHash ? /[?#]/.exec(path) : null;
      let index = _sep ? _sep.index : 0;
      if (index && rawHash) {
        const path2 = utils_1.DecodeURLPart_(rawUrl.slice(rawUrl.indexOf("/", type ? 9 : slash > 7 ? 8 : 0), rawHash.index));
        path2 === path.slice(0, path2.length) && (index = path2.length);
      }
      const tail = index ? path.slice(index) : "";
      path = index ? path.slice(0, index) : path;
      path = path.replace(/\/+/g, "\\");
      url = prefix + path + tail;
    }
    return url;
  };
  exports.decodeFileURL_ = decodeFileURL_;
  const normalizeSVG_ = svg_outer_html => {
    let out;
    svg_outer_html.slice(0, 100).toLowerCase().includes("xmlns") || (svg_outer_html = svg_outer_html.replace(/<svg /i, '$&xmlns="http://www.w3.org/2000/svg"'));
    out = svg_outer_html.replace(/<(?!\/)[^>]+>/g, attributes => attributes.replace(/\b(id|class|aria-[\w-]+)(\="[^"]+")? ?/g, ""));
    out = out.replace(/<\/?[A-Z:]+(?=\s|>)/g, s => s.toLowerCase());
    out = out.replace(/(?:[%?#]|[^\S ])+/g, encodeURIComponent);
    return "data:image/svg+xml," + out;
  };
  exports.normalizeSVG_ = normalizeSVG_;
});
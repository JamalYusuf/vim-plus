"use strict";
__filename = "background/eval_urls.js";
define([ "require", "exports", "./store", "./utils", "./browser", "./normalize_urls", "./parse_urls", "./ports", "./exclusions", "./open_urls" ], (require, exports, store_1, utils_1, browser_1, normalize_urls_1, parse_urls_1, ports_1, Exclusions, open_urls_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Exclusions = __importStar(Exclusions);
  store_1.set_evalVimiumUrl_((path, workType, onlyOnce, _isNested) => {
    let ind, cmd, arr, obj, res;
    workType |= 0;
    path === "paste" ? path += " ." : !path.includes("%20") || path.includes(" ") || path.startsWith("run") || (path = path.replace(/%20/g, " "));
    if (workType < 0 /* Urls.WorkType.ValidNormal */ || !(path = path.trim()) || (ind = path.search(/[/ ]/)) <= 0 || !/^[a-z][\da-z\-]*(?:\.[a-z][\da-z\-]*)*$/i.test(cmd = path.slice(0, ind).toLowerCase()) || /\.(?:css|html?|js)$/i.test(cmd)) {
      return null;
    }
    path = path.slice(ind + 1).trim();
    if (!path) {
      return null;
    }
    const mathSepRe = /[\s+,\uff0b\uff0c]+/g;
    if (workType === 1 /* Urls.WorkType.ActIfNoSideEffects */) {
      switch (cmd) {
       case "sum":
       case "mul":
        path = path.replace(mathSepRe, cmd === "sum" ? " + " : " * ");
        cmd = "e";
        break;

       case "avg":
       case "average":
        arr = path.split(mathSepRe);
        path = "(" + arr.join(" + ") + ") / " + arr.length;
        cmd = "e";
        break;
      }
    }
    if (workType === 1 /* Urls.WorkType.ActIfNoSideEffects */) {
      switch (cmd) {
       case "e":
       case "exec":
       case "eval":
       case "expr":
       case "calc":
       case "m":
       case "math":
        return browser_1.import2("/lib/math_parser.js").then( tryEvalMath_.bind(0, path));

       case "error":
        return [ path, 3 /* Urls.kEval.ERROR */ ];
      }
    } else if (workType >= 2 /* Urls.WorkType.ActAnyway */) {
      switch (cmd) {
       case "qa":
       case "quick":
       case "action":
       case "actions":
        // Omnibar ":" quick actions — privacy / history helpers
        return browser_1.import2("/background/quick_actions.js").then(mod => {
          const r = mod.runQuickAction_(path);
          return r instanceof Promise ? r : Promise.resolve(r);
        });

       case "run":
       case "run1":
       case "run-one":
       case "run-one-key":
        return [ [ cmd, path ], 6 /* Urls.kEval.run */ ];

       case "status":
       case "state":
        workType >= 3 /* Urls.WorkType.EvenAffectStatus */ && 
         forceStatus_(path);
        return [ path, workType >= 3 /* Urls.WorkType.EvenAffectStatus */ ? 4 /* Urls.kEval.status */ : 7 /* Urls.kEval.plainUrl */ ];

       case "url-copy":
       case "search-copy":
       case "search.copy":
       case "copy-url":
        res = normalize_urls_1.convertToUrl_(path, null, 1 /* Urls.WorkType.ActIfNoSideEffects */ , _isNested);
        if (res instanceof Promise) {
          return res.then(arr1 => {
            let path2 = arr1[0] || arr1[2] || "";
            path2 = path2 instanceof Array ? path2.join(" ") : path2;
            return Promise.resolve(store_1.copy_(path2)).then(path22 => [ path22, 1 /* Urls.kEval.copy */ ]);
          });
        }
        // no break;
                res = normalize_urls_1.lastUrlType_ === 5 /* Urls.Type.Functional */ && res instanceof Array ? res[0] : res;
        path = res instanceof Array ? res.join(" ") : res;

       case "cp":
       case "copy":
       case "clip":
        // here `typeof path` must be `string`
        const path3 = store_1.copy_(path);
        return typeof path3 === "string" ? [ path, 1 /* Urls.kEval.copy */ ] : path3.then(path32 => [ path32, 1 /* Urls.kEval.copy */ ]);

       case "browser-search":
       case "browser-search2":
       case "browser-search.at":
       case "browser-search-at":
       case "bs":
       case "bs2":
       case "bs.at":
       case "bs-at":
       case "b-s":
       case "b-s2":
       case "b-s.at":
       case "b-s-at":
       case "b-search":
       case "b-search2":
       case "b-search.at":
       case "b-search-at":
        {
          let disposition = "NEW_TAB";
          if (cmd.endsWith("2") || cmd.endsWith("at")) {
            const prefixArr = /^[-\w][^ /]*/.exec(path);
            if (prefixArr) {
              const reuse = open_urls_1.parseReuse(prefixArr[0]);
              disposition = reuse === 2 /* ReuseType.newWnd */ ? "NEW_WINDOW" : reuse >= 0 /* ReuseType.current */ || reuse === -3 /* ReuseType.reuseInCurWnd */ ? "CURRENT_TAB" : disposition;
              path = path.slice(prefixArr[0].length + 1);
            }
          }
          path = path.trim().replace(utils_1.spacesRe_, " ");
          browser_1.browser_.search.query({
            disposition,
            text: path
          });
          return [ path, 9 /* Urls.kEval.browserSearch */ ];
        }
      }
    }
    switch (cmd) {
     case "urls":
      if (workType < 1 /* Urls.WorkType.ActIfNoSideEffects */) {
        return null;
      }
      return callOpenUrls(path, workType);

     case "cd":
     case "up":
      arr = (path + "  ").split(" ");
      if (!arr[2]) {
        if (workType < 1 /* Urls.WorkType.ActIfNoSideEffects */) {
          return null;
        }
        res = ports_1.getPortUrl_();
        if (typeof res !== "string") {
          return res.then(url => {
            const res1 = url && store_1.evalVimiumUrl_("cd " + path + " " + (path.includes(" ") ? url : ". " + url), workType, onlyOnce, _isNested);
            return res1 ? typeof res1 === "string" ? [ res1, 7 /* Urls.kEval.plainUrl */ ] : res1 : [ url ? "fail in parsing" : "No current tab found", 3 /* Urls.kEval.ERROR */ ];
          });
        }
        arr[2] = res;
      }
      cmd = arr[0];
      let startsWithSlash = cmd[0] === "/";
      ind = parseInt(cmd, 10);
      ind = isNaN(ind) ? cmd === "/" ? 1 : startsWithSlash ? cmd.replace(/(\.+)|./g, "$1").length + 1 : -cmd.replace(/\.(\.+)|./g, "$1").length || -1 : ind;
      let cdRes = parse_urls_1.parseSearchUrl_({
        u: arr[2],
        p: ind,
        t: null,
        f: 1,
        a: arr[1] !== "." ? arr[1] : ""
      });
      return cdRes && cdRes.u || [ cdRes ? cdRes.e : "No upper path", 3 /* Urls.kEval.ERROR */ ];

     case "parse":
     case "decode":
      cmd = path.split(" ", 1)[0];
      cmd.search(/\/|%2f/i) < 0 ? path = path.slice(cmd.length + 1).trimLeft() : cmd = "~";
      path = utils_1.decodeEscapedURL_(path);
      arr = [ path ];
      path = normalize_urls_1.convertToUrl_(path, null, 0 /* Urls.WorkType.Default */ , _isNested);
      if (normalize_urls_1.lastUrlType_ !== 4 /* Urls.Type.Search */ && (obj = parse_urls_1.parseSearchUrl_({
        u: path
      }))) {
        if (obj.u === "") {
          arr = [ cmd ];
        } else {
          arr = obj.u.split(" ");
          arr.unshift(cmd);
        }
      } else {
        arr = arr[0].split(utils_1.spacesRe_);
      }
      break;

     case "sed":
     case "substitute":
     case "sed-p":
     case "sed.p":
     case "sed2":
      const first = path.split(" ", 1)[0];
      path = path.slice(first.length + 1).trim();
      const second = cmd === "sed2" ? path.split(" ", 1)[0] : "";
      path = path.slice(second.length).trim();
      path = path && store_1.substitute_(path, cmd.endsWith("p") ? 32768 /* SedContext.paste */ : 0 /* SedContext.NONE */ , second ? {
        r: first,
        k: second
      } : /^[@#$-]?[\w\x80-\ufffd]+$|^\.$/.test(first) ? {
        r: null,
        k: first
      } : {
        r: first,
        k: null
      });
      return [ path, 5 /* Urls.kEval.paste */ ];

     case "u":
     case "url":
     case "search":
      // here path is not empty, and so `decodeEscapedURL(path).trim()` is also not empty
      arr = utils_1.decodeEscapedURL_(path, true).split(utils_1.spacesRe_);
      break;

     case "paste":
      if (workType > 0) {
        res = store_1.paste_(path);
        return res instanceof Promise ? res.then(s => [ s ? s.trim().replace(utils_1.spacesRe_, " ") : "", 5 /* Urls.kEval.paste */ ]) : [ res ? res.trim().replace(utils_1.spacesRe_, " ") : "", 5 /* Urls.kEval.paste */ ];
      }

     default:
      return null;
    }
    if (onlyOnce) {
      return [ arr, 2 /* Urls.kEval.search */ ];
    }
    if (_isNested && _isNested > 12) {
      return null;
    }
    let keyword = arr[0] && store_1.searchEngines_.map.has(arr[0]) ? arr.shift() : null;
    return normalize_urls_1.createSearchUrl_(arr, keyword, _isNested === 12 ? 0 /* Urls.WorkType.Default */ : workType, _isNested);
  });
  const tryEvalMath_ = (path, math_parser) => {
    normalize_urls_1.quotedStringRe_.test(path) && (path = path.slice(1, -1));
    path = path.replace(/\uff0c/g, " ");
    const re2 = /([\u2070-\u2079\xb2\xb3\xb9]+)|[\xb0\uff0b\u2212\xd7\xf7]|''?/g;
    path = path.replace(/deg\b/g, "\xb0").replace(/[\xb0']\s*\d+(\s*)(?=\)|$)/g, (str, g1) => {
      str = str.trim();
      return str + (str[0] === "'" ? "''" : "'") + g1;
    }).replace(re2, (str, g1) => {
      let i, out = "";
      if (!g1) {
        return str === "\xb0" ? "/180*PI+" : (i = "\uff0b\u2212\xd7\xf7".indexOf(str)) >= 0 ? "+-*/"[i] : `/${str === "''" ? 3600 : 60}/180*PI+`;
      }
      for (const ch of str) {
        out += ch < "\xba" ? ch > "\xb3" ? 1 : ch < "\xb3" ? 2 : 3 : ch.charCodeAt(0) - 8304;
      }
      return out && "**" + out;
    }).replace(/([\d.])rad\b/g, "$1");
    path = path.replace(/^=+|=+$/g, "").trim();
    let nParenthesis = [].reduce.call(path, (n, ch) => n + (ch === "(" ? 1 : ch === ")" ? -1 : 0), 0);
    for (;nParenthesis < 0; nParenthesis++) {
      path = "(" + path;
    }
    while (nParenthesis-- > 0) {
      path += ")";
    }
    if (path) {
      while (path && path[0] === "(" && path.slice(-1) === ")") {
        path = path.slice(1, -1).trim();
      }
      path = path || "()";
    }
    let result = "";
    let mathParser = math_parser.MathParser || globalThis.MathParser || {};
    if (mathParser.evaluate) {
      try {
        result = mathParser.evaluate(path !== "()" ? path : "0");
        result = typeof result === "function" ? "" : "" + result;
      } catch (_a) {}
      mathParser.clean();
      mathParser.errormsg && (mathParser.errormsg = "");
    }
    return [ result, 0 /* Urls.kEval.math */ , path ];
  };
  const forceStatus_ = act => {
    let tabId = store_1.curTabId_;
    if (parseInt(act, 10)) {
      tabId = parseInt(act, 10);
      act = act.slice(act.search(/[/ ]/) + 1);
    }
    const ref = store_1.framesForTab_.get(tabId || (tabId = store_1.curTabId_));
    if (!ref) {
      return;
    }
    if (ref.flags_ & 512 /* Frames.Flags.ResReleased */) {
      console.log(`Unexpected inactive Tab ${tabId}`);
      return;
    }
    store_1.set_cPort(ref.top_ || ref.cur_);
    let spaceInd = act.search(/[/ ]/), newPassedKeys = spaceInd > 0 ? act.slice(spaceInd + 1) : "";
    act = act.toLowerCase();
    spaceInd > 0 && (act = act.slice(0, spaceInd));
    act.includes("-") && act.endsWith("able") && (act += "d");
    const silent = !!newPassedKeys && /^silent/i.test(newPassedKeys);
    newPassedKeys = (silent ? newPassedKeys.slice(7) : newPassedKeys).trim();
    let shown = 0;
    const logAndShow = msg => {
      console.log(msg), shown || ports_1.showHUD(msg);
      shown = 1;
    };
    newPassedKeys.includes("%") && /%[a-f0-9]{2}/i.test(newPassedKeys) && (newPassedKeys = utils_1.DecodeURLPart_(newPassedKeys));
    if (newPassedKeys && !newPassedKeys.startsWith("^ ")) {
      logAndShow('"vimium://status" only accepts a list of hooked keys');
      newPassedKeys = "";
    } else if (newPassedKeys) {
      const passArr = newPassedKeys.match(/<(?!<)(?:a-)?(?:c-)?(?:m-)?(?:s-)?(?:[a-z]\w+|[^\sA-Z])>|\S/g);
      newPassedKeys = passArr ? passArr.join(" ").replace(/<(\S+)>/g, "$1") : "";
    }
    let pattern;
    const curSender = store_1.cPort.s, oldStatus = curSender.status_, stdStatus = Exclusions.exclusionListening_ ? oldStatus === 1 /* Frames.Status.partial */ ? oldStatus : (pattern = Exclusions.getExcluded_(curSender.url_, curSender), 
    pattern ? 1 /* Frames.Status.partial */ : pattern === null ? 0 /* Frames.Status.enabled */ : 2 /* Frames.Status.disabled */) : 0 /* Frames.Status.enabled */ , stat = act === "enable" ? 0 /* Frames.Status.enabled */ : act === "disable" ? 2 /* Frames.Status.disabled */ : act === "toggle-disabled" ? oldStatus !== 2 /* Frames.Status.disabled */ ? stdStatus === 2 /* Frames.Status.disabled */ ? null : 2 /* Frames.Status.disabled */ : stdStatus === 2 /* Frames.Status.disabled */ ? 0 /* Frames.Status.enabled */ : null : act === "toggle-enabled" ? oldStatus !== 0 /* Frames.Status.enabled */ ? stdStatus === 0 /* Frames.Status.enabled */ ? null : 0 /* Frames.Status.enabled */ : stdStatus === 0 /* Frames.Status.enabled */ ? 2 /* Frames.Status.disabled */ : null : act === "toggle-next" ? oldStatus === 1 /* Frames.Status.partial */ ? 0 /* Frames.Status.enabled */ : oldStatus === 0 /* Frames.Status.enabled */ ? stdStatus === 2 /* Frames.Status.disabled */ ? null : 2 /* Frames.Status.disabled */ : stdStatus === 2 /* Frames.Status.disabled */ ? 0 /* Frames.Status.enabled */ : null : act === "toggle" || act === "next" ? oldStatus !== 0 /* Frames.Status.enabled */ ? 0 /* Frames.Status.enabled */ : 2 /* Frames.Status.disabled */ : (act !== "reset" && logAndShow(`Unknown status action: "${act}", so reset`), 
    null), enableWithPassedKeys = !!newPassedKeys && act === "enable", locked = stat === null ? 0 /* Frames.Flags.blank */ : stat === 2 /* Frames.Status.disabled */ ? 3 /* Frames.Flags.lockedAndDisabled */ : 1 /* Frames.Flags.locked */ , msg = {
      N: 1 /* kBgReq.reset */ ,
      p: stat === 2 /* Frames.Status.disabled */ || enableWithPassedKeys ? newPassedKeys : null,
      f: locked
    };
    // avoid Status.partial even if `newPassedKeys`, to keep other checks about Flags.locked correct
        let newStatus = locked ? stat : 0 /* Frames.Status.enabled */;
    ref.lock_ = locked ? {
      status_: newStatus,
      passKeys_: msg.p
    } : null;
    for (const port of ref.ports_) {
      const sender = port.s;
      if (!locked && Exclusions.exclusionListening_) {
        pattern = msg.p = Exclusions.getExcluded_(sender.url_, sender);
        newStatus = pattern === null ? 0 /* Frames.Status.enabled */ : pattern ? 1 /* Frames.Status.partial */ : 2 /* Frames.Status.disabled */;
        if (newStatus !== 1 /* Frames.Status.partial */ && sender.status_ === newStatus) {
          continue;
        }
      }
      // must send "reset" messages even if port keeps enabled by 'v.st enable'
      // - frontend may need to reinstall listeners
            sender.status_ = newStatus;
      port.postMessage(msg);
    }
    newStatus = ref.cur_.s.status_;
    silent || shown || ports_1.showHUDEx(store_1.cPort, "newStat", 0, [ [ newStatus !== 0 /* Frames.Status.enabled */ || enableWithPassedKeys ? newStatus === 2 /* Frames.Status.disabled */ ? "fullyDisabled" : "halfDisabled" : "fullyEnabled" ] ]);
    store_1.needIcon_ && newStatus !== oldStatus && store_1.setIcon_(tabId, newStatus);
  };
  const callOpenUrls = (path, workType) => {
    const ind = path.indexOf(":") + 1 || path.indexOf(" ") + 1;
    if (ind <= 0) {
      return [ "No search engines given", 3 /* Urls.kEval.ERROR */ ];
    }
    const keys = path.slice(0, ind - 1).split(path.lastIndexOf(" ", ind - 1) >= 0 ? " " : "|").filter(i => store_1.searchEngines_.map.has(i));
    if (keys.length <= 0) {
      return [ "No valid search engines found", 3 /* Urls.kEval.ERROR */ ];
    }
    const query = path.slice(ind).trim().split(" ");
    const urls = [ "openUrls" ];
    // `as string` is safe when only used by {@see open_urls.ts#onEvalUrl_}
        for (const keyword of keys) {
      urls.push(normalize_urls_1.createSearchUrl_(query, keyword, workType));
    }
    return urls.some(u => u instanceof Promise) ? Promise.all(urls).then(urls2 => [ urls2, 6 /* Urls.kEval.run */ ]) : [ urls, 6 /* Urls.kEval.run */ ];
  };
});
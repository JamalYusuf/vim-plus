"use strict";
__filename = "background/utils.js";
define([ "require", "exports", "./store" ], (require, exports, store_1) => {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.recencyBase_ = exports.nextConfUpdate = exports.splitWhenKeepExpressions = exports.extractComplexOptions_ = exports.tryParse = exports.isNotPriviledged = exports.getImageExtRe_ = exports.now = exports.encodeUnicode_ = exports.base64_ = exports.dedupChars_ = exports.normalizeXY_ = exports.getOmniSecret_ = exports.escapeAllForRe_ = exports.convertToDataURL_ = exports.fetchOnlineResources_ = exports.fetchFile_ = exports.asyncIter_ = exports.nextTick_ = exports.deferPromise_ = exports.makePattern_ = exports.makeRegexp_ = exports.normalizeElDesc_ = exports.normalizeClassesToMatch_ = exports.IsURLHttp_ = exports.encodeAsciiComponent_ = exports.encodeAsciiURI_ = exports.decodeEscapedURL_ = exports.decodeUrlForCopy_ = exports.DecodeURLPart_ = exports.safeParseURL_ = exports.isIPHost_ = exports.splitByPublicSuffix_ = exports.isTld_ = exports.safer_ = exports.safeObj_ = exports.isJSUrl_ = exports.escapeText_ = exports.unicodeLSubstring_ = exports.unicodeRSubstring_ = exports.resetRe_ = exports.keys_ = exports.extendIf_ = exports.protocolRe_ = exports.spacesRe_ = void 0;
  exports.spacesRe_ = /\s+/g;
  exports.protocolRe_ = /^[a-z][\+\-\.\da-z]+:\/\//;
  /**
     * both b and a must extend SafeObject
     */  const extendIf_ = (dest, a) => {
    for (const i in a) {
      dest[i] !== void 0 || (dest[i] = a[i]);
    }
    return dest;
  };
  exports.extendIf_ = extendIf_;
  exports.keys_ = map => Array.from(map.keys());
  const _reToReset = /a?/;
  const resetRe_ = () => _reToReset.test("");
  exports.resetRe_ = resetRe_;
  // start should in [0 .. length]; end should in [0 .. inf)
    const unicodeRSubstring_ = (str, start, end) => {
    const charCode = end < str.length && end > start ? str.charCodeAt(end - 1) : 0;
    // Note: ZWJ is too hard to split correctly (https://en.wikipedia.org/wiki/Zero-width_joiner)
    // so just remove such a character (if any)
    // unicode surrogates: https://www.jianshu.com/p/7ae9005e0671
        end += charCode >= 55296 && charCode < 56320 || charCode === 8205 && end > start + 1 ? -1 : 0;
    return str.slice(start, end);
  };
  exports.unicodeRSubstring_ = unicodeRSubstring_;
  const unicodeLSubstring_ = (str, start, end) => {
    const charCode = start > 0 && start < str.length && start < end ? str.charCodeAt(start) : 0;
    start += charCode >= 56320 && charCode <= 57343 || charCode === 8205 && start < str.length - 1 && start < end - 1 ? 1 : 0;
    return str.slice(start, end);
  };
  exports.unicodeLSubstring_ = unicodeLSubstring_;
  let escapeText_ = str => {
    const escapeRe = /["&'<>]/g;
    function escapeCallback(c) {
      const i = c.charCodeAt(0);
      return i === 38 /* kCharCode.and */ ? "&amp;" : i === 39 /* kCharCode.quote1 */ ? "&apos;" : i < 39 /* kCharCode.quote1 */ ? "&quot;" : i === 60 /* kCharCode.lt */ ? "&lt;" : "&gt;";
    }
    exports.escapeText_ = s => s.replace(escapeRe, escapeCallback);
    return exports.escapeText_(str);
  };
  exports.escapeText_ = escapeText_;
  const isJSUrl_ = s => s.charCodeAt(10) === 58 /* kCharCode.colon */ && s.slice(0, 10).toLowerCase() === "javascript";
  exports.isJSUrl_ = isJSUrl_;
  const _nonENTlds = ".\u4e2d\u4fe1.\u4e2d\u56fd.\u4e2d\u570b.\u4e2d\u6587\u7f51.\u4f01\u4e1a.\u4f5b\u5c71.\u4fe1\u606f.\u516c\u53f8.\u516c\u76ca.\u5546\u57ce.\u5546\u5e97.\u5546\u6807.\u5728\u7ebf.\u5a31\u4e50.\u5e7f\u4e1c.\u6211\u7231\u4f60.\u624b\u673a.\u62db\u8058.\u653f\u52a1.\u6e38\u620f.\u7f51\u5740.\u7f51\u5e97.\u7f51\u5e97.\u7f51\u7edc.\u8d2d\u7269.\u96c6\u56e2.\u9910\u5385.";
  const _tlds = [ "", "", ".ac.ad.ae.af.ag.ai.al.am.ao.aq.ar.as.at.au.aw.ax.az.ba.bb.bd.be.bf.bg.bh.bi.bj.bm.bn.bo.br.bs.bt.bv.bw.by.bz.ca.cc.cd.cf.cg.ch.ci.ck.cl.cm.cn.co.cr.cu.cv.cw.cx.cy.cz.de.dj.dk.dm.do.dz.ec.ee.eg.er.es.et.eu.fi.fj.fk.fm.fo.fr.ga.gb.gd.ge.gf.gg.gh.gi.gl.gm.gn.gp.gq.gr.gs.gt.gu.gw.gy.hk.hm.hn.hr.ht.hu.id.ie.il.im.in.io.iq.ir.is.it.je.jm.jo.jp.ke.kg.kh.ki.km.kn.kp.kr.kw.ky.kz.la.lb.lc.li.lk.lr.ls.lt.lu.lv.ly.ma.mc.md.me.mg.mh.mk.ml.mm.mn.mo.mp.mq.mr.ms.mt.mu.mv.mw.mx.my.mz.na.nc.ne.nf.ng.ni.nl.no.np.nr.nu.nz.om.pa.pe.pf.pg.ph.pk.pl.pm.pn.pr.ps.pt.pw.qa.re.ro.rs.ru.rw.sa.sb.sc.sd.se.sg.sh.si.sj.sk.sl.sm.sn.so.sr.ss.st.su.sv.sx.sy.sz.tc.td.tf.tg.th.tj.tk.tl.tm.tn.to.tr.tt.tv.tw.tz.ua.ug.uk.us.uy.uz.va.vc.ve.vg.vi.vn.vu.wf.ws.ye.yt.za.zm.zw", ".aaa.abb.abc.aco.ads.aeg.afl.aig.anz.aol.app.art.aws.axa.bar.bbc.bbt.bcg.bcn.bet.bid.bio.biz.bms.bmw.bnl.bom.boo.bot.box.buy.bzh.cab.cal.cam.car.cat.cba.cbn.cbs.ceb.ceo.cfa.cfd.com.cpa.crs.csc.dad.day.dds.dev.dhl.diy.dnp.dog.dot.dtv.dvr.eat.eco.edu.esq.eus.fan.fit.fly.foo.fox.frl.ftr.fun.fyi.gal.gap.gdn.gea.gle.gmo.gmx.goo.gop.got.gov.hbo.hiv.hkt.hot.how.ibm.ice.icu.ifm.inc.ing.ink.int.ist.itv.iwc.jcb.jcp.jio.jlc.jll.jmp.jnj.jot.joy.kfh.kia.kim.kpn.krd.lat.law.lds.llc.llp.lol.lpl.ltd.man.map.mba.med.men.mil.mit.mlb.mls.mma.moe.moi.mom.mov.msd.mtn.mtr.nab.nba.nec.net.new.nfl.ngo.nhk.now.nra.nrw.ntt.nyc.obi.off.one.ong.onl.ooo.org.ott.ovh.pay.pet.phd.pid.pin.pnc.pro.pru.pub.pwc.qvc.red.ren.ril.rio.rip.run.rwe.sap.sas.sbi.sbs.sca.scb.ses.sew.sex.sfr.ski.sky.soy.spa.srl.srt.stc.tab.tax.tci.tdk.tel.thd.tjx.top.trv.tui.tvs.ubs.uno.uol.ups.vet.vig.vin.vip.wed.win.wme.wow.wtc.wtf.xin.xxx.xyz.you.yun", ".aero.arpa.asia.auto.band.beer.chat.city.club.cool.coop.date.fans.fund.game.gift.gold.guru.help.host.info.jobs.life.link.live.loan.love.luxe.mobi.name.news.pics.plus.shop.show.site.sohu.team.tech.wang.wiki.work.yoga.zone", ".citic.cloud.email.games.group.local.onion.party.photo.press.rocks.space.store.today.trade.video.world", ".center.design.lawyer.market.museum.online.social.studio.travel", ".company.fashion.science.website", ".engineer.software" ];
  exports.safeObj_ = () => Object.create(null);
  exports.safer_ = opt => Object.setPrototypeOf(opt, null);
  const isTld_ = (tld, onlyEN, wholeHost) => !onlyEN && /[^a-z]/.test(tld) ? /^xn--[\x20-\x7f]+/.test(tld) || _nonENTlds.includes("." + tld + ".") ? 2 /* Urls.TldType.NonENTld */ : 0 /* Urls.TldType.NotTld */ : tld.length === 2 && wholeHost && ("cc.cu.in.rs.sh".includes(tld) ? wholeHost.includes("_") : tld === "so" && wholeHost.startsWith("lib")) ? 0 /* Urls.TldType.NotTld */ : tld && tld.length < _tlds.length && _tlds[tld.length].includes(tld) ? 1 /* Urls.TldType.ENTld */ : 0 /* Urls.TldType.NotTld */;
  exports.isTld_ = isTld_;
  const splitByPublicSuffix_ = host => {
    const arr = host.toLowerCase().split("."), i = arr.length;
    return [ arr, exports.isTld_(arr[i - 1]) === 0 /* Urls.TldType.NotTld */ ? 1 : i > 2 && arr[i - 1].length === 2 && exports.isTld_(arr[i - 2]) === 1 /* Urls.TldType.ENTld */ ? 3 : 2 ];
  };
  exports.splitByPublicSuffix_ = splitByPublicSuffix_;
  /** type: 0=all */  const isIPHost_ = (hostname, type) => {
    if (type !== 6 && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || type !== 4 && /^\[[\da-f]{0,4}(?::[\da-f]{0,4}){1,5}(?:(?::[\da-f]{0,4}){1,2}|:\d{0,3}(?:\.\d{0,3}){3})]$/.test(hostname)) {
      return !!exports.safeParseURL_("http://" + hostname);
    }
    return false;
  };
  exports.isIPHost_ = isIPHost_;
  exports.safeParseURL_ = store_1.CurCVer_ > 125 ? URL.parse : URL.parse || (url => {
    try {
      return new URL(url);
    } catch (_a) {
      return null;
    }
  });
  const DecodeURLPart_ = (url, wholeURL) => {
    if (!url || wholeURL !== "atob" && !url.includes("%")) {
      return url || "";
    }
    try {
      url = (wholeURL ? wholeURL === "atob" ? atob : decodeURI : decodeURIComponent)(url);
    } catch (_a) {}
    return url;
  };
  exports.DecodeURLPart_ = DecodeURLPart_;
  const decodeUrlForCopy_ = (url, __allowSpace) => {
    if (!url.includes("%")) {
      return url;
    }
    if (!exports.protocolRe_.test(url) && !/^(about|data|javascript|vimium)/i.test(url)) {
      return url;
    }
    const ori = url.replace(/%(2[356f]|3[adf]|40)/gi, "%25$1").replace(/%(?![\da-fA-F]{2})/g, "%25");
    let str = exports.DecodeURLPart_(ori, 1);
    str = str.length !== ori.length ? str : exports.encodeAsciiURI_(url, 1);
    const noSpace = !__allowSpace && (exports.protocolRe_.test(str) ? !str.startsWith("vimium:") : str.startsWith("data:") || str.startsWith("about:"));
    str = str.replace(noSpace ? exports.spacesRe_ : /[\r\n]+/g, encodeURIComponent);
    let ch = str && str.charAt(str.length - 1);
    if (ch && !/[a-z\d\ud800-\udfff]/i.test(ch)) {
      ch = ch < "\x7f" ? "%" + (ch.charCodeAt(0) + 256).toString(16).slice(1) : exports.encodeAsciiComponent_(ch);
      ch.length > 1 && (str = str.slice(0, str.length - 1) + ch);
    }
    return str;
  };
  exports.decodeUrlForCopy_ = decodeUrlForCopy_;
  const decodeEscapedURL_ = (url, allowSpace) => {
    url = !url.includes("://") && /%(?:2[36f]|3[adf])/i.test(url) ? exports.DecodeURLPart_(url).trim() : url;
    return exports.decodeUrlForCopy_(url, allowSpace);
  };
  exports.decodeEscapedURL_ = decodeEscapedURL_;
  const encodeAsciiURI_ = (url, encoded) => (encoded ? url : encodeURI(url)).replace(/(?:%[\da-f]{2})+/gi, s => {
    const t = exports.DecodeURLPart_(s);
    return t.length < s.length ? exports.encodeAsciiComponent_(t) : s;
  });
  exports.encodeAsciiURI_ = encodeAsciiURI_;
  const encodeAsciiComponent_ = url => url.replace(/[^\p{L}\p{N}]+/gu, encodeURIComponent);
  exports.encodeAsciiComponent_ = encodeAsciiComponent_;
  const IsURLHttp_ = url => {
    url = url.slice(0, 8).toLowerCase();
    return url.startsWith("http://") ? 7 /* ProtocolType.http */ : url === "https://" ? 8 /* ProtocolType.https */ : 0 /* ProtocolType.others */;
  };
  exports.IsURLHttp_ = IsURLHttp_;
  const normalizeClassesToMatch_ = s => s.trim() ? s.trim().split(/[.\s]+/g).sort().filter(i => !!i) : [];
  exports.normalizeClassesToMatch_ = normalizeClassesToMatch_;
  const normalizeElDesc_ = e => e && [ e[0], e[1], exports.normalizeClassesToMatch_(e[2] || "") ] || 0;
  exports.normalizeElDesc_ = normalizeElDesc_;
  const makeRegexp_ = (pattern, suffix, logError) => {
    try {
      return new RegExp(pattern, suffix);
    } catch (_a) {
      logError === 0 || console.log("%c/%s/%s", "color:#c41a16", pattern, suffix, "is not a valid regexp.");
    }
    return null;
  };
  exports.makeRegexp_ = makeRegexp_;
  exports.makePattern_ = (pattern, logError) => {
    if (!pattern.endsWith("*")) {
      const ind = pattern.indexOf("://");
      const ind2 = ind > 0 ? pattern.indexOf("/", ind + 3) : -1;
      pattern += ind > 0 && (ind2 === pattern.length - 1 || ind2 < 0) ? (ind2 > 0 ? "" : "/") + "*\\?*#*" : "";
    }
    try {
      return new URLPattern(pattern, "http://localhost", {
        ignoreCase: true
      });
    } catch (_a) {
      logError === 0 || console.log("%c/%s/%s", "color:#c41a16", pattern, "is not a valid URLPattern.");
    }
    return null;
  };
  let _tmpResolve = null;
  const _exposeResolve = newResolve => {
    _tmpResolve = newResolve;
  };
  const deferPromise_ = () => {
    const promise = new Promise( _exposeResolve);
    const newResolve = _tmpResolve;
    _tmpResolve = null;
    return {
      promise_: promise,
      resolve_: newResolve
    };
  };
  exports.deferPromise_ = deferPromise_;
  exports.nextTick_ = callback => {
    queueMicrotask(callback);
  };
  const asyncIter_ = (arr, callback, doesContinue) => {
    const MAX_ITER_STEPS = 32, MIN_ASYNC_ITER = 10, ASYNC_INTERVAL = 150;
    const iter = () => {
      doesContinue && doesContinue() === false && (end = 0);
      for (let i = 0, j = 0; i < MAX_ITER_STEPS && j < MAX_ITER_STEPS * 4 && end > 0; ) {
        const cost = callback(arr[--end]);
        if (cost > 0) {
          i++, j += cost;
        } else if (cost < 0) {
          break;
        }
      }
      if (end > 0) {
        arr.length = end;
        setTimeout(iter, ASYNC_INTERVAL);
      }
    };
    let end = arr.length;
    end >= MIN_ASYNC_ITER ? setTimeout(iter, 17) : arr.length > 0 && iter();
  };
  exports.asyncIter_ = asyncIter_;
  /** should only fetch files in the `[ROOT]/{_locales,front,i18n}` folder */  exports.fetchFile_ = (filePath, format) => {
    if (!filePath) {
      throw Error("unknown file: " + filePath);
    }
 // just for debugging
        const json = !format && filePath.endsWith(".json");
    filePath = format || filePath.includes("/") ? filePath : "/front/" + filePath;
    return fetch(filePath).then(r => json ? r.json().then(res => new Map(Object.entries(res))) : format ? format === "blob" ? r.blob() : r.arrayBuffer() : r.text());
  };
  const fetchOnlineResources_ = (url, timeout) => {
    let p, timer1 = 0;
    timeout = timeout || 1e4;
    p = fetch(url, {
      cache: "force-cache",
      signal: AbortSignal.timeout(timeout)
    });
    p = p.then(res => res.status >= 300 || res.status < 200 ? null : res.blob().catch(e => (console.log("on reading response:", e), 
    0)), e => (console.log("on requesting", e), null));
    timer1 && p.then(() => {
      clearTimeout(timer1);
    });
    return p.then(blob => {
      if (!blob) {
        return blob;
      }
      return exports.convertToDataURL_(blob).then(dataUrl => [ null, dataUrl ]);
    });
  };
  exports.fetchOnlineResources_ = fetchOnlineResources_;
  const convertToDataURL_ = blob => {
    const reader = new FileReader, defer = exports.deferPromise_();
    reader.onload = ev => {
      defer.resolve_(ev.target.result);
    };
    reader.readAsDataURL(blob);
    return defer.promise_;
  };
  exports.convertToDataURL_ = convertToDataURL_;
  const escapeAllForRe_ = s => s.replace(/[$()*+.?\[\\\]\^{|}]/g, "\\$&");
  exports.escapeAllForRe_ = escapeAllForRe_;
  let _secret = "", _secretTimestamp = 0;
  const getOmniSecret_ = mayRefresh => {
    const now = Date.now();
 // safe for time changes
        if (now - _secretTimestamp > 8e3 /* GlobalConsts.VomnibarSecretTimeout */) {
      if (!mayRefresh) {
        return "";
      }
 // see https://github.com/philc/vimium/issues/3832
            const rnd_arr = new Uint8Array(8);
      crypto.getRandomValues(rnd_arr);
      _secret = rnd_arr.reduce((s, a) => s + (a < 16 ? "0" : "") + a.toString(16), "");
    }
    _secretTimestamp = now;
    return _secret;
  };
  exports.getOmniSecret_ = getOmniSecret_;
  const normalizeXY_ = xy => {
    if (xy != null && xy !== false) {
      xy = typeof xy !== "string" ? typeof xy === "number" ? [ xy, .5 ] : xy === true ? [ .5, .5 ] : xy instanceof Array ? xy : [ +xy.x || 0, +xy.y || 0, +xy.s || 0 ] : xy.trim().split(/[\s,]+/).map((i, ind) => i === "count" && ind < 2 ? i : isNaN(+i) ? ind < 2 ? .5 : 0 : +i);
      while (xy.length < 2) {
        xy.push(.5);
      }
      while (xy.length < 3) {
        xy.push(0);
      }
      const useCount = xy[0] === "count" || xy[1] === "count";
      return {
        x: xy[0],
        y: xy[1],
        n: useCount ? 0 : 1,
        s: useCount ? +xy[2] || .01 : 0
      };
    }
  };
  exports.normalizeXY_ = normalizeXY_;
  const dedupChars_ = chars => {
    let out = "";
    for (let i = 0, end = chars.length - 1; i < end; i++) {
      const ch = chars[i];
      ch.trimRight() && chars.indexOf(ch, i + 1) < 0 && (out += ch);
    }
    return out;
  };
  exports.dedupChars_ = dedupChars_;
  const base64_ = (text, decode, hasEncoder) => {
    let WithTextDecoder = true /* BrowserVer.MinEnsuredTextEncoderAndDecoder */;
    WithTextDecoder = hasEncoder !== null && hasEncoder !== void 0 && hasEncoder;
    let text2 = decode ? exports.DecodeURLPart_(text, "atob") : text;
    if (decode) {
      if (text2 != text) {
        const kPairRe = /(?:\xed(?:[\xa1-\xbf][\x80-\xbf]|\xa0[\x80-\xbf])){2}/g;
        const kUtf8Re = /([\xc0-\xdf][\x80-\xbf]|[\xe0-\xef][\x80-\xbf]{2}|[\xf0-\xf7][\x80-\xbf]{3})+/g;
        try {
          text2 = text2.replace(kPairRe, s => {
            if (s[1] > "\xb0" || s[1] == "\xb0" && s[2] >= "\x80" || s[4] < "\xb0" || s[4] == "\xb0" && s[4] < "\x80") {
              return s;
            }
            const x = [].map.call(s, ch => ch.charCodeAt(0));
            return String.fromCharCode((x[0] & 15) << 12 | (x[1] & 63) << 6 | x[2] & 63, (x[3] & 15) << 12 | (x[4] & 63) << 6 | x[5] & 63);
          }).replace(kUtf8Re, utf8 => {
            if (WithTextDecoder) {
              const charCodes = [].map.call(utf8, ch => ch.charCodeAt(0));
              utf8 = new TextDecoder("utf-8", {
                fatal: true
              }).decode(new Uint8Array(charCodes));
            } else {
              const encoded = [].map.call(utf8, ch => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2));
              utf8 = decodeURIComponent(encoded.join(""));
            }
            return utf8;
          });
        } catch (_a) {}
      }
    } else {
      let arr;
      if (WithTextDecoder) {
        arr = (new TextEncoder).encode(text);
      } else {
        text2 = encodeURIComponent(text).replace(/%..|[^]/g, s => s.length === 1 ? s : String.fromCharCode(parseInt(s.slice(1), 16)));
        arr = [].map.call(text2, ch => ch.charCodeAt(0));
      }
      text2 = btoa(String.fromCharCode.apply(String, arr));
    }
    return text2;
  };
  exports.base64_ = base64_;
  const encodeUnicode_ = s => "\\u" + (s.charCodeAt(0) + 65536).toString(16).slice(1);
  exports.encodeUnicode_ = encodeUnicode_;
  const now = () => new Date(Date.now() - 6e4 * (new Date).getTimezoneOffset()).toJSON().slice(0, -5).replace("T", " ");
  exports.now = now;
  const getImageExtRe_ = () => /\.(?:avif|bmp|gif|icon?|jpe?g|a?png|svg|tiff?|webp)$/i;
  exports.getImageExtRe_ = getImageExtRe_;
  const isNotPriviledged = port => {
    const url = port.s.url_;
    return !(url.startsWith("chrome") || url.startsWith("edge"));
  };
  exports.isNotPriviledged = isNotPriviledged;
  const detectSubExpressions_ = (expression_, singleCmd) => {
    const pairs = [];
    let pos_ = 0, lastStart = -1, curlyBraces = 0, end = expression_.length;
    for (;pos_ < end; pos_++) {
      switch (expression_[pos_]) {
       case "#":
       case "&":
        if (expression_.charAt(pos_ + 1) === "#") {
          pairs.push([ pos_ + 1, end ]);
          pos_ = expression_.length;
        }
        break;

       case "(":
       case ")":
       case "?":
       case "+":
        singleCmd && (end = pos_);
        break;

       case ":":
        curlyBraces || singleCmd && (end = pos_);
        break;

       case "{":
       case "[":
        curlyBraces++ || (lastStart = pos_);
        break;

       case "]":
       case "}":
        --curlyBraces || pairs.push([ lastStart, pos_ + 1 ]);
        break;

       case '"':
        {
          const literal = /^"([^"\\]|\\[^])*"/.exec(expression_.slice(pos_));
          curlyBraces || literal && pairs.push([ pos_, pos_ + literal[0].length ]);
          pos_ += literal ? literal[0].length - 1 : 0;
          break;
        }

       default:
        {
          const literal = /^(?:[$a-zA-Z_][$\w]*|\d[\d.eE+-]|,?\s+)/.exec(expression_.slice(pos_));
          pos_ += literal ? literal[0].length - 1 : 0;
          // no break;
                }
      }
    }
    return [ pairs, end ];
  };
  const tryParse = slice => {
    try {
      return JSON.parse(slice);
    } catch (_a) {
      return slice;
    }
  };
  exports.tryParse = tryParse;
  const extractComplexOptions_ = expression_ => {
    const [pairs, end] = detectSubExpressions_(expression_, 1);
    let output = "", lastRight = 0;
    for (const [left, right] of pairs) {
      if (expression_[left] === "#") {
        break;
      }
      if (expression_[left - 1] !== "=" || expression_[right] && expression_[right] !== "&") {
        continue;
      }
      output += expression_.slice(lastRight, left);
      lastRight = right;
      const parsed = exports.tryParse(expression_.slice(left, right));
      const correct = typeof parsed !== "string" || parsed.length !== right - left;
      if (!correct) {
        output += parsed.replace(/&/g, "%26");
        continue;
      }
      const str = JSON.stringify(parsed);
      output += str.replace(/[%\s&]/g, exports.encodeUnicode_);
    }
    output += expression_.slice(lastRight, end);
    return [ output, end ];
  };
  exports.extractComplexOptions_ = extractComplexOptions_;
  const splitWhenKeepExpressions = (src, sep) => {
    const pairs = detectSubExpressions_(src)[0];
    let ind = -1, ind2 = 0, lastInd = 0, results = [];
    while ((ind = src.indexOf(sep, ind + 1)) >= 0) {
      while (ind2 < pairs.length && ind >= pairs[ind2][1]) {
        ind2++;
      }
      if (ind2 < pairs.length && ind >= pairs[ind2][0]) {
        ind = pairs[ind2][1] - 1;
      } else {
        results.push(src.slice(lastInd, ind));
        lastInd = ind + 1;
      }
    }
    results.push(src.slice(lastInd));
    return results;
  };
  exports.splitWhenKeepExpressions = splitWhenKeepExpressions;
  const nextConfUpdate = useOmni => {
    let version = useOmni ? store_1.omniConfVer_ : store_1.contentConfVer_;
    version = version + 1 & 4095 || 1;
    return useOmni ? store_1.set_omniConfVer_(version) : store_1.set_contentConfVer_(version);
  };
  exports.nextConfUpdate = nextConfUpdate;
  const recencyBase_ = () => store_1.os_ === 1 /* kOS.linuxLike */ ? 0 : performance.timeOrigin;
  exports.recencyBase_ = recencyBase_;
});
import { CurCVer_, CurFFVer_, OnChrome, OnFirefox, OnEdge, $, pageTrans_, browser_, nextTick_, enableNextTick_, import2_, isVApiReady_, post_, disconnect_, simulateClick_, hasShift_, setupPageOs_, isRepeated_, prevent_ } from "./async_bg.js";

let VData = null;

const useBG = true;

const blobCache = {};

const body = document.body;

let ViewerModule;

let VShown = null;

let bgLink = $("#bgLink");

let tempEmit = null;

let viewer_ = null;

let encryptKey = +window.name || 0;

let zoomToFit = false, duringToggle = false;

let ImageExtRe = /\.(?:avif|bmp|gif|icon?|jpe?g|a?png|svg|tiff?|webp)(?=[.\-_]|\b)/i;

let _shownBlobURL = "", _shownBlob = null;

let loadingTimer;

let _nextUrl;

async function App() {
  if (VShown) {
    clean();
    bgLink.style.display = "none";
    VShown.remove();
    VShown = null;
  }
  VData = window.VData = Object.create(null);
  let url = location.hash, type = "", file = "";
  let _shownHash;
  if (_nextUrl || !url && useBG && (_shownHash = await post_(17 /* kPgReq.shownHash */))) {
    url = _nextUrl || _shownHash;
    _nextUrl = "";
    /^[^:]+[ &]data:/i.test(url) && (encryptKey = -1);
    encryptKey = encryptKey || Math.floor(Math.random() * 4294967296) || 3286711320;
    let encryptedUrl = encrypt_(url, encryptKey, true);
    history.state ? history.pushState(encryptedUrl, "", "") : history.replaceState(encryptedUrl, "", "");
    window.name = "" + encryptKey;
  } else if (url || !history.state) {} else if (encryptKey) {
    url = encrypt_(history.state, encryptKey, false);
    window.name = "" + encryptKey;
  } else {
    history.replaceState(null, "", "");
 // clear useless data
    }
  VData.full = url;
  if (url.length < 3) {} else if (url.startsWith("#!image")) {
    url = url.slice(7);
    type = "image";
  } else if (/^#!(url|text)\b/.test(url)) {
    type = url[2] === "u" ? "url" : "text";
    url = url.slice(type === "url" ? 5 : 6);
  }
  url = url.startsWith("%20") ? url.slice(3) : url.trim();
  for (let ind = 0; ind = url.indexOf("&") + 1; url = url.slice(ind)) {
    let ind2 = url.slice(0, ind).indexOf("="), key = ind2 > 0 ? url.slice(0, ind2) : "", val = ind2 > 0 ? url.slice(ind2 + 1, ind - 1) : "";
    if (key === "download") {
      // avoid confusing meanings in title content
      file = decodeURLPart_(val).split(/\||\uff5c| [-\xb7] /, 1)[0].trim();
      file = file.replace(/[\r\n"]/g, "");
      VData.file = file;
    } else if (key === "src") {
      VData.rawSrc = decodeURLPart_(val);
    } else {
      val = val.toLowerCase();
      if (key === "auto") {
        VData.auto = val === "once" ? val : val === "true" || val !== "false" && parseInt(val, 10) > 0;
      } else if (key === "pixel") {
        VData.pixel = val === "1" || val === "true";
      } else {
        if (key !== "incognito") {
          break;
        }
        VData.incognito = val === "true" || val !== "false" && parseInt(val, 10) > 0;
      }
    }
  }
  {
    const url2 = decodeURLPart_(url, url.includes(":") || url.includes("/") ? decodeURI : null);
    url = (url2 == url || /[%\n]/.test(url2) ? url : url2).trim();
  }
  if (url) {
    if (url.toLowerCase().startsWith("javascript:")) {
      type = url = file = VData.file = "";
    } else if (useBG) {
      const res = await post_(10 /* kPgReq.convertToUrl */ , [ url, -2 /* Urls.WorkType.KeepAll */ ]);
      res[1] <= 2 /* Urls.Type.MaxOfInputIsPlainUrl */ && (url = res[0]);
    } else {
      url.startsWith("//") ? url = "http:" + url : /^([-.\dA-Za-z]+|\[[\dA-Fa-f:]+])(:\d{2,5})?\//.test(url) && (url = "http://" + url);
    }
  } else {
    type === "image" && (type = "");
  }
  VData.type = type;
  /^data:/i.test(url) && (url = "data:" + url.slice(5).replace(/#/g, "%23"));
  VData.url = VData.original = url;
  switch (type) {
   case "image":
    if (VData.auto) {
      let usableSrc = /^(blob|data):/i.test(url.slice(0, 5)) && VData.rawSrc || url;
      let newUrl = await parseClearImageUrl_(useBG && await post_(18 /* kPgReq.substitute */ , [ usableSrc, 256 /* SedContext.image */ ]) || usableSrc, usableSrc);
      if (newUrl) {
        console.log("Auto predict a better URL:\n %o =>\n %o", url, newUrl);
        url = VData.url = newUrl;
      }
    }
    VShown = importBody("shownImage");
    VShown.onerror = function() {
      if (VData.url !== VData.original && VData.url) {
        disableAutoAndReload_();
        return;
      }
      resetOnceProperties_();
      VData.auto = false;
      this.onerror = this.onload = null;
      this.alt = VData.error = sTrans_("failInLoading");
      this.classList.add("broken");
      setTimeout(showBgLink, 34);
      this.onclick = async e => {
        if (useBG && await post_(19 /* kPgReq.checkHarmfulUrl */ , VData.url)) {
          return;
        }
        e.ctrlKey || e.shiftKey || e.altKey || !browser_.tabs || !browser_.tabs.update ? clickLink({
          target: "_top"
        }, e) : browser_.tabs.update({
          url: VData.url
        });
      };
    };
    if (/[:.]/.test(url)) {
      VShown.alt = sTrans_("loading");
      VShown.onclick = defaultOnClick;
      VShown.onload = function() {
        const width = this.naturalWidth, height = this.naturalHeight;
        if (width < 12 && height < 12) {
          if (VData.auto) {
            disableAutoAndReload_();
            return;
          }
          if (width < 2 && height < 2) {
            console.log("The image is too small to see.");
            this.onerror(null);
            return;
          }
        }
        VData.original = VData.url;
        resetOnceProperties_();
        const url_prefix = VData.url.slice(0, 6).toLowerCase(), is_blob = url_prefix.startsWith("blob:");
        if (is_blob || url_prefix.startsWith("data:") && !this.src.startsWith("data")) {
          bgLink.dataset.vimUrl = VData.original = VData.url = this.src;
          recoverHash_(is_blob ? 0 : 1);
        }
        this.onerror = this.onload = null;
        this.src.startsWith("blob:") || setTimeout(() => {
          VShown.src = VShown.src;
 // trigger replay for gif
                }, 0);
        showBgLink();
        this.alt = file;
        this.classList.add("zoom-in");
        if (VData.pixel) {
          body.classList.add("pixel");
          const dpr = devicePixelRatio;
          if (width > innerWidth * dpr * .9 && height > innerHeight * dpr * .9) {
            const el = importBody("snapshot-banner", true);
            el.querySelector(".banner-close").onclick = () => {
              el.remove();
            };
            let arr = el.querySelectorAll("[data-i]");
            for (let i = 0; i < arr.length; i++) {
              const s = arr[i].dataset.i, isTitle = s.endsWith("-t");
              const t = pageTrans_(isTitle ? s.slice(0, -2) : s);
              t && (isTitle ? arr[i].title = t : arr[i].textContent = t);
            }
            body.prepend(el);
          }
        }
        width >= innerWidth * .9 && body.classList.add("filled");
      };
      const setUrlDirectly = await doesSetUrlDirectly(url);
      fetchImage_(url, VShown, setUrlDirectly);
    } else {
      url = VData.url = "";
      VShown.onerror(null);
      VShown.alt = VData.error = sTrans_("none");
    }
    if (file) {
      VData.file = file = tryToFixFileExt_(file) || file;
      const path = file.split(/[/\\]+/);
      path.length > 1 && VShown.setAttribute("download", path[path.length - 1]);
      VShown.setAttribute("aria-title", file);
    }
    break;

   case "url":
   case "text":
    VShown = importBody("shownText");
    if (url && type !== "text") {
      let str1 = await post_(16 /* kPgReq.showUrl */ , url);
      if (typeof str1 !== "string") {
        showText(str1[1], str1[0] || str1[2] || "");
        break;
      }
      url = str1;
    }
    url = tryDecryptUrl(url) || url;
    showText(type, url);
    break;

   default:
    url = "";
    VShown = importBody("shownImage");
    VShown.src = "../icons/icon128.png";
    bgLink.style.display = "none";
    break;
  }
  bgLink.dataset.vimUrl = url;
  if (file) {
    bgLink.dataset.vimText = file;
    bgLink.download = file;
  } else {
    bgLink.removeAttribute("data-vim-text");
    bgLink.removeAttribute("download");
  }
  bgLink.onclick = VShown ? clickShownNode : defaultOnClick;
}

export const sTrans_ = (k, a) => pageTrans_(k, a) || "";

enableNextTick_(1 /* kReadyInfo.show */);

isVApiReady_.then(() => {
  VApi.u = getContentUrl_;
});

nextTick_(() => {
  window.onhashchange = App;
  window.onpopstate = App;
  App().then(() => {
    isVApiReady_.then(disconnect_);
  });
  post_(31 /* kPgReq.showInit */).then(conf => {
    setupPageOs_(conf.os);
  });
});

window.onpagehide = destroyObject_;

body.ondrop = e => {
  const files = e.dataTransfer.files;
  if (files.length === 1) {
    const file = files.item(0), name = file.name;
    if (file.type.startsWith("image/") || ImageExtRe.test(name)) {
      prevent_(e);
      _nextUrl = "#!image download=" + encodeAsciiComponent_(name) + "&" + URL.createObjectURL(file);
      App();
    }
  }
};

body.ondragover = body.ondragenter = e => {
  const items = e.dataTransfer.items;
  if (items.length === 1) {
    const item = items[0];
    item.type.startsWith("image/") && prevent_(e);
  }
};

document.addEventListener("keydown", event => {
  if (VData.type === "image" && imgOnKeydown(event)) {
    return;
  }
  if (!event.ctrlKey && !event.metaKey || event.altKey || isRepeated_(event) || hasShift_(event)) {
    return;
  }
  const str = String.fromCharCode(event.keyCode);
  if (str === "S") {
    clickLink({
      download: VData.file || ""
    }, event);
  } else if (str === "C") {
    copyThing(event);
  } else if (str === "A") {
    toggleInvert(event);
  } else if (str === "O") {
    prevent_(event);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (file) {
        _nextUrl = "#!image download=" + encodeAsciiComponent_(file.name) + "&" + URL.createObjectURL(file);
        App();
      }
    };
    document.body.append(input);
    setTimeout(() => {
      input.remove();
    }, 0);
    input.click();
  }
});

function showBgLink() {
  const height = VShown.scrollHeight, width = VShown.scrollWidth;
  bgLink.style.height = height + "px";
  bgLink.style.width = width + "px";
  bgLink.style.display = "";
}

function clickLink(options, event) {
  prevent_(event);
  if (!VData.url) {
    return;
  }
  const a = document.createElement("a");
  Object.setPrototypeOf(options, null);
  for (const i in options) {
    a.setAttribute(i, options[i]);
  }
  a.href = VData.url;
 // lgtm [js/client-side-unvalidated-url-redirection] lgtm [js/xss] lgtm [js/xss-through-dom]
    simulateClick_(a, event);
  return;
}

function imgOnKeydown(event) {
  if (VData.error) {
    return false;
  }
  const {keyCode} = event, key = VApi && VApi.z ? VApi.r[3]({
    c: " " /* kChar.INVALID */ ,
    e: event,
    i: keyCode,
    v: ""
  }, 9 /* kModeId.Show */) : keyCode === 32 /* kKeyCode.space */ ? "space" /* kChar.space */ : keyCode === 13 /* kKeyCode.enter */ ? "enter" /* kChar.enter */ : "", keybody = key.slice(key.lastIndexOf("-") + 1) || key && "-" /* kChar.minus */;
  if (keybody === "space" /* kChar.space */ || keybody === "enter" /* kChar.enter */) {
    if (VData.pixel) {
      const active = document.activeElement, banner = active && document.querySelector("#snapshot-banner");
      if (banner && banner.contains(active)) {
        const close = banner.querySelector(".banner-close");
        close.contains(active) && close.onclick(null);
        return true;
      }
    }
    prevent_(event);
    keybody === "enter" /* kChar.enter */ && viewer_ && viewer_.isShown && !viewer_.hiding && !viewer_.played ? viewer_.play(true) : viewer_ && viewer_.isShown && !viewer_.hiding || simulateClick_(VShown, event);
    return true;
  }
  let action = 0;
  switch (key) {
   case "c-=":
   case "m-=":
   case "+":
   case "=":
   case "up":
    action = 1;
    break;

   case "left":
    action = -2;
    break;

   case "right":
    action = 2;
    break;

   case "c--":
   case "m--":
   case "-":
   case "down":
    action = -1;
    break;

   default:
    return false;
  }
  prevent_(event);
  event.stopImmediatePropagation();
  if (viewer_ && viewer_.viewed) {
    doImageAction(viewer_, action);
  } else {
    zoomToFit = false;
    loadViewer().then(showSlide).then(viewer => {
      doImageAction(viewer, action);
    }).catch(defaultOnError);
  }
  return true;
}

function doImageAction(viewer, action) {
  action === 2 || action === -2 ? viewer.rotate(action * 45) : viewer.zoom(action / 10, true);
}

function decodeURLPart_(url, func) {
  try {
    url = (func || decodeURIComponent)(url);
  } catch (_a) {}
  return url;
}

function importBody(id, notInsert) {
  const templates = $("#bodyTemplate"), 
  // note: content has no getElementById on Chrome before BrowserVer.Min$DocumentFragment$$getElementById
  node = document.importNode(templates.content.querySelector("#" + id), true);
  notInsert || templates.before(node);
  return node;
}

function defaultOnClick(event) {
  if (event.altKey) {
    event.stopImmediatePropagation();
    return clickLink({
      download: VData.file || ""
    }, event);
  }
  switch (VData.type) {
   case "url":
    clickLink({
      target: "_blank"
    }, event);
    break;

   case "image":
    if (VData.error) {
      return;
    }
    zoomToFit = event.ctrlKey || event.metaKey;
    loadViewer().then(showSlide).catch(defaultOnError);
    break;

   default:
    break;
  }
}

function clickShownNode(event) {
  prevent_(event);
  const a = VShown;
  a.onclick && a.onclick(event);
}

function showText(tip, details) {
  tip = typeof tip === "number" ? [ "math", "copy", "search", "ERROR", "status", "paste", "run", "url", "run-one-key" ][tip] : tip;
  $("#textTip").dataset.text = sTrans_(`t_${tip}`) || tip;
  $(".colon").dataset.colon = sTrans_("colon") + sTrans_("NS");
  const textBody = $("#textBody");
  if (details) {
    textBody.textContent = typeof details !== "string" ? details.join(" ") : details;
    VShown.onclick = copyThing;
  } else {
    textBody.classList.add("null");
  }
  return showBgLink();
}

function copyThing(event) {
  const sel = getSelection(), selText = "" + sel;
  if (selText && (VData.type !== "image" || selText.trim() !== VShown.alt.trim())) {
    // on Firefox, Selection will grab .alt text
    return;
  }
  if (VData.type === "image" && VData.url) {
    if (sel.type === "Range" && !VData.url.startsWith(location.protocol)) {
      // e.g. Ctrl+A and then Ctrl+C; work well with MS Word
      VApi && VApi.h(1 /* kTip.raw */ , 0, sTrans_("imgCopied", [ "HTML" ]));
      return;
    }
    prevent_(event);
    const clipboard = navigator.clipboard;
    {
      const blobPromise = _shownBlob != null ? Promise.resolve(_shownBlob) : fetch(VData.url, {
        cache: "force-cache",
        referrer: "no-referrer"
      }).then(res => res.blob()).catch(() => (_copyStr(VData.url), 0)).then(blob => _shownBlob = blob), navClipPromise = blobPromise.then(blob => {
        if (!blob) {
          return 0;
        }
        // dom.events.asyncClipboard.clipboardItem
        const kPngType = "image/png", item = {
          // Chrome 79 refuses image/jpeg
          [kPngType]: blob.type !== kPngType ? new Blob([ blob ], {
            type: kPngType
          }) : blob
        };
        /^(http|ftp|file)/i.test(VData.url) && (item["text/plain"] = new Blob([ VData.url ], {
          type: "text/plain"
        }));
        const doWrite = () => clipboard.write([ new ClipboardItem(item) ]);
        const img = document.createElement("img");
        img.src = VData.url;
 // lgtm [js/client-side-unvalidated-url-redirection] lgtm [js/xss] lgtm [js/xss-through-dom]
                VData.file && img.setAttribute("aria-title", img.alt = VData.file);
        item["text/html"] = new Blob([ img.outerHTML ], {
          type: "text/html"
        });
        return doWrite().catch(() => (delete item["text/html"], doWrite()));
      }), finalPromise = navClipPromise;
      finalPromise.then(result => {
        VApi && result !== 0 && VApi.h(1 /* kTip.raw */ , 0, sTrans_("imgCopied", [ "PNG" ]));
      }, ex => {
        console.log("On copy image:", ex);
        _copyStr(VData.url);
      });
      return;
    }
  }
  const str = VData.type === "url" ? $("#textBody").textContent : VData.url;
  _copyStr(str, event);
}

function _copyStr(str, event) {
  if (!str || !VApi) {
    return;
  }
  event && prevent_(event);
  VApi.p({
    H: 18 /* kFgReq.copy */ ,
    s: str
  });
}

function toggleInvert(event) {
  VData.type === "image" && (VData.error || viewer_ && viewer_.isShown && !viewer_.hiding ? prevent_(event) : VShown.classList.toggle("invert"));
}

function loadCSS(src) {
  if ($('link[href="' + src + '"]')) {
    return;
  }
  const obj = document.createElement("link");
  obj.rel = "stylesheet";
  obj.href = src;
  return new Promise(resolve => {
    obj.onload = () => {
      obj.onload = null;
      resolve();
    };
    const link = $('link[href$="show.css"]');
    link.before(obj);
  });
}

function defaultOnError(err) {
  err && console.log("%o", err);
}

function loadViewer() {
  if (ViewerModule) {
    return Promise.resolve(ViewerModule);
  }
  window.define && window.define.noConflict();
  return Promise.all([ import2_("../lib/viewer.js"), loadCSS("../lib/viewer.css") ]).then(([viewerJS]) => {
    viewerJS = viewerJS && typeof viewerJS === "function" ? viewerJS : window.Viewer;
    viewerJS.setDefaults({
      navbar: false,
      shown() {
        bgLink.style.display = "none";
      },
      viewed() {
        tempEmit && tempEmit(true);
      },
      zoom(event) {
        if (!duringToggle) {
          return;
        }
        const {ratio} = event.detail;
        const imageData = viewer_.imageData, {width, height, naturalWidth, naturalHeight} = imageData;
        const newWidth = naturalWidth * ratio, newHeight = naturalHeight * ratio;
        const offsetWidth = newWidth - width, offsetHeight = newHeight - height;
        // will run ` imageData.x -= offsetWidth / 2, imageData.y -= offsetHeight / 2 `
                if (ratio === 1) {
          imageData.oldXY = [ imageData.x, imageData.y ];
          imageData.x = (innerWidth - newWidth) / 2 | 0, imageData.y = (innerHeight - newHeight) / 2 | 0;
        } else {
          if (!imageData.oldXY) {
            return;
          }
          imageData.x = imageData.oldXY[0], imageData.y = imageData.oldXY[1];
        }
        imageData.x += offsetWidth / 2, imageData.y += offsetHeight / 2;
      },
      hide() {
        bgLink.style.display = "";
        tempEmit && tempEmit(false);
      }
    });
    const prototype = viewerJS.prototype, oldInit = prototype.initImage, oldToggle = prototype.toggle;
    prototype.initImage = function(done) {
      const args = [].slice.call(arguments);
      args[0] = function() {
        const imageData = viewer_ && viewer_.imageData;
        if (imageData) {
          const nw = imageData.naturalWidth, nh = imageData.naturalHeight;
          const doc = document, fulled = !!doc.fullscreenElement;
          const dw = fulled ? window.screen.availWidth : nw, dh = fulled ? window.screen.availHeight : nh;
          if (fulled ? nw >= dw && nh >= dh : !zoomToFit && imageData.ratio < 1) {
            const ratio = fulled ? Math.max(dw / nw, dh / nh) : 1;
            imageData.left = imageData.x = fulled ? (dw - nw * ratio) / 2 | 0 : 0;
            imageData.top = imageData.y = fulled ? (dh - nh * ratio) / 2 | 0 : 0;
            imageData.width = Math.round(nw * ratio), imageData.height = Math.round(nh * ratio);
            imageData.ratio = ratio;
          }
        }
        done.apply(this, arguments);
      };
      oldInit.apply(this, args);
    };
    prototype.toggle = function(event) {
      duringToggle = !event && !!viewer_ && (this.imageData.ratio !== 1 || this.imageData.oldRatio !== 1);
      const ret = oldToggle.apply(this, arguments);
      duringToggle = false;
      return ret;
    };
    ViewerModule = viewerJS;
    return viewerJS;
  });
}

function showSlide(viewerModule) {
  const needToScroll = scrollX || scrollY;
  const sel = getSelection();
  sel.type === "Range" && sel.collapseToStart();
  const v = viewer_ = viewer_ || new viewerModule(VShown);
  v.scrollbarWidth = 0;
  v.hiding && (v.isShown = false);
  v.isShown || v.show();
  v.hiding = false;
  needToScroll && scrollTo(0, 0);
  if (v.viewed) {
    v.zoomTo(1);
    return v;
  }
  return new Promise((resolve, reject) => {
    tempEmit = succeed => {
      tempEmit = null;
      succeed ? resolve(v) : reject("failed to view the image");
    };
  });
}

function clean() {
  destroyObject_();
  _shownBlob = null;
  if (loadingTimer) {
    loadingTimer();
    loadingTimer = null;
  }
  if (VData.type === "image") {
    const boxClass = document.body.classList;
    VShown.classList.remove("svg");
    boxClass.remove("pixel");
    boxClass.remove("filled");
    VShown.removeAttribute("src");
    VShown.onerror = VShown.onload = null;
    if (viewer_) {
      viewer_.destroy();
      viewer_ = null;
    }
  }
}

async function parseClearImageUrl_(originUrl, stdUrl) {
  function safeParseURL(url1) {
    try {
      return new URL(url1);
    } catch (_a) {}
    return null;
  }
  const parsed = safeParseURL(originUrl);
  if (!parsed || !/^(ht|s?f)tp/i.test(parsed.protocol)) {
    return null;
  }
  let {origin, pathname: path} = parsed;
  let search = parsed.search;
  function DecodeURLPart_(url1) {
    try {
      url1 = decodeURIComponent(url1 || "");
    } catch (_a) {}
    return url1;
  }
  stdUrl = stdUrl || originUrl;
  if (search.length > 10) {
    for (const item of search.slice(1).split("&")) {
      const key = item.split("=", 1)[0];
      let val0 = item.slice(key.length + 1), val = val0;
      if (val.length > 7) {
        !val.includes("://") && /%(?:3[aA]|2[fF])/.test(val) && (val = DecodeURLPart_(val).trim());
        if (val.includes("/") && safeParseURL(val)) {
          if (/^(?:imgurl|mediaurl|objurl|origin(?:al)?|real\w*|src|url)$/i.test(key)) {
            return val;
          }
          let arr = val.split("?")[0].split("/");
          if (ImageExtRe.test(arr[arr.length - 1]) && !/\bthumb/i.test(key)) {
            return val;
          }
        } else if (key === "id" && /&w=\d{2,4}&h=\d{2,4}/.test(search)) {
          return origin + path + "?id=" + val0;
        }
      }
      if (key === "name" && /^(\d{2,4}x\d{2,4}|small)$/i.test(val0) && search.toLowerCase().includes("format=")) {
        return origin + path + search.replace(val, "large");
      }
      if (/^(x-)?(\w+)-?process\b/i.test(key) && val0.toLowerCase().includes("image/") && /resize|quality/i.test(val0)) {
        search = search.replace(key + "=" + val0, "");
        return origin + path + (search.length > 1 ? search : "");
      }
    }
  }
  let arr1 = null;
  if ((arr1 = /[?&]s=\d{2,4}(&|$)/.exec(search)) && search.split("=").length <= 4) {
    return origin + path;
  }
  let secondFound = 0;
  for (const i of [ "/revision/latest/scale-" ]) {
    if (path.includes(i)) {
      path = path.split(i)[0];
      secondFound = 1;
    }
  }
  search = path;
  let offset = search.lastIndexOf("/") + 1;
  search = search.slice(offset);
  let index = search.lastIndexOf("@") + 1 || search.lastIndexOf("!") + 1;
  let found = index > 2 || ImageExtRe.test(search), arr2 = null;
  if (found) {
    offset += index;
    search = search.slice(index);
    let re = /(?:[.\-_]|\b)(?:[1-9]\d{2,3}[a-z]{1,3}[_\-]?|[1-9]\d?[a-z][_\-]?|0[a-z][_\-]?|[1-9]\d{1,3}[_\-]|[1-9]\d{1,2}(?=[.\-_]|\b)){2,6}(?=[.\-_]|\b)/gi;
    for (;arr2 = re.exec(search); arr1 = arr2) {}
    if (arr1 && /.[_\-].|\d\dx\d/i.test(arr1[0])) {
      let next = arr1.index + arr1[0].length;
      arr2 = ImageExtRe.exec(search.slice(next));
      offset += arr1.index;
      let len = arr1[0].length;
      arr2 && arr2.index === 0 && (len += arr2[0].length);
      search = path.slice(offset + len);
      if (path.lastIndexOf("@", offset + len) >= 0 && search.includes("!")) {
        const tail = search.slice(search.indexOf("!")).toLowerCase();
        tail.includes("cover") && /^![a-z\d_\.-]+\.(avif|jpe?g|a?png|svg|webp)$/.test(tail) && (search = search.split("!")[0]);
      }
      /[@!]$/.test(search || path.charAt(offset - 1)) ? search ? search = search.slice(0, -1) : offset-- : search || !arr2 || arr2.index !== 0 || ImageExtRe.test(path.slice(Math.max(0, offset - 6), offset)) || (search = arr2[0]);
    } else if (arr1 = /\b([\da-f]{8,48})([_-](?:[a-z]{1,2}|\d{3,4}[whp]?))\.[a-z]{2,4}$/.exec(search)) {
      offset += arr1.index + arr1[1].length;
      search = search.slice(arr1.index + arr1[1].length + arr1[2].length);
    } else if (arr1 = /\b((?:[1-9]\d{1,3}[whxyp][_\-x]?){1,2})\.[a-z]{2,4}$/.exec(search)) {
      offset += arr1.index;
      search = search.slice(arr1.index + arr1[1].length);
    } else {
      found = false;
    }
  }
  if (found || index > 2) {
    found = found || 0;
  } else if (arr1 = /_(0x)?[1-9]\d{2,3}([whp]|x0)?\./.exec(search)) {
    search = search.slice(0, arr1.index) + search.slice(arr1.index + arr1[0].length - 1);
  } else if (search.startsWith("thumb_")) {
    search = search.slice(6);
  } else if (/^[1-9]\d+$/.test(search) && +search > 0 && +search < 640) {
    offset--;
    search = "";
  } else if (ImageExtRe.test(search) && /^\/(small|(thumb|mw|orj)[1-9]\d{2,3})\//.test(path)) {
    found = true;
    search = "/large" + path.slice(path.indexOf("/", 1));
    offset = 0;
  } else {
    found = 0;
  }
  return found !== 0 ? origin + path.slice(0, offset) + search : secondFound ? origin + path : stdUrl !== originUrl ? originUrl : null;
}

function tryToFixFileExt_(file) {
  if (!file || /.\.[a-z]{3,4}\b/i.test(file)) {
    return;
  }
  const ext = ImageExtRe.exec(VData.url);
  if (ext) {
    return file + ext[0];
  }
  const type = _shownBlob ? _shownBlob.type.toLowerCase() : "";
  if (type.startsWith("image/")) {
    const map = {
      jpeg: "jpg",
      png: 0,
      bmp: 0,
      svg: 0,
      gif: 0,
      tif: 0,
      ico: 0
    };
    for (const key in map) {
      if (map.hasOwnProperty(key) && type.includes(key)) {
        return map[key] || "." + key;
      }
    }
  }
}

const doesSetUrlDirectly = url => {
  const url_prefix = url.slice(0, 20).toLowerCase();
  if (url_prefix.startsWith("blob:") || url_prefix.startsWith("data:") && url.length > 1e4) {
    return false;
  }
  if (!/^(ht|s?f)tp|^data:/.test(url_prefix)) {
    return true;
  }
  if (VData.incognito) {
    return false;
  }
  return post_(5 /* kPgReq.settingItem */ , {
    key: "showInIncognito"
  }).then(i => !i);
};

function fetchImage_(url, element, setUrlDirectly) {
  const text = new Text, clearTimer = loadingTimer = () => {
    element.removeEventListener("load", clearTimer);
    element.removeEventListener("error", clearTimer);
    clearTimeout(timer);
    text.remove();
    loadingTimer === clearTimer && (loadingTimer = null);
  };
  element.addEventListener("load", clearTimer, true);
  element.addEventListener("error", clearTimer, true);
  const url_prefix = url.slice(0, 20).toLowerCase();
  const is_blob = url_prefix.startsWith("blob:"), is_data = url_prefix.startsWith("data:");
  is_data && url_prefix.startsWith("data:image/svg+xml,") && element.classList.add("svg");
  if (setUrlDirectly) {
    element.src = url;
 // lgtm [js/client-side-unvalidated-url-redirection] lgtm [js/xss] lgtm [js/xss-through-dom]
    } else {
    destroyObject_();
    body.replaceChild(text, element);
    Promise.resolve(blobCache[url] || fetch(url, is_blob || is_data ? {} : {
      cache: "no-store",
      referrer: "no-referrer"
    }).then(res => res.blob())).then(blob => {
      blobCache[url] = blob;
      return _shownBlobURL = URL.createObjectURL(_shownBlob = blob);
    }, () => url).then(newUrl => {
      element.src = newUrl;
 // lgtm [js/client-side-unvalidated-url-redirection] lgtm [js/xss] lgtm [js/xss-through-dom]
            text.parentNode ? body.replaceChild(element, text) : body.append(element);
    });
  }
  const timer = setTimeout(() => {
    if (!element.parentNode || element.scrollHeight >= 24 || element.scrollWidth >= 80) {
      // some pixels drawn
      clearTimer();
    } else if (!text.parentNode) {
      element.before(text);
      text.data = sTrans_("loading");
    }
  }, 400);
}

function destroyObject_() {
  if (_shownBlobURL) {
    URL.revokeObjectURL(_shownBlobURL);
    _shownBlobURL = "";
  }
}

function tryDecryptUrl(url) {
  const scheme = url.split(":", 1)[0];
  switch (scheme.toLowerCase()) {
   case "thunder":
   case "flashget":
   case "qqdl":
    url = url.slice(scheme.length + 3).split("&", 1)[0];
    break;

   default:
    return "";
  }
  try {
    url = atob(url);
  } catch (_a) {
    return "";
  }
  url.startsWith("AA") && url.endsWith("ZZ") && (url = url.slice(2, -2));
  url.startsWith("[FLASHGET]") && url.endsWith("[FLASHGET]") && (url = url.slice(10, -10));
  return tryDecryptUrl(url) || url;
}

function disableAutoAndReload_() {
  console.log("Failed to visit the predicted URL, so go back to the original version.");
  resetOnceProperties_();
  VData.auto = false;
  App();
}

function resetOnceProperties_() {
  let changed = false;
  if (VData.auto === "once") {
    VData.auto = false;
    changed = true;
  }
  changed && recoverHash_();
  return changed;
}

function recoverHash_(notUpdateHistoryState) {
  const type = VData.type;
  if (!type) {
    return;
  }
  let url = "#!" + type + " " + (VData.incognito ? "incognito=1&" : "") + (VData.file ? "download=" + encodeAsciiComponent_(VData.file) + "&" : "") + (VData.rawSrc ? "src=" + encodeAsciiComponent_(VData.rawSrc) + "&" : "") + (VData.auto ? "auto=" + (VData.auto === "once" ? "once" : 1) + "&" : "") + (VData.pixel ? "pixel=1&" : "") + VData.original;
  VData.full = url;
  if (notUpdateHistoryState) {
    return;
  }
  let encryptedUrl = encrypt_(url, encryptKey, true);
  history.replaceState(encryptedUrl, "", "");
}

function encodeAsciiComponent_(url) {
  return url.replace(new RegExp("[^\\p{L}\\p{N}]+", "ug"), encodeURIComponent);
}

function encrypt_(message, password, doEncrypt) {
  if (password === -1) {
    return message;
  }
  const arr = [];
  if (doEncrypt) {
    message = encodeURIComponent(message);
  } else {
    try {
      message = atob(message);
    } catch (_a) {
      message = "";
    }
  }
  for (const ch of message) {
    arr.push(ch.charCodeAt(0));
  }
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 255 & (arr[i] ^ password >>> 8 * (i & 3));
  }
  message = String.fromCharCode(...arr);
  if (doEncrypt) {
    message = btoa(message);
  } else {
    try {
      message = decodeURIComponent(message);
    } catch (_b) {
      message = "";
    }
  }
  return message;
}

function getContentUrl_() {
  if (!VData || !VData.full) {
    return location.href;
  }
  return location.href.split("#", 1)[0] + VData.full;
}

Object.assign(window, {
  showBgLink,
  clickLink,
  simulateClick: simulateClick_,
  imgOnKeydown,
  doImageAction,
  decodeURLPart_,
  importBody,
  defaultOnClick,
  clickShownNode,
  showText,
  copyThing,
  _copyStr,
  toggleInvert,
  import2: import2_,
  loadCSS,
  defaultOnError,
  loadViewer,
  showSlide,
  clean,
  parseClearImageUrl_,
  tryToFixFileExt_,
  fetchImage_,
  destroyObject_,
  tryDecryptUrl,
  disableAutoAndReload_,
  resetOnceProperties_,
  recoverHash_,
  encrypt_,
  getOmni_: getContentUrl_,
  VShown() {
    return {
      VShown,
      bgLink,
      tempEmit,
      viewer_,
      encryptKey,
      ImageExtRe,
      _shownBlobURL
    };
  }
});
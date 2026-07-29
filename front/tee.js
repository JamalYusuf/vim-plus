"use strict";

(() => {
  const MayChrome = true /* BrowserType.Chrome */ , MayNotChrome = false /* BrowserType.Chrome */;
  const mayBrowser_ = MayChrome && MayNotChrome && typeof browser === "object" && !("tagName" in browser) ? browser : null;
  const useBrowser = !!MayNotChrome && (!MayChrome || !!(mayBrowser_ && mayBrowser_.runtime && mayBrowser_.runtime.connect));
  const browser_ = useBrowser ? browser : chrome;
  const runtime = browser_.runtime;
  const isOffscreen = location.pathname.endsWith("offscreen.html");
  const destroy = () => {
    isOffscreen || parent.focus();
    window.closed || window.close();
    port = null;
  };
  const onTask = _response => {
    let onFinish = ok => {
      okResult = true;
      port.postMessage({
        H: 92 /* kFgReq.teeRes */ ,
        r: ok
      });
      isOffscreen || setTimeout(destroy, 0);
 // try to avoid a strange crashes on Chrome 103
        };
    const {t: taskId, s: serialized} = _response;
    const runTask = () => {
      switch (taskId) {
       case 5 /* kTeeTask.Copy */ :
       case 3 /* kTeeTask.Paste */ :
        navigator;
        {
          const doc = document, textArea = doc.createElement("textarea");
          if (taskId === 5 /* kTeeTask.Copy */) {
            textArea.value = serialized;
            doc.body.append(textArea);
            textArea.select();
            doc.execCommand("copy");
            textArea.remove();
            textArea.value = "";
          } else {
            const newLenLimit = serialized < 0 ? -1 - serialized : serialized;
            textArea.maxLength = newLenLimit || 102400 /* GlobalConsts.MaxBufferLengthForPastingNormalText */;
            doc.body.append(textArea);
            textArea.focus();
            doc.execCommand("paste");
            okResult = textArea.value.slice(0, newLenLimit || 102400 /* GlobalConsts.MaxBufferLengthForPastingNormalText */);
            textArea.value = "";
            textArea.remove();
            textArea.removeAttribute("maxlength");
          }
          return Promise.resolve();
        }

       case 4 /* kTeeTask.Download */ :
        return window.fetch(serialized.u).then(res => res.status < 300 && res.status > 199 ? res.blob() : Promise.reject("HTTP " + res.status)).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = serialized.t;
          a.target = "_blank";
          const mouseEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            altKey: true,
            detail: 1,
            button: 0,
            buttons: 1
          });
          a.dispatchEvent(mouseEvent);
        });

       case 10 /* kTeeTask.updateMedia */ :
        {
          const obj = serialized.map(i => !!i && matchMedia(i).matches);
          onFinish(obj);
        }
        return;
      }
      switch (taskId) {
       case 1 /* kTeeTask.CopyImage */ :
       case 9 /* kTeeTask.DrawAndCopy */ :
        const copying = (taskId === 9 /* kTeeTask.DrawAndCopy */ ? new Promise((resolve, reject) => {
          const img = document.createElement("img");
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const w = canvas.width = img.naturalWidth, h = canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
 // ctx may be null if OOM
                        if (!ctx) {
              reject("Can not create canvas");
              return;
            }
            try {
              ctx.drawImage(img, 0, 0, w, h);
              canvas.toBlob(blob => blob ? resolve(blob) : reject("Can not export from canvas"));
            } catch (_a) {
              reject("Can not export tainted canvas");
            }
          };
          img.onerror = () => {
            reject(0);
          };
          img.src = serialized.u;
        }).catch(err => err !== 0 ? window.fetch(serialized.u) : Promise.reject("Can not load image")) : window.fetch(serialized.u)).then(res => {
          serialized.u = "";
          return res instanceof Response ? res.blob() : res;
        }).then(image => {
          serialized.u = "";
          const png = "image/png", plain = "text/plain";
          const item = {
            [png]: image.type === png ? image : new Blob([ image ], {
              type: png
            })
          };
          serialized.t && (item[plain] = new Blob([ serialized.t ], {
            type: plain
          }));
          return navigator.clipboard.write([ new ClipboardItem(item) ]);
        });
        taskId !== 9 /* kTeeTask.DrawAndCopy */ && (serialized.u = "");
        return copying;
      }
      console.log("Vim+: error: unknown tee task id =", taskId);
    };
    const onFocus = () => {
      let p;
      try {
        p = runTask();
      } catch (e) {
        console.log("Vim+: error: failed in running task id = %o:\n%o", taskId, e);
      }
      p ? p.then(() => {
        onFinish(okResult);
      }, err => {
        console.log("Vim+: can not run task=%o:", taskId, err);
        onFinish(false);
      }) : onFinish(false);
    };
    let okResult = true;
    isOffscreen || document.hasFocus() ? onFocus() : (window.onfocus = onFocus, window.focus());
  };
  let port, refusedMoreMessages = false;
  try {
    port = runtime.connect({
      name: "" + (2176 /* PortType.Tee */ | (isOffscreen ? 4096 /* PortType.Offscreen */ : 0))
    });
    port.onDisconnect.addListener(destroy);
  } catch (_a) {
    destroy();
    return;
  }
  port.onMessage.addListener(_response => {
    const response = _response;
    if (response.N !== 49 /* kBgReq.omni_runTeeTask */ || refusedMoreMessages) {
      console.log("Vim+: error: unknown message:", response);
      destroy();
    } else {
      refusedMoreMessages = !isOffscreen;
      onTask(response);
    }
  });
})();
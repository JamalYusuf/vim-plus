"use strict";

var VApi, VimPlusInjector;

(function() {
  const oldDefine = typeof define !== "undefined" ? define : void 0;
  const modules = {};
  const getName = name => name.slice(name.lastIndexOf("/") + 1).replace(".js", "");
  const myDefine = function(deps, factory) {
    let filename = __filename;
    if (!filename || filename.lastIndexOf("content/", 0) === -1 && filename.lastIndexOf("lib/", 0) === -1) {
      if (!oldDefine) {
        const name = document.currentScript.src.split("/");
        const fileName = name[name.length - 1].replace(/\.js|\.min/g, "").replace(/\b[a-z]/g, i => i.toUpperCase());
        window[fileName] = (factory || deps)();
        return;
      }
      return oldDefine.apply(this, arguments);
    }
    __filename = null;
    const exports = myRequire(filename);
    myDefine[getName(filename)] = exports;
    return factory.bind(null, throwOnDynamicImport, exports).apply(null, deps.slice(2).map(myRequire));
  };
  const throwOnDynamicImport = () => {
    throw new Error("Must avoid dynamic import in content scripts");
  };
  const myRequire = target => {
    target = getName(target);
    return modules[target] || (modules[target] = {});
  };
  myDefine.amd = true;
  myDefine.noConflict = () => {
    if (window.define !== myDefine) {
      return;
    }
    window.define = oldDefine;
    if (!oldDefine) {
      return;
    }
    VimPlusInjector === null && Object.assign(oldDefine, modules);
  };
  window.__filename = void 0;
  window.define = myDefine;
})();
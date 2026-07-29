"use strict";

globalThis.__filename = null;

(() => {
  const modules = {};
  const getName = name => name.slice(name.lastIndexOf("/") + 1).replace(".js", "");
  const kInSW = true /* BrowserType.Firefox */;
  const myDefine = (depNames, factory) => {
    const name = getName(__filename || document.currentScript.src);
    let exports = modules[name];
    if (exports && exports.__esModule && (kInSW || !(exports instanceof Promise))) {
      throw new Error(`module filenames must be unique: duplicated "${name}"`);
    }
    if (!kInSW && exports && exports instanceof Promise) {
      const promise = exports.then(() => {
        modules[name] = exports;
        _innerDefine(name, depNames, factory, exports);
      });
      exports = promise.__esModule = exports.__esModule || {};
      modules[name] = promise;
    } else {
      _innerDefine(name, depNames, factory, exports || (modules[name] = {}));
    }
  };
  const _innerDefine = (name, depNames, factory, exports) => {
    const obj = factory.bind(null, kInSW ? null : doImport, exports).apply(null, depNames.slice(2).map(myRequire));
    if (obj) {
      throw new Error("Unexpected return-style module");
    }
    myDefine[name] = exports;
  };
  const myRequire = name => {
    name = getName(name);
    let exports = modules[name];
    exports = exports ? !kInSW && exports instanceof Promise ? exports.__esModule || (exports.__esModule = {}) : exports : modules[name] = {};
    return exports;
  };
  const doImport = ([path], callback) => {
    const name = getName(path);
    const exports = modules[name] || (modules[name] = new Promise((resolve, reject) => {
      const doc = document;
      const script = doc.createElement("script");
      script.src = path;
      script.onload = () => {
        if (modules[name] === exports) {
          throw new Error(`The module "${name}" didn't call define()!`);
        }
        resolve();
        script.remove();
      };
      script.onerror = ev => {
        reject(ev.message);
        setTimeout(() => {
          modules[name] = void 0;
        }, 1);
      };
      (doc.body || doc.documentElement).appendChild(script);
    }));
    exports instanceof Promise ? exports.then(() => {
      doImport([ path ], callback);
    }) : callback(exports);
  };
  kInSW && (globalThis.__moduleMap = modules);
  globalThis.__importStar = obj => obj;
  globalThis.define = myDefine;
})();
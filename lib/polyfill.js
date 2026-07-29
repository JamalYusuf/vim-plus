"use strict";

// DO NOT USE `no-default-lib` - tsc.js will not output into the corresponding JS file if with it
(function() {
  const symMatch = typeof Symbol === "function" && typeof Symbol.match === "symbol" && Symbol.match, StrCls = String, TECls = TypeError, StrProto = StrCls.prototype, toStr = {}.toString;
  "".startsWith || Object.defineProperty(StrProto, "startsWith", {
    enumerable: false,
    value: function startsWith(searchString) {
      const err = check(this, searchString), a = isLooselyNull(this) || err === 1 ? "" : StrCls(this);
      if (err !== 0) {
        if (err === 1 || err === 2) {
          return !((err < 2 ? this : searchString) + "");
        }
        throw new TECls(err.replace("${func}", "startsWith"));
      }
      let b = StrCls(searchString), args = arguments, c = args.length > 1 ? +args[1] : 0;
      c = c > 0 ? c | 0 : 0;
      c > a.length && (c = a.length);
      return a.lastIndexOf(b, c) === c;
    }
  });
  "".endsWith || Object.defineProperty(StrProto, "endsWith", {
    enumerable: false,
    value: function endsWith(searchString) {
      const err = check(this, searchString), a = isLooselyNull(this) || err === 1 ? "" : StrCls(this);
      if (err !== 0) {
        if (err === 1 || err === 2) {
          return !((err < 2 ? this : searchString) + "");
        }
        throw new TECls(err.replace("${func}", "endsWith"));
      }
      let u, c, b = StrCls(searchString), args = arguments, p = args.length > 1 ? args[1] : u, l = a.length;
      c = (p === u ? l : (c = +p) > 0 ? c | 0 : 0) - b.length;
      c > l && (c = l);
      return c >= 0 && a.indexOf(b, c) === c;
    }
  });
  "".includes || Object.defineProperty(StrProto, "includes", {
    enumerable: false,
    value: function includes(searchString) {
      const err = check(this, searchString), a = isLooselyNull(this) || err === 1 ? "" : StrCls(this);
      if (err !== 0) {
        if (err === 1 || err === 2) {
          return !((err < 2 ? this : searchString) + "");
        }
        throw new TECls(err.replace("${func}", "includes"));
      }
      let b = StrCls(searchString), args = arguments, c = args.length > 1 ? +args[1] : 0;
      c = c > 0 ? c | 0 : 0;
      c > a.length && (c = a.length);
      return a.indexOf(b, c) >= 0;
    }
  });
  function check(a, b) {
    /** note: should never call `valueOf` or `toString` on a / b; `document.all` should pass this */
    if (isLooselyNull(a)) {
      return "String.prototype.${func} called on null or undefined";
    }
    if (!b) {
      return 0;
    }
    let t = typeof a === "symbol" ? 1 : typeof b === "symbol" ? 2 : 0;
    if (t) {
      return t;
    }
    let f, u, i = symMatch && (f = b[symMatch]) !== u ? f : toStr.call(b) === "[object RegExp]";
    return i ? "First argument to String.prototype.${func} must not be a regular expression" : 0;
  }
  function isLooselyNull(object) {
    return object === null || object === void 0;
  }
})();
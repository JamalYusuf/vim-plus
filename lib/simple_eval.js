"use strict";

(() => {
  //#region types
  var _c;
  //#endregion types
  //#region configurations
  const NDEBUG = 0 /* Build.NDEBUG */;
  const HasReflect = true /* Build.MV3 */;
  const DefaultIsolate = globalThis;
  const DefaultObject = Object;
  const DefaultFunction = DefaultIsolate.Function;
  let isolate_ = DefaultIsolate, locals_ = [], stackDepth_ = 0;
  let g_exc = null;
  //#endregion configurations
  //#region constant values of syntax
    const kTokenNames = "block, blockEnd, semiColon, prefix, action, group, dict, array, groupEnd, comma, question, colon, fn, assign, or, and, bitOr, bitXor, bitAnd, compare1, compare2, bitMove, math1, math2, math3, unary, rightUnary, callOrAccess, dot, literal, ref".split(", ");
  const kOpNames = "block,stats,stat,comma,pair,fn,assign,ifElse,binary,unary,call,access,composed,literal,ref,fnDesc".split(",");
  const kLiterals = {
    __proto__: null,
    true: true,
    false: false,
    null: null
  };
  const kUnsupportedTokens = {
    __proto__: null,
    yield: 1,
    await: 1,
    async: 1
  };
  const kLabelled = "labelled", kProto = "__proto__", kDots = "...";
  //#endregion constant values of syntax
  //#region helper functions
    const Op = (o, q, x, y) => NDEBUG ? {
    o,
    q,
    x,
    y
  } : {
    n: o === 12 /* O.composed */ ? x === "{" ? "dict" : "array" : kOpNames[o],
    q,
    x,
    y,
    o
  };
  const kEmptyValue = {
    c: 9,
    v: void 0
  };
  const kOptionalValue = [ void 0 ];
  const kBreakBlock = {
    c: 0,
    v: 0
  };
  const kUnknown = "(...)";
  // `document.all == null` returns `true`
    const isLooselyNull = obj => obj === null || obj === void 0;
  const isArray = Array.isArray;
  const isVarAction = s => "let,const,var".includes(s);
  const resetRe_ = () => /a?/.test("");
  const objCreate = DefaultObject.create;
  const throwSyntax = error => {
    throw new SyntaxError(error);
  };
  const ValueProperty = (value, writable, enumerable, config) => ({
    value,
    writable,
    enumerable,
    configurable: config
  });
  const globalVarAccessor = {
    get globalThis() {
      return "globalThis" in isolate_ ? isolate_.globalThis : isolate_;
    },
    set globalThis(value) {
      DefaultObject.defineProperty(isolate_, "globalThis", ValueProperty(value, true, false, true));
    },
    get __proto__() {
      return isolate_[kProto];
    },
    set __proto__(value) {
      DefaultObject.defineProperty(isolate_, kProto, ValueProperty(value, true, true, false));
    },
    get eval() {
      return innerEval_;
    }
  };
  const replaceAll = (s, source, dest) => s.replaceAll(source, dest);
  const kIterator = Symbol.iterator;
  const kHasMap = true /* BrowserVer.MinEnsuredES6$ForOf$Map$SetAnd$Symbol */;
  const Map2 = kHasMap ? Map : function() {
    this.m = objCreate(null);
  };
  if (!kHasMap) {
    // Map2.prototype.has = function <K extends string, V> (this: Map2<K, V>, i: K): boolean { return i in this.m! }
    Map2.prototype.get = function(i) {
      return this.m[i];
    };
    Map2.prototype.set = function(k, v) {
      this.m[k] = v;
    };
  }
  const collectEnumerable = (src, filterKey, props) => {
    const kSymbol = true /* BrowserVer.MinEnsuredES6$ForOf$Map$SetAnd$Symbol */;
    const GetSymbols = DefaultObject.getOwnPropertySymbols;
    for (const symbol of Object.keys(src).concat(kSymbol || GetSymbols ? GetSymbols(src) : [])) {
      const prop = filterKey(symbol) ? DefaultObject.getOwnPropertyDescriptor(src, symbol) : null;
      (prop === null || prop === void 0 ? void 0 : prop.enumerable) && (props[symbol] = ValueProperty(prop.writable !== void 0 ? prop.value : src[symbol], true, true, true));
    }
  };
  //#endregion helper functions
  //#region tokenize
    const Token = (token, value) => ({
    n: kTokenNames[Math.log2(token)],
    v: value,
    t: token
  });
  let gTokens;
  {
    const arr = [ "{", "}", ";", "if else try catch finally do while for switch case default", "return break continue throw var let const", "(", "", "[", ") ]", ",", "?", ":", "=>", "of = += -= *= /= %= <<= >>= >>>= &= &&= ^= |= ||= **= ??=", "|| ??", "&&", "|", "^", "&", "== != === !==", "< <= > >= in instanceof", "<< >> >>>", "", "* / %", "**", "! ~ typeof void delete", "", "new", ". ?." ], dict = objCreate(null);
    let token, ind = 0, val = 1;
    1 << arr.length - 1 !== 268435456 /* T.dot */ && alert("Assert error: wrong fields in Token Enums");
    for (;ind < arr.length; ind++, val <<= 1) {
      for (token of arr[ind] ? arr[ind].split(" ") : []) {
        dict[token] = Token(val, token);
      }
    }
    dict.function = Token(4096 /* T.fn */ , "fn");
    dict.debugger = Token(536870912 /* T.literal */ , "debugger");
    gTokens = dict;
  }
  const splitTokens = ori_expression => {
    var _a;
    const escapedStrRe = /\\(x..|u\{.*?\}|u.{4}|[0-7]{3}|[^])/g;
    const onHex = (_, hex, codePoint) => hex.length < 2 ? (codePoint = "\n0bfnrtv".indexOf(hex), 
    codePoint < 0 ? hex : codePoint ? " \0\b\f\n\r\t\v"[codePoint] : "") : (codePoint = hex < "8" ? parseInt(hex, 8) : parseInt(hex[1] === "{" ? hex.slice(2, -1) : hex.slice(1), 16), 
    codePoint < 65536 ? String.fromCharCode(codePoint) : String.fromCodePoint(codePoint));
    const expect = re => {
      const reMatch = re.exec(expression_);
      return !!reMatch && (last_ = reMatch[0], expression_ = expression_.slice(last_.length), 
      true);
    };
    const tokens_ = [], curlyBraces = [ 0 ];
    let expression_ = ori_expression, char = 0, last_ = "";
    let spaceExec, before = 4 /* T.semiColon */ , allowRegexp = true;
    while (expression_) {
      char = expression_.charCodeAt(0);
      if (char <= 32 ? 1 << char & 15873 /* kCharCode.space */ : char < 160 /* kCharCode.nbsp */ ? char === 47 /* kCharCode.slash */ && "/*".includes(expression_[1]) : char < 8192 ? char === 160 /* kCharCode.nbsp */ || char === 5760 : char <= 8287 ? /^\s/.test(expression_) : char === 12288 || char === 65279) {
        // not update `before` here
        expect(char !== 47 /* kCharCode.slash */ ? /^\s+/ : /^\/\/[^\n]*|^\/\*[^]*?\*\//);
        before & 1677721874 /* T.ref */ && char !== 47 /* kCharCode.slash */ && /[\n\u2028\u2029]/.test(last_) && tokens_.push(Token(4 /* T.semiColon */ , "\n"));
        continue;
      }
      if (char === 47 /* kCharCode.slash */ && allowRegexp && expect(/^\/(?:[^\\\/[\n]|\[(?:[^\\\]\n]|\\[^\n])*\]|\\[^\n])*\/[a-z]{0,16}(?![\w$])/)) {
        char = last_.lastIndexOf("/");
        tokens_.push(Token(536870912 /* T.literal */ , {
          q: 1 /* L.regexp */ ,
          x: last_.slice(1, char),
          y: last_.slice(char + 1)
        }));
      } else if (char === 46 /* kCharCode.dot */ && expression_.startsWith(kDots)) {
        tokens_.push(Token(1073741824 /* T.ref */ , kDots), Token(512 /* T.comma */ , ","));
        expression_ = expression_.slice(3);
      } else if (char === 96 /* kCharCode.backtick */ || char === 125 /* kCharCode.curlyBraceEnd */ && curlyBraces[curlyBraces.length - 1]) {
        expect(/^[`}](?:[^`\\$]|\\[^]|\$(?!\{))*(?:`|\$\{)/) || throwSyntax("Unexpected template string");
        char = 4 + (char === 96 /* kCharCode.backtick */ ? 1 : 0) + (last_.endsWith("`") ? 2 : 0);
        char & 1 ? tokens_.push(Token(33554432 /* T.unary */ , "`"), Token(128 /* T.array */ , "[")) : (tokens_.push(Token(256 /* T.groupEnd */ , ")"), Token(512 /* T.comma */ , ",")), 
        curlyBraces.pop());
        tokens_.push(Token(536870912 /* T.literal */ , {
          q: char,
          x: last_.slice(1, char & 2 ? -1 : -2).replace(escapedStrRe, onHex),
          y: replaceAll(last_, "\n", "\r")
        }), Token(512 /* T.comma */ , ","));
        char & 2 ? tokens_.push(Token(256 /* T.groupEnd */ , "]")) : (tokens_.push(Token(32 /* T.group */ , "(")), 
        curlyBraces.push(1));
      } else if (char !== 43 /* kCharCode.plus */ && char !== 45 /* kCharCode.dash */ || expression_[1] === "=") {
        if (char === 48 /* kCharCode.N0 */ && expression_.length > 1 && expression_[1] !== "." && expect(/^0(?:[box][\d_a-f]*|[0-7_]+)/i)) {
          last_ = last_[1] < "8" ? "0o" + last_ : last_.toLowerCase();
          tokens_.push(Token(536870912 /* T.literal */ , parseInt(replaceAll(last_.slice(2), "_", ""), (last_.charCodeAt(1) | 32 /* kCharCode.CASE_DELTA */) === 120 /* kCharCode.x */ ? 16 : (last_.charCodeAt(1) | 32 /* kCharCode.CASE_DELTA */) === 111 /* kCharCode.o */ ? 8 : 2)));
        } else if ((char > 47 ? char < 58 : char === 46 /* kCharCode.dot */ && expression_[1] < ":" /* kChar.minNotNum */ && expression_[1] > "/" /* kChar.maxNotNum */) && expect(/^(?:(?:0|[1-9][\d_]*)(?:\.\d[\d_]*|\.|)|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?/)) {
          tokens_.push(Token(536870912 /* T.literal */ , expression_[0] === "n" ? (expression_ = expression_.slice(1), 
          {
            q: 2 /* L.bigint */ ,
            x: last_,
            y: 0
          }) : parseFloat(replaceAll(last_, "_", ""))));
        } else if (char === 39 /* kCharCode.quote1 */ ? expect(/^'([^'\\\n]|\\[^])*'/) : char === 34 /* kCharCode.quote2 */ && expect(/^"([^"\\\n]|\\[^])*"/)) {
          tokens_.push(Token(536870912 /* T.literal */ , last_.slice(1, -1).replace(escapedStrRe, onHex)));
        } else if ((char > 58 ? (char | 96) > 122 && char < 127 : char === 58 || char < 48) && expect(/^(=>|[!=]=?=?|[+\-*\/%^]=|&&?=?|\|\|?=?|>>?>?=?|<<?=?|\*\*=?|\?\?=?|\??\.(?![\d.])|[,?:;*\/%^~\{\}\[\]()])/)) {
          char === 123 /* kCharCode.curlyBraceStart */ ? curlyBraces.push(0) : char === 125 /* kCharCode.curlyBraceEnd */ && curlyBraces.pop();
          tokens_.push(gTokens[last_]);
        } else if (expect(/^(?:[$A-Z_a-z\x80-\uffff]|\\u(?:\{.*?\}|.{4}))(?:[\w$\x80-\uffff]|\\u(?:\{.*?\}|.{4}))*/)) {
          if (spaceExec = /\s/.exec(last_)) {
            expression_ = ori_expression.slice(-(expression_.length + last_.length - spaceExec.index));
            last_ = last_.slice(0, spaceExec.index);
          }
          last_.includes("\\") && (last_ = last_.replace(/\\(u\{.*?\}|u.{4})/g, onHex));
          before === 268435456 /* T.dot */ || last_ in kLiterals ? tokens_.push(Token(536870912 /* T.literal */ , before === 268435456 /* T.dot */ ? last_ : kLiterals[last_])) : last_ in kUnsupportedTokens ? throwSyntax("Unsupported identifier: " + last_) : before === 8 /* T.prefix */ && last_ === "if" && tokens_[tokens_.length - 1].v === "else" ? tokens_[tokens_.length - 1] = Token(8 /* T.prefix */ , "else if") : tokens_.push((_a = gTokens[last_]) !== null && _a !== void 0 ? _a : Token(1073741824 /* T.ref */ , last_));
        } else {
          char = ori_expression.length - expression_.length;
          spaceExec = ori_expression.slice(0, char).split("\n");
          throwSyntax(`Unexpected identifier in ${spaceExec.length}:${spaceExec[spaceExec.length - 1].length + 1} {{ ${ori_expression.slice(Math.max(0, char - 6), char).trimLeft()}\u2503${expression_.slice(0, 6).trimRight()} }}`);
        }
      } else {
        char = expression_.charCodeAt(1) === char ? 2 : 1;
        tokens_.push(Token(char === 2 ? before & 1073742080 /* T.ref */ && tokens_[tokens_.length - 1].v !== "\n" ? 67108864 /* T.rightUnary */ : 33554432 /* T.unary */ : before & 1677721858 /* T.literal */ ? 4194304 /* T.math1 */ : 33554432 /* T.unary */ , expression_.slice(0, char)));
        expression_ = expression_.slice(char);
      }
      const token = tokens_[tokens_.length - 1];
      before = token.t;
      allowRegexp = !(before >= 268435456 /* T.dot */) && (before >= 512 /* T.comma */ ? token.v !== "++" && token.v !== "--" : !"])".includes(token.v));
    }
    return tokens_;
  };
  //#endregion tokenize
  //#region parse syntax tree
    const parseTree = (tokens_, inNewFunc) => {
    const ctx_ = [ Token(1 /* T.block */ , "{") ];
    const values_ = [ Op(0 /* O.block */ , null, null, null) ];
    const consumeUntil = except => {
      while (!(ctx_[ctx_.length - 1].t & except)) {
        consume();
      }
    };
    const tryInsertPrefix = (toInsert, offset) => {
      const id = ",else,else if,catch,finally,while,".indexOf("," + toInsert + ",");
      if (id < 0) {
        return false;
      }
      const head = id < 13 ? "if" : id < 27 ? "try" : "do";
      const unexpected = id < 13 ? "else" : toInsert === "catch" ? "catch,finally" : toInsert;
      let matched = false;
      let it = values_[values_.length - offset], parent = null;
      for (;it.o === 2 /* O.stat */ || it.o === 1 /* O.stats */; it = parent.y) {
        if (it.o === 2 /* O.stat */) {
          it.q === head && (matched = parent);
          parent = it;
        } else {
          it.q[0].q !== head || unexpected.includes(it.q[it.q.length - 1].q) || (matched = it);
          parent = it.q[it.q.length - 1];
        }
      }
      return matched;
    };
    const consume = () => {
      var _a;
      const val = values_.pop();
      const top = ctx_.pop();
      switch (top.t) {
       case 1 /* T.block */ :
        /* T.block: */
        {
          values_.push(val);
          let i = values_.length;
          while (values_[--i].o !== 0 /* O.block */ || values_[i].q) {}
          values_[i].q = values_.splice(i + 1, values_.length - (i + 1)).map(j => j.o !== 2 /* O.stat */ || j.q ? j : j.y);
        }
        break;

       case 8 /* T.prefix */ :
        /* T.prefix: */
        {
          const clause = values_[values_.length - 1].o !== 0 /* O.block */ ? values_.pop() : null;
          values_.length--;
          const matched = !!(ctx_[ctx_.length - 1].t & -41 /* T.group */) && tryInsertPrefix(top.v, 1);
          let stat = matched !== false && top.v === "while" ? Op(2 /* O.stat */ , top.v, val, Op(3 /* O.comma */ , [], 0, 0)) : Op(2 /* O.stat */ , top.v, top.v === kLabelled ? clause.q : top.v === "for" ? Op(0 /* O.block */ , clause.o === 3 /* O.comma */ ? clause.q : [ clause ], null, null) : clause, val);
          matched ? matched.o === 1 /* O.stats */ ? matched.q.push(stat) : matched.y = Op(1 /* O.stats */ , [ matched.y, stat ], null, null) : values_.push(stat.q === kLabelled && val.o === 2 /* O.stat */ && val.q === kLabelled ? (val.x = clause.q + " " + val.x, 
          val) : stat);
        }
        break;

       case 16 /* T.action */ :
        /* T.action: */
        values_.push(Op(2 /* O.stat */ , top.v, null, val.o > 3 /* O.comma */ && isVarAction(top.v) ? Op(3 /* O.comma */ , [ val ], 0, 0) : val));
        break;

       case 32 /* T.group */ :
       case 128 /* T.array */ :
       case 64 /* T.dict */ :
        /* T.group | T.array | T.dict: */
        {
          const newTop = ctx_[ctx_.length - 1];
          if (newTop.t !== 134217728 /* T.callOrAccess */ || top.t !== 32 /* T.group */ && newTop.v === "new") {
            if (top.t !== 32 /* T.group */) {
              let arr = val.o === 3 /* O.comma */ ? val.q : [ val ];
              top.t === 128 /* T.array */ ? values_.push(Op(12 /* O.composed */ , arr, "[", null)) : values_[values_.length - 1].q = arr;
            } else if (newTop.t === 8 /* T.prefix */ && newTop.v === "for" && values_[values_.length - 1].o === 2 /* O.stat */) {
              const cond = values_.pop();
              const init = values_[values_.length - 1];
              values_[values_.length - 1] = Op(3 /* O.comma */ , [ init.q ? init : init.y, cond.y, val ], 0, 0);
            } else {
              values_.push(val);
            }
          } else {
            ctx_.length--;
            top.t === 32 /* T.group */ ? values_.push(Op(10 /* O.call */ , val.o === 3 /* O.comma */ ? val.q : [ val ], values_.pop(), newTop.v === "new" || ctx_[ctx_.length - 1].t === 134217728 /* T.callOrAccess */ && (ctx_.length--, 
            1) ? "new" : newTop.v === "?." ? "?.(" : "()")) : values_[values_.length - 1] = Op(11 /* O.access */ , newTop.v === "?." ? "?.[" : "[", values_[values_.length - 1], val.o === 13 /* O.literal */ && val.q === 0 /* L.plain */ && (_a = val.x) !== null && _a !== void 0 ? _a : val);
          }
        }
        break;

       case 512 /* T.comma */ :
        /* T.comma: */
        {
          const prevVal = values_[values_.length - 1];
          prevVal.o === 3 /* O.comma */ ? prevVal.q.push(val) : values_[values_.length - 1] = Op(3 /* O.comma */ , [ values_[values_.length - 1], val ], 0, 0);
        }
        break;

       case 1024 /* T.question */ :
        throwSyntax('Unexpected "?"');
        break;

       case 2048 /* T.colon */ :
        /* T.colon: */
        ctx_[ctx_.length - 1].t & -4096 /* T.colon */ && throwSyntax(`Unexpected op token #${ctx_[ctx_.length - 1].t} before ":"`);
        if (ctx_[ctx_.length - 1].t & 576 /* T.comma */) {
          const keyOp = values_[values_.length - 1];
          !(1 << keyOp.o & 28672 /* O.composed */) && throwSyntax('Unexpected ":" in an object literal');
          const mayPrefix = values_[values_.length - 2], isToken = mayPrefix.o === 14 /* O.ref */;
          const prefix = !isToken || ctx_[ctx_.length - 1].t !== 64 /* T.dict */ && values_[values_.length - 3].o === 12 /* O.composed */ ? null : (values_.length--, 
          mayPrefix.q);
          const key = keyOp.o === 14 /* O.ref */ ? keyOp.q : keyOp.o === 13 /* O.literal */ ? (keyOp.q !== 0 /* L.plain */ && keyOp.q !== 2 /* L.bigint */ && throwSyntax(`Unexpected dict key: ${keyOp.q}, ${keyOp.x}`), 
          keyOp) : Op(3 /* O.comma */ , keyOp.q, 0, 0);
          values_[values_.length - 1] = Op(4 /* O.pair */ , key, val, prefix);
          val.o === 5 /* O.fn */ && val.y.q === "(){" && (val.y.x = keyOp.o !== 14 /* O.ref */ || prefix ? Op(4 /* O.pair */ , key, Op(13 /* O.literal */ , 0 /* L.plain */ , null, null), prefix) : key);
        } else {
          ctx_.length--;
          const thenVal = values_.pop();
          values_[values_.length - 1] = Op(7 /* O.ifElse */ , values_[values_.length - 1], thenVal, val);
        }
        break;

       case 4096 /* T.fn */ :
        /* T.fn: */
        {
          const rawArgs = values_.pop();
          const args = rawArgs.o === 3 /* O.comma */ ? rawArgs.q : [ rawArgs ];
          const isFn = top.v.length > 3, type = isFn ? ctx_[ctx_.length - 1].t & 9 /* T.prefix */ ? "fn" : "fn _" : top.v;
          values_.push(Op(5 /* O.fn */ , args.length ? args : null, val, Op(15 /* O.fnDesc */ , type, isFn ? Op(14 /* O.ref */ , top.v.slice(3), 0, 0) : null, null)));
        }
        break;

       case 8192 /* T.assign */ :
        values_[values_.length - 1] = Op(6 /* O.assign */ , top.v, val, values_[values_.length - 1]);
        break;

       case 33554432 /* T.unary */ :
       case 67108864 /* T.rightUnary */ :
        /* T.unary: T.rightUnary: */
        values_.push(Op(9 /* O.unary */ , top.v, val, top.t > 33554432 /* T.unary */ ? 1 : 0));
        break;

       case 134217728 /* T.callOrAccess */ :
        /* T.callOrAccess: */
        values_.push(val.o === 10 /* O.call */ ? (val.y = "new", val) : Op(10 /* O.call */ , [], val, "new"));
        break;

       case 268435456 /* T.dot */ :
        /* T.dot: */
        val.o === 13 /* O.literal */ && val.q === 0 /* L.plain */ && typeof val.x === "string" || throwSyntax(`Fail: ${JSON.stringify(val.x)}`);
        values_[values_.length - 1] = Op(11 /* O.access */ , top.v, values_[values_.length - 1], val.x);
        break;

       default:
        values_[values_.length - 1] = Op(8 /* O.binary */ , top.v, values_[values_.length - 1], val);
        break;
      }
    };
    {
      let cur, type, pos_ = 0, before = 1 /* T.block */ , topIsDict = false;
      for (;pos_ < tokens_.length; before = type, pos_++) {
        cur = tokens_[pos_], type = cur.t;
        type & 4120 /* T.fn */ && topIsDict && (before !== 512 /* T.comma */ || tokens_[pos_ - 2].t !== 1073741824 /* T.ref */ || tokens_[pos_ - 2].v !== kDots) && (cur = Token(type = 1073741824 /* T.ref */ , cur.v));
        switch (cur.t) {
         case 1 /* T.block */ :
         case 64 /* T.dict */ :
          /* T.block | T.dict: */
          topIsDict = !(before & 1610617103 /* T.literal */);
          values_.push(topIsDict ? Op(12 /* O.composed */ , null, "{", null) : Op(0 /* O.block */ , null, null, null));
          type = topIsDict ? 64 /* T.dict */ : 1 /* T.block */ , tokens_[pos_].w = {
            n: topIsDict ? "dict" : "block",
            v: "{",
            t: type
          };
          ctx_.push(Token(type, "{"));
          continue;

         case 2 /* T.blockEnd */ :
         case 256 /* T.groupEnd */ :
          /* T.blockEnd | T.groupEnd: */
          before & (224 /* T.dict */ | (type === 256 /* T.groupEnd */ ? 4 /* T.semiColon */ : 0)) ? values_.push(Op(3 /* O.comma */ , [], 0, 0)) : before === 512 /* T.comma */ && ctx_.length--;
          consumeUntil(cur.v === ")" ? 32 /* T.group */ : cur.v === "]" ? 128 /* T.array */ : 65 /* T.dict */);
          type === 2 /* T.blockEnd */ && ctx_[ctx_.length - 1].t === 64 /* T.dict */ && (type = 256 /* T.groupEnd */ , 
          tokens_[pos_].w = {
            n: "groupEnd",
            v: "}",
            t: type
          });
          consume();
          topIsDict = ctx_[ctx_.length - (ctx_[ctx_.length - 1].t === 512 /* T.comma */ ? 2 : 1)].t === 64 /* T.dict */;
          type === 2 /* T.blockEnd */ && values_[values_.length - 1].o === 0 /* O.block */ && consumeUntil(-4121 /* T.fn */);
          continue;

         case 4 /* T.semiColon */ :
          /* T.semiColon: */
          {
            const semiColon = cur.v === ";";
            // here doesn't check `T.group | T.array`
                        const mayBreak = !semiColon && pos_ + 1 < tokens_.length && (before === 16 /* T.action */ || !!(tokens_[pos_ + 1].t & 1644171289 /* T.block */) || values_[values_.length - 1].o === 5 /* O.fn */ && (values_[values_.length - 1].y.q === "=>" ? tokens_[pos_ + 1].t !== 512 /* T.comma */ : !!(ctx_[ctx_.length - 1].t & 9 /* T.prefix */)) && (tokens_[pos_ + 1].t === 4194304 /* T.math1 */ && (tokens_[pos_ + 1] = Token(33554432 /* T.unary */ , tokens_[pos_ + 1].v)), 
            true));
            semiColon ? consumeUntil(33 /* T.block */) : mayBreak && consumeUntil(1535 /* T.question */);
            const prev = mayBreak ? ctx_[ctx_.length - 1] : null;
            if (semiColon || prev && (prev.t === 1 /* T.block */ || (prev.t === 16 /* T.action */ ? before !== 16 /* T.action */ || !isVarAction(prev.v) : prev.t === 8 /* T.prefix */ && (prev.v === "do" || prev.v === "else" || values_[values_.length - 2].o !== 0 /* O.block */ || prev.v === "while" && tryInsertPrefix(prev.v, 3) !== false)))) {
              semiColon || consumeUntil(33 /* T.block */);
              const val = values_[values_.length - 1];
              (ctx_[ctx_.length - 1].t === 32 /* T.group */ ? val.o === 2 /* O.stat */ : val.o < 3) || values_.push(Op(2 /* O.stat */ , "", null, before & 37 /* T.group */ || before === 2 /* T.blockEnd */ && (val.o !== 5 /* O.fn */ || val.y.q < "f") ? Op(3 /* O.comma */ , [], 0, 0) : values_.pop()));
            } else {
              // skip "\n"
              type = before, cur.n = "not-SemiColon";
            }
          }
          continue;

         case 8 /* T.prefix */ :
          /* T.prefix: */
          consumeUntil(41 /* T.block */);
          values_.push(Op(0 /* O.block */ , null, null, null));
 // to recognize soft-semi easier
                    ctx_.push(cur);
          continue;

         case 16 /* T.action */ :
          /* T.action: */
          (pos_ > tokens_.length - 2 || tokens_[pos_ + 1].t & 6 /* T.semiColon */) && "return,break,continue".includes(cur.v) && values_.push(Op(3 /* O.comma */ , [], 0, 0));
          consumeUntil(41 /* T.block */);
          ctx_.push(cur);
          continue;

         case 32 /* T.group */ :
         case 128 /* T.array */ :
          /* T.group | T.array: */
          if (topIsDict) {
            type === 32 /* T.group */ && ctx_.push(Token(2048 /* T.colon */ , ":"), Token(4096 /* T.fn */ , "(){"));
            topIsDict = false;
          } else {
            ctx_[ctx_.length - 1].t & 268439552 /* T.fn */ && before !== 4096 /* T.fn */ && consume();
            (before & 1610612992 /* T.literal */ || before === 2 /* T.blockEnd */ && 1 << values_[values_.length - 1].o & 4128 /* O.fn */) && ctx_.push(Token(134217728 /* T.callOrAccess */ , "("));
          }
          ctx_.push(cur);
          continue;

         case 512 /* T.comma */ :
          /* T.comma: */
          before & 640 /* T.array */ ? values_.push(Op(13 /* O.literal */ , 3 /* L.array_hole */ , null, 0)) : before === 256 /* T.groupEnd */ && values_[values_.length - 1].o === 3 /* O.comma */ && ctx_[ctx_.length - 1].t & 160 /* T.array */ && (values_[values_.length - 1] = Op(3 /* O.comma */ , [ values_[values_.length - 1] ], 0, 0));
          while (ctx_[ctx_.length - 1].t >= 512 /* T.comma */) {
            consume();
          }
          ctx_[ctx_.length - 1].t === 64 /* T.dict */ && (topIsDict = true);
          ctx_.push(cur);
          continue;

         case 2048 /* T.colon */ :
          /* T.colon: */
          if (before === 1073741824 /* T.ref */) {
            const top = ctx_[ctx_.length - 1];
            if (top.t === 1 /* T.block */ || top.t === 8 /* T.prefix */ && (top.v === kLabelled || values_[values_.length - 2].o !== 0 /* O.block */)) {
              values_.splice(values_.length - 1, 0, Op(0 /* O.block */ , null, null, null));
              ctx_.push(Token(8 /* T.prefix */ , kLabelled));
            }
          }
          consumeUntil(topIsDict ? 2047 /* T.question */ : 1535 /* T.question */);
          if (ctx_[ctx_.length - 1].t !== 8 /* T.prefix */) {
            ctx_.push(cur), topIsDict = false;
          } else {
            type = 256 /* T.groupEnd */ , cur.w = Token(256 /* T.groupEnd */ , ")");
            const prefix = ctx_[ctx_.length - 1].v;
            if (prefix === "case" || prefix === "default") {
              values_.push(Op(13 /* O.literal */ , 0 /* L.plain */ , null, null));
              consume();
            }
          }
          continue;

         case 4096 /* T.fn */ :
          /* T.fn: */
          if (cur.v === "fn" && tokens_[pos_ + 1].t === 1073741824 /* T.ref */) {
            ctx_.push(Token(4096 /* T.fn */ , `fn ${tokens_[++pos_].v}`));
          } else {
            tokens_[pos_ + 1].v === "*" && throwSyntax("Unsupported generator");
            ctx_.push(cur);
          }
          continue;

         case 536870912 /* T.literal */ :
          /* T.literal: */
          {
            const val = cur.v;
            values_.push(typeof val === "object" && val ? Op(13 /* O.literal */ , val.q, val.x, val.y) : Op(13 /* O.literal */ , 0 /* L.plain */ , val, null));
          }
          continue;

         case 1073741824 /* T.ref */ :
          /* T.ref: */
          values_.push(Op(14 /* O.ref */ , cur.v, 0, 0));
          continue;

         case 134217728 /* T.callOrAccess */ :
          /* T.callOrAccess: */
          cur.v !== "new" && throwSyntax(`Unexpected token: '${cur.v}'`);
          if (tokens_[pos_ + 1].t === 268435456 /* T.dot */) {
            values_.push(Op(14 /* O.ref */ , "new.target", 0, 0));
            pos_ += 2;
            type = 1073741824 /* T.ref */;
            continue;
          }
          break;

         case 4194304 /* T.math1 */ :
          /* T.math1 */
          if (before === 2 /* T.blockEnd */ && !(1 << values_[values_.length - 1].o & 4128 /* O.fn */)) {
            cur = Token(type = 33554432 /* T.unary */ , cur.v);
            tokens_[pos_].w = cur;
          }
          break;

         case 1048576 /* T.compare2 */ :
          /* T.compare2 */
          if (cur.v === "in") {
            const t1 = ctx_[ctx_.length - (ctx_[ctx_.length - 1].t === 32 /* T.group */ ? 2 : 1)];
            (t1.t === 16 /* T.action */ ? isVarAction(t1.v) : t1.t === 8 /* T.prefix */ && t1.v === "for" && values_[values_.length - 2].o === 0 /* O.block */) && (cur = Token(type = 8192 /* T.assign */ , "in"), 
            tokens_[pos_].w = cur);
          }
          break;

         case 268435456 /* T.dot */ :
          /* T.dot */
          tokens_[pos_ + 1].t & 160 /* T.array */ && (cur = Token(type = 134217728 /* T.callOrAccess */ , "?."), 
          tokens_[pos_].w = cur);
          break;

         default:
        }
        {
          const kOpL2R = 301924864 /* T.dot */;
          consumeUntil((type & 15360 /* T.assign */ ? 16384 : type & kOpL2R ? type : type << 1) - 1);
          ctx_.push(cur);
        }
      }
    }
    while (ctx_.length > 1) {
      consume();
    }
    return values_.length === 2 && values_[1].o > 2 /* O.stat */ && !inNewFunc ? values_[1] : (consume(), 
    values_[0]);
  };
  const getEscapeAnalyser = () => {
    const ToVarNames = (out, ops) => {
      for (let op of ops) {
        op = op.o === 4 /* O.pair */ ? op.x : op;
        op.o === 14 /* O.ref */ ? op.q !== kDots && out.push(op.q) : op.o === 13 /* O.literal */ || (op.o === 12 /* O.composed */ ? ToVarNames(out, op.q) : op.y.o === 14 /* O.ref */ ? out.push(op.y.q) : ToVarNames(out, op.y.q));
      }
      return out;
    };
    const preScanFnBody = (pureVars, block) => {
      const lets = [], consts = [], todos = block.q.slice();
      let statement, anyFn = 0;
      while (statement = todos.shift()) {
        if (statement.o !== 2 /* O.stat */) {
          statement.o === 5 /* O.fn */ && statement.y.q === "fn" && statement.y.x && (lets.push(statement.y.x.q), 
          anyFn || (anyFn = consts.unshift(kDots)));
          continue;
        }
        const {q: action, y: value} = statement;
        if (isVarAction(action)) {
          ToVarNames(action > "v" ? pureVars : action < "l" ? consts : lets, value.q);
        } else if (value.o === 5 /* O.fn */) {
          // for those labelled
          value.y.q === "fn" && value.y.x && (lets.push(value.y.x.q), anyFn || (anyFn = consts.unshift(kDots)));
        } else {
          if (action === "for" && statement.x.q[0].o === 2 /* O.stat */) {
            const act2 = statement.x.q[0].q;
            ToVarNames(act2 === "let" ? statement.x.y = [] : act2 === "var" ? pureVars : statement.x.x = [], statement.x.q[0].y.q);
          }
          value.o === 2 /* O.stat */ ? todos.push(value) : value.o < 2 /* O.stat */ && preScanFnBody(pureVars, value);
        }
      }
      block.x = consts.length > 0 ? consts : null;
      block.y = lets.length > 0 ? lets : null;
    };
    const varMap = new Map2, _scopes = [];
    let _cur_fn = 1;
    const VarDecl = (flag, name) => {
      const mapped = varMap.get(name), decl = {
        o: flag,
        q: _cur_fn,
        x: mapped,
        y: name
      };
      mapped !== void 0 ? (mapped.o = _cur_fn, mapped.x.push(mapped.q), mapped.q = [], 
      mapped.y.push(decl)) : varMap.set(name, decl.x = {
        o: _cur_fn,
        q: [],
        x: [],
        y: [ decl ]
      });
      return decl;
    };
    const Scope = (consts, lets) => {
      const scope = [];
      if (consts) {
        for (const i of consts[0] === kDots ? consts.slice(1) : consts) {
          scope.push(VarDecl(5 /* V.localc */ , i));
        }
      }
      if (lets) {
        for (const i of lets) {
          scope.push(VarDecl(4 /* V.locall */ , i));
        }
      }
      _scopes.push(scope);
      return scope;
    };
    const exitScope = op => {
      const declarations = _scopes.pop(), level = _scopes.length, referred = op.o === 14 /* O.ref */ ? declarations[0].x.q : null;
      declarations.sort((a, b) => a.o - b.o);
      let i = 0, numbers = [ 0, 0, 0, 0, 0, 0, 0 ];
      for (const {o: flags, x: mapped} of declarations) {
        for (const op of mapped.q) {
          op.x = level, op.y = i;
        }
        mapped.x.length > 0 ? (mapped.q = mapped.x.pop(), mapped.o = mapped.y.pop().q) : varMap.set(declarations[i].y, void 0);
        numbers[flags]++;
        i++;
      }
      let [n1, n2, n3, n4, n5, n6] = numbers;
      n2 += n1, n3 += n2, n4 += n3, n5 += n4, n6 += n5;
      if (op.o === 14 /* O.ref */) {
        op.x = n1, op.y = referred.length ? 0 : -1;
      } else {
        declarations.length = n6;
        op.y = {
          t: [ n1, n2, n3, n4, n5, n6 ],
          v: declarations.map(i => i.y)
        };
      }
    };
    const kFnBuiltinVars = [ "this", "arguments", "new.target" ];
    const visit = op => {
      var _a, _b, _c, _d, _e, _f, _g;
      switch (op.o) {
       case 0 /* O.block */ :
        /* O.block: */
        if ((_a = op.x) !== null && _a !== void 0 ? _a : op.y) {
          Scope(op.x, op.y);
          op.q.forEach(visit);
          op.x = ((_b = op.x) === null || _b === void 0 ? void 0 : _b[0]) === kDots ? 1 : 0;
          exitScope(op);
        } else {
          op.q.forEach(visit);
        }
        return;

       case 2 /* O.stat */ :
        /* O.stat: */
        if (op.q === "for") {
          const block = op.x, scoped = (_c = block.x) !== null && _c !== void 0 ? _c : block.y;
          scoped && Scope(block.x, block.y);
          block.q.forEach(visit);
          visit(op.y);
          if (scoped) {
            block.x = 0;
            exitScope(block);
          }
          return;
        }
        if (op.q === "catch" && op.x) {
          Scope(null, ToVarNames([], op.x.o === 14 /* O.ref */ ? [ op.x ] : op.x.q));
          visit(op.x);
          visit(op.y);
          exitScope(op.x);
          return;
        }
        break;

       case 5 /* O.fn */ :
        /* O.fn: */
        op.y.q.length > 3 ? Scope(null, [ op.y.x.q ]) : op.y.q === "fn" && op.y.x && visit(op.y.x);
        _cur_fn++;
        if (op.x.o === 0 /* O.block */) {
          let pureVars = [], block = op.x;
          preScanFnBody(pureVars, block);
          pureVars = [ ...new Set(pureVars) ];
          const lets = (_d = block.y) !== null && _d !== void 0 ? _d : [];
          op.q && ToVarNames(lets, op.q);
          pureVars = lets.length ? pureVars.filter(i => !lets.includes(i)) : pureVars;
          const scope = Scope(block.x, lets), builtins = op.y.q !== "=>" ? kFnBuiltinVars : null;
          for (const i of builtins ? pureVars.concat(builtins) : pureVars) {
            scope.push(VarDecl(3 /* V.localv */ , i));
          }
          const [b0, b1, b2] = builtins ? scope.slice(-3) : [ null, null, null ];
          (_e = op.q) === null || _e === void 0 || _e.forEach(visit);
          block.q.forEach(visit);
          builtins && (b0.x.q.length || (b0.o = 6 /* V.unused */), b1.x.q.length || (b1.o = 6 /* V.unused */), 
          b2.x.q.length || (b2.o = 6 /* V.unused */));
          exitScope(op.y);
          block.x = ((_f = block.x) === null || _f === void 0 ? void 0 : _f[0]) === kDots ? 1 : 0;
          block.y = builtins && b0.o + b1.o + b2.o !== 18 ? [ scope.indexOf(b0), scope.indexOf(b1), scope.indexOf(b2) ] : null;
        } else {
          Scope(null, op.q ? ToVarNames([], op.q) : []);
          (_g = op.q) === null || _g === void 0 || _g.forEach(visit);
          visit(op.x);
          exitScope(op.y);
        }
        _cur_fn--;
        op.y.q.length > 3 && exitScope(op.y.x);
        return;

       case 12 /* O.composed */ :
        op.q.forEach(visit);
        return;

       case 13 /* O.literal */ :
        return;

       case 14 /* O.ref */ :
        {
          const val = op.q, mapped = val !== kDots ? varMap.get(val) : void 0;
          if (mapped !== void 0) {
            mapped.q.push(op);
            const decl = mapped.o !== _cur_fn && mapped.o !== 0 ? mapped.y[mapped.y.length - 1] : void 0;
            decl !== void 0 && (mapped.o = decl.q = 0, decl.o = 5 /* V.localc */ - decl.o);
          } else {
            op.x = -1;
          }
          return;
        }
      }
      const {q, x, y} = op;
      typeof q === "object" && q && (isArray(q) ? q.forEach(visit) : visit(q));
      typeof x === "object" && x && visit(x);
      typeof y === "object" && y && visit(y);
    };
    return visit;
  };
  const throwReference = (name, isLocal) => {
    throw new ReferenceError(isLocal ? `Cannot access '${name}' before initialization` : `${name} is not defined`);
  };
  const throwType = error => {
    throw new TypeError(error);
  };
  const newException = noHandler => g_exc = {
    g: isolate_,
    l: locals_.slice(0),
    d: noHandler ? stackDepth_ : -stackDepth_
  };
  const StackFrameFromComposedOp = (newVar, val, parentOp) => {
    if (newVar.o === 14 /* O.ref */) {
      const elet = newVar.x;
      StackFrame({
        t: [ 0, elet, elet, elet, 1, 1 ],
        v: [ newVar.q ]
      }, [ newVar.y, val ]);
    } else {
      StackFrame(newVar.y);
      evalDestructuring(newVar, val, parentOp);
    }
  };
  const StackFrame = (analysed, defined, scopeName) => {
    var _a;
    const varDict = [];
    let i = 0, end = analysed.t[5 /* V.all */ ], el = analysed.t[1 /* V.elet */ ], lv = analysed.t[3 /* V.localv */ ];
    for (;i < end; i++) {
      varDict.push(i < el || i > lv ? kEmptyValue : void 0);
    }
    for (i = 0, end = (_a = defined === null || defined === void 0 ? void 0 : defined.length) !== null && _a !== void 0 ? _a : 0; i < end; i += 2) {
      defined[i] >= 0 && (varDict[defined[i]] = defined[i + 1]);
    }
    const frame = {
      o: varDict,
      q: analysed.t,
      x: analysed.v,
      y: scopeName !== null && scopeName !== void 0 ? scopeName : null
    };
    locals_.push(frame);
    return frame;
  };
  const exitFrame = delta => {
    for (let i = 0; i < delta; i++) {
      const frame = locals_.pop();
      frame.o.length = frame.q[2 /* V.evar */ ];
    }
  };
  const _resolveVarRef = (op, getter) => {
    let level = op.x;
    if (level >= 0) {
      const frame = locals_[level], pos = op.y, cur = frame.o[pos];
      cur !== kEmptyValue || getter & 2 /* R.eveNotInited */ || throwReference(op.q, true);
      return {
        y: frame.o,
        i: pos
      };
    }
    const varName = op.q;
    level === -1 && (level = op.x = varName === "undefined" ? -3 : varName === "globalThis" ? isolate_ === DefaultIsolate ? -2 : -4 : varName !== kProto && varName !== "eval" || isolate_ !== DefaultIsolate ? -5 : -2);
    return level === -2 ? {
      y: globalVarAccessor,
      i: varName
    } : level !== -5 ? {
      y: [ level === -3 ? void 0 : isolate_ ],
      i: 0
    } : varName in isolate_ || getter & 1 /* R.evenNotFound */ ? {
      y: isolate_,
      i: varName
    } : throwReference(varName, false);
  };
  const Ref = (op, type) => {
    switch (op.o) {
     case 10 /* O.call */ :
      const ret = innerEvalCall(op, type);
      return {
        y: ret === kOptionalValue ? ret : [ ret ],
        i: 0
      };

     case 11 /* O.access */ :
      const ref = Ref(op.x, 8 /* R.allowOptional */), y = ref.y[ref.i];
      if (isLooselyNull(y)) {
        if (ref.y === kOptionalValue || op.q[0] === "?") {
          return {
            y: kOptionalValue,
            i: 0
          };
        }
        throwType(`Cannot read properties of ${y} (reading ${AccessToString(typeof op.y === "object" ? opEvals[op.y.o](op.y) : op.y, 1)})`);
      }
      return {
        y,
        i: typeof op.y === "object" ? opEvals[op.y.o](op.y) : op.y
      };

     case 14 /* O.ref */ :
       return _resolveVarRef(op, type);

     default:
      return {
        y: [ opEvals[op.o](op) ],
        i: 0
      };
    }
  };
  const evalTry = (stats, i) => {
    const statement = stats[i], next = stats[i + 1];
    const indFinal = next.q === "finally" ? i + 1 : i + 2 < stats.length && stats[i + 2].o === 2 /* O.stat */ && stats[i + 2].q === "finally" ? i + 2 : 0;
    const oldLocalsPos = locals_.length;
    let res2, done = 0, res = kEmptyValue;
    try {
      if (next.q !== "catch") {
        res = evalBlockBody(statement.y);
        done = 1;
      } else {
        try {
          res = evalBlockBody(statement.y);
          done = 1;
        } catch (ex) {
          g_exc || newException();
          exitFrame(locals_.length - oldLocalsPos);
          next.x && StackFrameFromComposedOp(next.x, ex, null);
          res = evalBlockBody(next.y);
          next.x && exitFrame(1);
          g_exc = null;
          done = 1;
        }
      }
    } finally {
      if (indFinal) {
        const oldLocals = locals_, oldExc = done ? null : g_exc || newException();
        done || (locals_ = locals_.slice(0, oldLocalsPos), oldExc && (oldExc.d = -Math.abs(oldExc.d)));
        res2 = evalBlockBody(stats[indFinal].y);
        if (res2 !== kEmptyValue) {
          res === kBreakBlock && res !== res2 && (res.c = res.v = 0);
          res = res2;
 // even override break
                }
        done || (locals_ = oldLocals, oldExc && (oldExc.d = Math.abs(oldExc.d)));
      }
    }
    return {
      c: indFinal || i + 1,
      v: res
    };
  };
  const SubBlock = op => op.o === 2 /* O.stat */ ? Op(0 /* O.block */ , [ op ], null, null) : op;
  const consumeContinue = (res, labels) => res !== kBreakBlock || !res.c || res.v && !(labels === null || labels === void 0 ? void 0 : labels.includes(res.v)) ? res : (res.c = res.v = 0, 
  kEmptyValue);
  const evalFor = (statement, labels) => {
    const body = statement.y, initOp = statement.x.q[0];
    const analysedScope = statement.x.y;
    const forkScope = () => {
      const old = locals_[locals_.length - 1], newVars = old.o.slice();
      exitFrame(1);
      locals_.push({
        o: newVars,
        q: old.q,
        x: old.x,
        y: old.y
      });
      return newVars;
    };
    let ref, res = kEmptyValue;
    analysedScope && StackFrame(analysedScope);
    if (statement.x.q.length === 3) {
      initOp.o === 2 /* O.stat */ ? evalLet(initOp.q, initOp.y.q, null) : opEvals[initOp.o](initOp);
      for (;opEvals[statement.x.q[1].o](statement.x.q[1]); analysedScope && forkScope(), 
      opEvals[statement.x.q[2].o](statement.x.q[2])) {
        body.o <= 2 /* O.stat */ ? res = evalBlockBody(SubBlock(body)) : opEvals[body.o](body);
        if ((res = consumeContinue(res, labels)) !== kEmptyValue) {
          break;
        }
      }
    } else {
      const assignment = initOp.o === 2 /* O.stat */ ? initOp.y.q[0] : initOp;
      const source = opEvals[assignment.x.o](assignment.x);
      ref = assignment.y.o === 12 /* O.composed */ ? null : _resolveVarRef(assignment.y, analysedScope ? 2 /* R.eveNotInited */ : 0 /* R.plain */);
      if (assignment.q === "in") {
        for (let item in source) {
          ref ? ref.y[ref.i] = item : evalDestructuring(assignment.y, item, assignment);
          body.o <= 2 /* O.stat */ ? res = evalBlockBody(SubBlock(body)) : opEvals[body.o](body);
          if ((res = consumeContinue(res, labels)) !== kEmptyValue) {
            break;
          }
          analysedScope && (ref ? ref.y = forkScope() : forkScope());
        }
      } else {
        let cur, iterator = evalIter(source, assignment.x), ind = 0;
        while ((res = consumeContinue(res, labels)) === kEmptyValue && (cur = iterator.next(), 
        !cur.done)) {
          const item = cur.value;
          ref ? ref.y[ref.i] = item : evalDestructuring(assignment.y, item, assignment);
          body.o <= 2 /* O.stat */ ? res = evalBlockBody(SubBlock(body)) : opEvals[body.o](body);
          analysedScope && (ref ? ref.y = forkScope() : forkScope());
          ind++;
        }
      }
    }
    analysedScope && exitFrame(1);
    return res;
  };
  const evalIter = (source, sourceOp) => {
    {
      const it = isLooselyNull(source) ? source : source[kIterator];
      typeof it !== "function" && throwType(DebugCallee(sourceOp, null, "") + " is not iterable");
      return HasReflect ? Reflect.apply(it, source, []) : evalCall.call.call(it, source);
    }
  };
  const evalLet = (action, declarations, args) => {
    const appendUndefined = action === "arg" || action === "let";
    let op, bindings = action === "var" ? null : locals_[locals_.length - 1].o, ind = -1;
    for (op of declarations) {
      ind++;
      if (args !== null && op.o === 14 /* O.ref */ && op.q === kDots) {
        bindings[declarations[ind + 1].y] = args.slice(ind);
        break;
      }
      args !== null && ind < args.length && args[ind] !== void 0 ? op.o === 6 /* O.assign */ ? op.y.o === 12 /* O.composed */ ? evalDestructuring(op.y, args[ind], null) : bindings[op.y.y] = args[ind] : bindings[op.y] = args[ind] : op.o === 14 /* O.ref */ ? appendUndefined && (bindings[op.y] = void 0) : op.y.o === 12 /* O.composed */ ? evalDestructuring(op.y, opEvals[op.x.o](op.x), op) : (bindings !== null && bindings !== void 0 ? bindings : bindings = locals_[op.y.x].o)[op.y.y] = op.x.o === 5 /* O.fn */ ? FunctionFromOp(op.x, isolate_, locals_, op.y.q) : opEvals[op.x.o](op.x);
    }
  };
  const evalDestructuring = (destructOp, composed_value, parentOp) => {
    if (destructOp.x === "[") {
      const iterator = evalIter(composed_value, parentOp ? parentOp.x : Op(14 /* O.ref */ , kUnknown, 0, 0));
      let index = 0, cur = {
        value: void 0,
        done: false
      };
      for (const op of destructOp.q) {
        cur.done || (cur = iterator.next());
        if (op.o === 13 /* O.literal */) {} else {
          if (op.o === 14 /* O.ref */ && op.q === kDots) {
            // q[index + 1]: RefOp | DestructuringComposedOp
            const arr = cur.done ? [] : [ cur.value ];
            while (!(cur = iterator.next()).done) {
              arr.push(cur.value);
            }
            iter(kDots, destructOp.q[index + 1], arr);
            break;
          }
          iter(index, op, cur.value);
        }
        index++;
      }
    } else if (isLooselyNull(composed_value)) {
      const first = destructOp.q[0], desc = first.o == 14 /* O.ref */ ? first.q !== kDots ? first.q : "" : first.o !== 4 /* O.pair */ || typeof first.q === "object" && first.q.o === 3 /* O.comma */ || first.x.o === 6 /* O.assign */ ? "" : typeof first.q === "object" ? evalLiteral(first.q) : first.q;
      throwType("Cannot destructure " + (desc ? "property '" + desc + "' of '" : "'") + (parentOp && ToString(parentOp.x, 3584 /* O.unary */) || kUnknown) + "' as it is " + composed_value + ".");
    } else {
      const visited = new Map2;
      for (const op of destructOp.q) {
        if (op.o === 14 /* O.ref */ && op.q === kDots) {
          const props = objCreate(null);
          collectEnumerable(composed_value, key => !visited.get(key), props);
          const sub_value = objCreate(DefaultObject.prototype, props);
          iter(kDots, destructOp.q[destructOp.q.length - 1], sub_value);
          break;
        }
        const keyOp = op.o === 14 /* O.ref */ ? op.q : op.o === 6 /* O.assign */ ? op.y.q : op.q;
        const key = evalAccessKey(typeof keyOp === "object" ? opEvals[keyOp.o](keyOp) : keyOp);
        iter(keyOp, op.o === 4 /* O.pair */ ? op.x : op, composed_value[key]);
        visited.set(key, 1);
      }
    }
    function iter(keyOp, target, value) {
      const useDefault = value === void 0 && target.o === 6 /* O.assign */;
      useDefault && (value = opEvals[target.x.o](target.x));
      const ref = target.o === 14 /* O.ref */ ? _resolveVarRef(target, 2 /* R.eveNotInited */) : target.o === 6 /* O.assign */ && target.y.o === 14 /* O.ref */ ? _resolveVarRef(target.y, 2 /* R.eveNotInited */) : null;
      ref !== null ? ref.y[ref.i] = value : evalDestructuring(target.o === 12 /* O.composed */ ? target : target.y, value, useDefault ? target : Op(6 /* O.assign */ , "=", Op(11 /* O.access */ , "[", parentOp ? parentOp.x : Op(14 /* O.ref */ , kUnknown, 0, 0), typeof keyOp === "object" ? keyOp : Op(13 /* O.literal */ , 0 /* L.plain */ , keyOp, null)), target.y));
    }
  };
  const evalBlockBody = (block, labels) => {
    const statements = block.q;
    let statement, prefix, val, res = kEmptyValue, i = 0;
    block.y && StackFrame(block.y);
    for (statement of block.x ? statements : []) {
      const val2 = statement.o === 2 /* O.stat */ ? statement.y : statement;
      val2.o === 5 /* O.fn */ && val2.y.q === "fn" && val2.y.x && (locals_[locals_.length - 1].o[val2.y.x.y] = FunctionFromOp(val2, isolate_, locals_, ""));
    }
    i = 0;
    if (labels === 0) {
      let src = kBreakBlock.v, defaultClause = 0;
      kBreakBlock.v = 0;
      for (statement of statements) {
        if (statement.o !== 2 /* O.stat */) {} else if (statement.q === "case") {
          const val = opEvals[statement.x.o](statement.x);
          if (val === src) {
            break;
          }
        } else {
          defaultClause || statement.q === "default" && (defaultClause = i + 1);
        }
        i++;
      }
      i = i < statements.length ? i + 1 : defaultClause || i;
    }
    for (;i < statements.length && res === kEmptyValue; i++) {
      statement = statements[i];
      prefix = statement.o === 2 /* O.stat */ ? statement.q : "";
      val = statement.o === 2 /* O.stat */ ? statement.y : statement;
      switch (prefix) {
       case "do":
       case "while":
        for (let isDo = prefix === "do", cond = (isDo ? statements[++i] : statement).x; (res = consumeContinue(res, !i && labels || null)) === kEmptyValue && (isDo || opEvals[cond.o](cond)); isDo = false) {
          val.o <= 2 /* O.stat */ ? res = evalBlockBody(SubBlock(val)) : opEvals[val.o](val);
        }

        // no break;
               case "for":
        prefix === "for" && (res =  evalFor(statement, !i && labels || null));
        res = res !== kBreakBlock || res.v ? res : kEmptyValue;
        break;

       case "try":
        res =  evalTry(statements, i);
        i = res.c;
        res = res.v;
        break;

       case "break":
       case "continue":
        kBreakBlock.c = prefix === "break" ? 0 : 1;
        kBreakBlock.v = val.o === 14 /* O.ref */ ? val.q : 0;
        return kBreakBlock;

       case "const":
       case "let":
       case "var":
        evalLet(prefix, statement.y.q, null);
        break;

       case "return":
       case "throw":
        res = {
          c: 2,
          v: opEvals[val.o](val)
        };
        if (prefix !== "throw") {
          return res;
        }
        throw res.v;

       case "labelled":
        labels = statement.x.split(" ");
        val.o <= 2 /* O.stat */ ? res = evalBlockBody(SubBlock(val), labels) : val.o !== 5 /* O.fn */ && opEvals[val.o](val);
        res === kBreakBlock && res.v && labels.includes(res.v) && (res.v = 0, res = kEmptyValue);
        break;

       case "switch":
        kBreakBlock.v = opEvals[statement.x.o](statement.x);
        res = evalBlockBody(val, 0);
        res = res !== kBreakBlock || res.v ? res : kEmptyValue;
        break;

       default:
        prefix !== "catch" && prefix !== "finally" || throwType("Error in try/catch");
        if (prefix !== "if" && prefix !== "else if" || opEvals[statement.x.o](statement.x)) {
          val.o <= 2 /* O.stat */ ? res = evalBlockBody(SubBlock(val)) : val.o !== 5 /* O.fn */ && opEvals[val.o](val);
          while (i + 1 < statements.length && statements[i + 1].o === 2 /* O.stat */ && statements[i + 1].q.startsWith("else")) {
            i++;
          }
        }
        break;
      }
    }
    block.y && exitFrame(1);
    return res;
  };
  const evalNever = op => {
    throwSyntax("Can not eval Op::" + (op.o === 0 /* O.block */ ? "Block" : op.o === 1 /* O.stats */ ? "stats" : op.o === 2 /* O.stat */ ? "stat" : "Pair") + " directly");
  }, baseEvalCommaList = opList => {
    let arr = [];
    for (let i = 0; i < opList.length; i++) {
      const item = opList[i];
      if (item.o === 14 /* O.ref */ && item.q === kDots) {
        ++i;
        const subArray = opEvals[opList[i].o](opList[i]);
        arr = arr.concat(isArray(subArray) ? subArray : /** throwable */ [].slice.call(subArray));
      } else {
        item.o === 13 /* O.literal */ && item.q === 3 /* L.array_hole */ ? arr.length += 1 : arr.push(opEvals[opList[i].o](opList[i]));
      }
    }
    return arr;
  }, evalComma = op => {
    const arr = baseEvalCommaList(op.q);
    return arr.length > 0 ? arr[arr.length - 1] : void 0;
  }, evalFn = op => FunctionFromOp(op, isolate_, locals_, ""), evalAssign = op => {
    const action = op.q, target = op.y, direct = action === "=";
    const {y, i} = target.o !== 12 /* O.composed */ ? Ref(target, direct ? 6 /* R.evenNeitherInitedNorFound */ : 0 /* R.plain */) : {
      y: [ 0 ],
      i: 0
    };
    let x = direct ? 0 : y[i];
    if (action === "??=" ? !isLooselyNull(x) : action === "||=" ? x : action === "&&=" && !x) {
      return x;
    }
    const source = op.x.o !== 5 /* O.fn */ ? opEvals[op.x.o](op.x) : FunctionFromOp(op.x, isolate_, locals_, target.o === 14 /* O.ref */ ? target.q : "");
    switch (action) {
     case "+=":
      x += source;
      break;

     case "-=":
      x -= source;
      break;

     case "*=":
      x *= source;
      break;

     case "/=":
      x /= source;
      break;

     case "%=":
      x %= source;
      break;

     case "**=":
      x **= source;
      break;

     case "<<=":
      x <<= source;
      break;

     case ">>=":
      x >>= source;
      break;

     case ">>>=":
      x >>>= source;
      break;

     case "&=":
      x &= source;
      break;

     case "^=":
      x ^= source;
      break;

     case "|=":
      x |= source;
      break;

     default:
      x = source;
      break;
 // lgtm [js/unreachable-statement]
        }
    if (target.o === 12 /* O.composed */) {
      evalDestructuring(target, source, op);
    } else if (target.o === 14 /* O.ref */ && target.x >= 0) {
      const analysed = locals_[target.x].q;
      (target.y < analysed[0 /* V.econst */ ] || target.y >= analysed[4 /* V.locall */ ]) && throwType(`Assignment to constant variable '${target.q}'.`);
    }
    return y[i] = x;
  }, evalIfElse = op => opEvals[op.q.o](op.q) ? opEvals[op.x.o](op.x) : opEvals[op.y.o](op.y), evalBinary = op => {
    const x = opEvals[op.x.o](op.x), action = op.q;
    if (action === "&&" ? !x : action === "||" ? x : action === "??" && !isLooselyNull(x)) {
      return x;
    }
    const y = opEvals[op.y.o](op.y);
    switch (action) {
     case "|":
      return x | y;

     case "^":
      return x ^ y;

     case "&":
      return x & y;

     case "<<":
      return x << y;

     case ">>":
      return x >> y;

     case ">>>":
      return x >>> y;

     case "==":
      return x == y;

     case "!=":
      return x != y;

     case "===":
      return x === y;

     case "!==":
      return x !== y;

     case "<":
      return x < y;

     case "<=":
      return x <= y;

     case ">":
      return x > y;

     case ">=":
      return x >= y;

     case "+":
      return x + y;

     case "-":
      return x - y;

     case "*":
      return x * y;

     case "/":
      return x / y;

     case "%":
      return x % y;

     case "**":
      return x ** y;

     case "in":
      return x in y;

     case "instanceof":
      return x instanceof y;

     default:
      return y;
 // lgtm [js/unreachable-statement]
        }
  }, evalUnary = op => {
    const action = op.q, target = op.x, {y, i} = Ref(target, action === "typeof" ? 1 /* R.evenNotFound */ : 0 /* R.plain */);
    switch (action) {
     case "+":
      return +y[i];

     case "-":
      return -y[i];

     case "!":
      return !y[i];

     case "~":
      return ~y[i];

     case "++":
      return op.y ? y[i]++ : ++y[i];

     case "--":
      return op.y ? y[i]-- : --y[i];

     case "typeof":
      return typeof y[i];

     case "delete":
      return target.o === 14 /* O.ref */ || delete y[i];

     case "`":
      {
        const arr = [];
        for (const i of target.q) {
          arr.push(evalAccessKey(opEvals[i.o](i)));
        }
 // easy to debug
                return arr.join("");
      }

     case "void":
       evalAccess(Op(11 /* O.access */ , ".", Op(13 /* O.literal */ , 0 /* L.plain */ , y, 0), Op(13 /* O.literal */ , 0 /* L.plain */ , i, 0)));

      // no break;
           default:
      return;
 // lgtm [js/unreachable-statement]
        }
  }, innerEvalCall = (op, getter) => {
    const left = op.x, {y, i} = Ref(left, 8 /* R.allowOptional */), i2 = evalAccessKey(i);
    let func = y[i2];
    if (isLooselyNull(func) && (y === kOptionalValue || op.y === "?.(")) {
      return getter & 8 /* R.allowOptional */ ? kOptionalValue : void 0;
    }
    const isNew = op.y === "new", noThis = isNew || left.o !== 11 /* O.access */ , args = baseEvalCommaList(op.q);
    typeof func !== "function" ? (isLooselyNull(func) || func != null) && // here is to detect `document.all`
    throwType(DebugCallee(left, func, i2) + " is not a function") : isNew && func.__fn && func.__fn.y.q < "f" && throwType(DebugCallee(left, func.name, i2) + "is not a constructor");
    func === DefaultFunction && (func =  innerFunction_);
    if (left.o === 11 /* O.access */ && typeof left.y === "string" && args.length) {
      const maybeRe = typeof y === "string" ? op.q[0] : left.x;
      const flags = maybeRe.o === 13 /* O.literal */ && maybeRe.q === 1 /* L.regexp */ && typeof maybeRe.x === "string" ? typeof y !== "string" ? "" : args[0].source : null;
      flags === null || flags.includes("g") || flags.includes("y") || (// `/a/.test` | `"".replace(/.*/, ...)`
      maybeRe.x = typeof y === "string" ? args[0] : y);
    }
    return noThis ? isNew ? new func(...args) : func(...args) : isNew ? HasReflect ? Reflect.construct(func, args) : args.length === 0 ? new func : args.length === 1 ? new func(args[0]) : (args.unshift(void 0), 
    new (evalCall.bind.apply(func, args))) : HasReflect ? Reflect.apply(func, noThis ? void 0 : y, args) : evalCall.apply.bind(func)(noThis ? void 0 : y, args);
  }, evalCall = op => innerEvalCall(op, 0 /* R.plain */), evalAccess = op => {
    const {y, i} = Ref(op, 0 /* R.plain */);
    return y[i];
  }, evalComposed = op => {
    var _a;
    var _b;
    if (op.x === "[") {
      return baseEvalCommaList(op.q);
    }
    const Cls = isolate_ !== DefaultIsolate && isolate_.Object || null;
    const arr = op.q;
    (_a = (_b = op).y) !== null && _a !== void 0 || (_b.y = +arr.every(item => item.o === 14 /* O.ref */ ? item.q !== kDots : !item.y && (typeof item.q === "string" || item.q.o === 13 /* O.literal */) && (item.x.o !== 5 /* O.fn */ || item.x.y.q !== "(){" || (typeof item.q === "string" ? item.q : item.q.x) === kProto)));
    if (op.y) {
      const obj = Cls ? new Cls : {};
      for (const item of arr) {
        const rawKey = item.q;
        const key = typeof rawKey === "object" ? rawKey.x + "" : rawKey;
        const value = item.o === 14 /* O.ref */ ? evalRef(item) : item.x.o !== 5 /* O.fn */ ? opEvals[item.x.o](item.x) : FunctionFromOp(item.x, isolate_, locals_, key);
        obj[key] = value;
      }
      return obj;
    }
    const props = objCreate(null);
    let newProto = (Cls !== null && Cls !== void 0 ? Cls : DefaultObject).prototype;
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i], isRef = item.o === 14 /* O.ref */;
      if (isRef && item.q === kDots) {
        i++;
        const src = opEvals[arr[i].o](arr[i]);
        typeof src !== "object" || isLooselyNull(src) || collectEnumerable(src, () => true, props);
        continue;
      }
      const key = typeof item.q === "string" ? item.q : item.q.o === 13 /* O.literal */ ? item.q.x + "" : evalAccessKey(opEvals[item.q.o](item.q));
      const prefix = isRef ? null : item.y;
      const value = isRef ? evalRef(item) : item.x.o !== 5 /* O.fn */ ? opEvals[item.x.o](item.x) : FunctionFromOp(item.x, isolate_, locals_, (prefix ? prefix + " " : "") + AccessToString(key));
      const desc = props[key];
      prefix ? desc && !("value" in desc) ? desc[prefix] = value : props[key] = {
        configurable: true,
        enumerable: true,
        [prefix]: value
      } : key !== kProto || isRef || typeof item.q === "object" && item.q.o !== 13 /* O.literal */ || item.x.o === 5 /* O.fn */ && item.x.y.q === "(){" ? desc && !("value" in desc) ? desc.value = value : props[key] = ValueProperty(value, true, true, true) : newProto = value;
    }
    return objCreate(newProto, props);
  }, evalLiteral = op => {
    switch (op.q) {
     case 0 /* L.plain */ :
      return op.x;

     case 1 /* L.regexp */ :
      return typeof op.x === "object" ? op.x : new RegExp(op.x, op.y);

     case 2 /* L.bigint */ :
      return typeof op.x === "bigint" ? op.x : op.x = DefaultIsolate.BigInt(op.x);

     default:
      return op.x;
 // lgtm [js/unreachable-statement]
        }
  }, evalRef = op => {
    const {y, i} = _resolveVarRef(op, 0 /* R.plain */);
    return y[i];
  }, evalAccessKey = key => {
    if (typeof key === "object" && key !== null) {
      const ref = {
        [key]: 1
      }, names = DefaultObject.getOwnPropertyNames(ref);
      return names.length ? names[0] : DefaultObject.getOwnPropertySymbols(ref)[0] || throwType("Can not parse a valid member key");
    }
    return typeof key === "number" || typeof key === "symbol" ? key : key + "";
  };
  const opEvals = [ evalNever, evalNever, evalNever, evalComma, evalNever, evalFn, evalAssign, evalIfElse, evalBinary, evalUnary, evalCall, evalAccess, evalComposed, evalLiteral, evalRef, evalNever ];
  const FunctionFromOp = (fn, globals, closures, name) => {
    var _a, _b, _c;
    const callable = function() {
      const oldIsolate = isolate_, oldLocals = locals_;
      const type = fn.y.q, block = fn.x.o === 0 /* O.block */ ? fn.x : null, builtins = block === null || block === void 0 ? void 0 : block.y;
      let frame, done = false;
      const newTarget = builtins && builtins[2] >= 0 || type < "f" ? new.target : void 0;
      newTarget && type < "f" && throwType((stdName || "anonymous") + " is not a constructor");
      isolate_ = globals, locals_ = closures.slice(), g_exc = g_exc && g_exc.d < 0 ? g_exc : null;
      const oldLocalsPos = locals_.length;
      const stdArgs = fn.q || builtins && builtins[1] >= 0 ? arguments : void 0;
      type.length > 3 && StackFrameFromComposedOp(fn.y.x, callable, null);
      frame = StackFrame(fn.y.y, builtins && [ builtins[0], builtins[0] >= 0 ? this : void 0, builtins[1], stdArgs, builtins[2], newTarget ], stdName);
      ++stackDepth_;
      try {
        fn.q && evalLet("arg", fn.q, [].slice.call(stdArgs));
        const result = block ? evalBlockBody(Op(0 /* O.block */ , block.q, block.x, null)) : opEvals[fn.x.o](fn.x);
        done = true;
        return block ? result.c === 2 ? result.v : void 0 : result;
      } finally {
        done ? g_exc && g_exc.d > 0 && (g_exc = null) : g_exc && g_exc.d >= stackDepth_ || newException(1);
        stackDepth_--;
        done && locals_[locals_.length - 1] !== frame && console.log("Vim+ found a bug of stack error when calling `" + (stdName || "anonymous") + "(...)`");
        exitFrame(locals_.length - oldLocalsPos);
        isolate_ = oldIsolate, locals_ = oldLocals;
      }
    };
    const stdName = fn.y.q > "f" && ((_a = fn.y.x) === null || _a === void 0 ? void 0 : _a.q) || name;
    DefaultObject.defineProperties(callable, {
      __fn: ValueProperty(fn, false, false, false),
      toString: ValueProperty(FuncToString, true, false, true),
      length: ValueProperty((_c = (_b = fn.q) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0, false, false, true),
      name: ValueProperty(stdName, false, false, true)
    });
    closures = closures.slice();
    return callable;
  };
  //#endregion evaluate
  //#region stringify
    const BinaryStrToT = tokenStr => tokenStr === "+" || tokenStr === "-" ? 4194304 /* T.math1 */ : gTokens[tokenStr].t;
  const doesNeedWrap = (val, op) => val.o >= 10 /* O.call */ ? val.o === 12 /* O.composed */ && val.x === "{" && (op.o === 11 /* O.access */ ? val === op.x : op.o <= 2 /* O.stat */) : val.o < op.o ? val.o !== 0 /* O.block */ : val.o === op.o && (val.o === 3 /* O.comma */ || val.o === 8 /* O.binary */ && BinaryStrToT(val.q) < BinaryStrToT(op.q));
  const ToWrapped = (op, allowed, val) => {
    const s = ToString(val, allowed);
    return s ? !doesNeedWrap(val, op) || s[0] === "(" && s.endsWith(")") ? s : `(${s})` : kUnknown;
  };
  const FnToStr = (op, allowed) => {
    var _a, _b;
    const argsList = op.q ? ToString(Op(3 /* O.comma */ , op.q, 0, 0), allowed && allowed | 72 /* O.assign */) : "";
    const body = ToWrapped(op, allowed && op.x.o === 0 /* O.block */ ? allowed | 1 /* O.block */ : allowed, op.x);
    return (op.y.q < "f" ? "(" : "function " + ((_b = (_a = op.y.x) === null || _a === void 0 ? void 0 : _a.q) !== null && _b !== void 0 ? _b : "") + "(") + (argsList.includes("\n") ? argsList + "\n" : argsList) + (op.y.q !== "=>" ? ") " + body : op.x.o !== 0 /* O.block */ && body.includes("\n") ? ") =>\n  " + replaceAll(body, "\n", "\n  ") : ") => " + body);
  };
  const ToString = (op, allowed) => {
    let arr;
    if (allowed !== 0 && !(1 << op.o & allowed) && op.o < 13 /* O.literal */) {
      return "";
    }
    switch (op.o) {
     case 0 /* O.block */ :
     case 1 /* O.stats */ :
      /* O.block | O.stats: */
      arr = [], allowed && (allowed |= 7 /* O.stat */);
      for (const stat of op.q) {
        let x = ToString(stat, allowed).trimLeft();
        x = x ? stat.o !== 2 /* O.stat */ && stat.o !== 0 /* O.block */ && (stat.o !== 5 /* O.fn */ || stat.y.q < "f") && !x.endsWith(";") ? x + ";" : x : stat.o !== 0 /* O.block */ ? kUnknown + ";" : "{ ... }";
        arr.push(x);
      }
      return arr.length > 0 ? op.o === 1 /* O.stats */ ? arr.join("\n") : "{\n  " + replaceAll(replaceAll(arr.join("\n"), "\n", "\n  "), "\n  \b", "\n") + "\n}" : "{ }";

     case 2 /* O.stat */ :
      /* O.stat: */ {
        const {q: prefix, x: clause, y: child} = op, hasNoCond = !prefix || isVarAction(prefix) || prefix === kLabelled;
        const c = !clause || hasNoCond ? "" : prefix !== "for" ? ToString(clause, allowed) : clause.q.length === 1 ? ToString(clause.q[0], allowed) : (clause.q[0].o === 3 /* O.comma */ && clause.q[0].q.length === 0 ? " ;" : ToString(clause.q[0], allowed) || kUnknown + ";") + " " + (ToString(clause.q[1], allowed) || kUnknown).trim() + "; " + (ToString(clause.q[2], allowed) || kUnknown).trim();
        let x = ToString(child, allowed);
        return prefix === "case" ? `\b${prefix} ${c || kUnknown}:` : prefix === "default" ? "\b" + prefix + ":" : (hasNoCond ? prefix === kLabelled ? replaceAll(clause, " ", ":\n") + ":" : prefix : prefix + (clause ? c ? ` (${c})` : " " + kUnknown : "")) + (x ? (x = x.trimLeft(), 
        prefix ? prefix !== "else if" && prefix !== kLabelled && gTokens[prefix].t !== 8 /* T.prefix */ || child.o === 0 /* O.block */ || !(x.length > 40 || x.includes("\n")) ? x && " " + x : "\n  " + replaceAll(x, "\n", "\n  ") : x) + (child.o === 0 /* O.block */ || !(child.o !== 5 /* O.fn */ || child.y.q < "f") || x.endsWith(";") || child.o === 3 /* O.comma */ && child.q.length === 1 && child.q[0].o === 6 /* O.assign */ && "in of".includes(child.q[0].q) || prefix === kLabelled ? "" : ";") : child.o !== 0 /* O.block */ ? " " + kUnknown + ";" : " { ... }");
      }

     case 3 /* O.comma */ :
      /* O.comma: */
      if (op.q.length === 0) {
        return " ";
      }
      arr = op.q.map(ToWrapped.bind(null, op, allowed));
      for (let i = 0, j = 0, spreading = false; i < arr.length; i++) {
        const s = spreading && op.q[i].o < 9 /* O.unary */ && !arr[i].startsWith("(") ? `(${arr[i]})` : arr[i].trim();
        spreading = s === kDots;
        arr[i] = s + (i >= arr.length - 1 ? "" : spreading ? " " : (j = s.charAt(s.length - 2) === "\n" ? 1 : j + 1, 
        j % 5 == 0 ? ",\n  " : ", "));
      }
      return arr.join("");

     case 4 /* O.pair */ :
      /* O.pair: */
      return (op.y ? op.y + " " : "") + (typeof op.q === "string" ? op.q : op.q.o === 13 /* O.literal */ ? op.q.q === 2 /* L.bigint */ ? op.q.x + "n" : typeof op.q.x === "string" ? JSON.stringify(op.q.x) : op.q.x + "" : `[${ToWrapped(Op(3 /* O.comma */ , [], 0, 0), allowed, op.q)}]`) + (op.x.o !== 5 /* O.fn */ || op.x.y.q !== "(){" ? ": " + (ToString(op.x, allowed) || kUnknown) : " " + FnToStr(op.x, allowed && allowed | 32 /* O.fn */));

     case 5 /* O.fn */ :
      return op.y.q === "(){" ? ToString(typeof op.y.x === "string" ? Op(4 /* O.pair */ , op.y.x, op, null) : Op(4 /* O.pair */ , op.y.x.q, op, op.y.x.y), allowed && allowed | 16 /* O.pair */) : FnToStr(op, allowed);

     case 6 /* O.assign */ :
      /* O.assign: */ return `${ToString(op.y, allowed) || kUnknown} ${op.q} ${op.x.o === 5 /* O.fn */ ? ToString(op.x, allowed) : ToWrapped(op, allowed, op.x)}`;

     case 7 /* O.ifElse */ :
      /* O.ifElse: */ return ToWrapped(op, allowed, op.q) + " ? " + ToWrapped(Op(5 /* O.fn */ , 0, 0, 0), allowed, op.x) + " : " + ToWrapped(Op(5 /* O.fn */ , 0, 0, 0), allowed, op.y);

     case 8 /* O.binary */ :
      /* O.binary: */ return `${ToWrapped(op, allowed, op.x)} ${op.q} ${ToWrapped(op, allowed, op.y)}`;

     case 9 /* O.unary */ :
      /* O.unary: */
      return op.y ? (ToString(op.x, allowed) || kUnknown) + op.q : op.q === "`" ? op.x.q.map(i => {
        var _a;
        const literal = i.o === 13 /* O.literal */ && i.q > 3 && i.q < 8 ? i : null;
        return literal ? (_a = literal.y) !== null && _a !== void 0 ? _a : replaceAll(JSON.stringify(literal.x).slice(1, -1), "`", "\\`") : ToString(i, allowed && 2816 /* O.access */ | allowed);
      }).join("") : op.q + (op.q >= "a" && op.q < "zz" ? " " : "") + (ToString(op.x, allowed) || kUnknown);

     case 10 /* O.call */ :
      /* O.call: */ {
        const args = op.q.length > 0 ? ToString(Op(3 /* O.comma */ , op.q, 0, 0), allowed) || "..." : "";
        return (op.y === "new" ? "new " : "") + ToWrapped(op, allowed, op.x) + (op.y === "?.(" ? op.y : "(") + args + ")";
      }

     case 11 /* O.access */ :
      /* O.access: */
      return (ToWrapped(op, allowed, op.x) || kUnknown) + (op.q.endsWith(".") ? op.q + op.y : op.q + (typeof op.y === "object" ? ToString(op.y, allowed) || kUnknown : JSON.stringify(op.y)) + "]");

     case 12 /* O.composed */ :
      /* O.composed: */
      return op.q.length == 0 ? op.x === "{" ? "{}" : "[]" : op.x + " " + ToString(Op(3 /* O.comma */ , op.q, 0, 0), allowed && 24 /* O.comma */ | allowed) + (op.x === "{" ? " }" : " ]");

     case 13 /* O.literal */ :
      /* O.literal: */
      return typeof op.x === "string" ? op.q === 0 /* L.plain */ ? JSON.stringify(op.x) : op.q === 1 /* L.regexp */ ? `/${op.x}/${op.y}` : op.x + "n" : op.q === 0 /* L.plain */ ? op.x + "" : op.q === 1 /* L.regexp */ ? `/${op.x.source}/${op.x.flags}` : op.q === 2 /* L.bigint */ ? op.x + "n" : " ";

     case 14 /* O.ref */ :
      /* O.ref: */
      return op.q;

     default:
      return "(unknown)";
 // lgtm [js/unreachable-statement]
        }
  };
  const AccessToString = (access, toRead) => {
    typeof access === "object" && access !== null && (access = evalAccessKey(access));
    return typeof access === "symbol" ? `[${String(access).slice(7, -1)}]` : toRead && typeof access === "string" ? access.length <= 16 ? JSON.stringify(access) : JSON.stringify(access.slice(0, 16)) + "..." : "" + access;
  };
  const FuncToString = function() {
    const func = this, priv_fn = typeof func === "function" && func.__fn;
    return priv_fn ? replaceAll(ToString(priv_fn, 0), "\r", "\n") : DefaultFunction.prototype.toString.apply(func, arguments);
  };
  const DebugCallee = (funcOp, funcInst, access) => {
    const allowed = 3072 /* O.access */;
    if (funcOp.o !== 11 /* O.access */) {
      return ToString(funcOp, allowed) || !isLooselyNull(funcInst) && funcInst + "" || "(anonymous)";
    }
    const y = ToString(funcOp.x, allowed) || kUnknown;
    const i = typeof funcOp.y !== "object" ? funcOp.y + "" : ToString(funcOp.y, allowed) || AccessToString(access, 1);
    return y + funcOp.q + i + (funcOp.q.endsWith(".") ? "" : "]");
  };
  //#endregion stringify
  //#region exported
    const parseArgsAndEnv = (arr, globals) => {
    let i = 0;
    while (i < arr.length && typeof arr[i] === "string") {
      i++;
    }
    i < arr.length && arr[i] && typeof arr[i] === "object" && (globals = arr[i]);
    return {
      globals,
      body: i > 0 ? arr[i - 1] : "",
      args: [].slice.call(arr, 0, i - 1)
    };
  };
  const baseFunctionCtor = ({body, globals, args}, inNewFunc) => {
    const tokens = splitTokens(body.replace(/\r\n?/g, "\n"));
    let tree = parseTree(tokens, inNewFunc);
    const statsNum = tree.o === 0 /* O.block */ ? tree.q.length : 1;
    if (statsNum > 0) {
      const serialized = ToString(tree, 0), multipleLines = statsNum > 1 || serialized.includes("\n");
      console.log("Vim+: parsed a function:" + (!multipleLines && serialized.length > 50 ? "\n " : ""), replaceAll(statsNum > 1 ? serialized.slice(1, -1).trimRight() : multipleLines ? "\n  " + replaceAll(serialized, "\n", "\n  ") : serialized, "\r", "\n"));
    }
        resetRe_();
    if (statsNum === 0 && !inNewFunc) {
      return () => {};
    }
    if (!inNewFunc && tree.o === 0 /* O.block */) {
      let last, par = tree;
      while (last = par.q[par.q.length - 1], last.o === 0 /* O.block */) {
        par = last;
      }
      last.o > 2 /* O.stat */ && last.o !== 5 /* O.fn */ && (par.q[par.q.length - 1] = Op(2 /* O.stat */ , "return", null, last));
    }
    inNewFunc = inNewFunc !== false && (tree.o === 0 /* O.block */ || inNewFunc);
    const op = Op(5 /* O.fn */ , args.length ? args.map(i => Op(14 /* O.ref */ , i, 0, 0)) : null, tree, Op(15 /* O.fnDesc */ , inNewFunc ? "fn" : "=>", inNewFunc ? Op(14 /* O.ref */ , "anonymous", 0, 0) : null, null));
        getEscapeAnalyser()(op);
    return FunctionFromOp(op, globals !== null && globals !== void 0 ? globals : isolate_, locals_, "anonymous");
  };
  const innerFunction_ = function Function() {
    return baseFunctionCtor(parseArgsAndEnv(arguments, null), true);
  };
  const innerEval_ = function() {
    const func = baseFunctionCtor(parseArgsAndEnv(arguments, null), false);
    return func();
  };
  /**
     * (...args: [...funcArguments: string[], functionBody: string
     *     , globals?: Isolate | null | undefined, locals?: VarDict | VarDict[] | null | undefined]) => Result
     */  const outerEval_ = function() {
    const func = baseFunctionCtor(parseArgsAndEnv(arguments, DefaultIsolate), null);
    return func();
  };
  const exposeStack = stackArray => stackArray.slice().reverse().map(frame => {
    var _a;
    return {
      bindings: frame.o,
      vars: frame.x,
      name: (_a = frame.y) !== null && _a !== void 0 ? _a : ""
    };
  });
  {
    const browser_ = DefaultIsolate.chrome || DefaultIsolate.browser;
    ((_c = browser_ === null || browser_ === void 0 ? void 0 : browser_.runtime) === null || _c === void 0 ? void 0 : _c.connect) && typeof VApi === "object" && VApi ? VApi.v = outerEval_ : DefaultIsolate.__VimiumPlus_eval__ = outerEval_;
  }
  outerEval_.getStack = exc => exc && !g_exc ? null : {
    stack: exposeStack(exc ? g_exc.l : locals_),
    depth: exc ? g_exc.d : stackDepth_,
    globals: exc ? g_exc.g : isolate_
  };
  outerEval_.tryEval = function(_functionBody) {
    try {
      const result = outerEval_(...arguments);
      return {
        ok: 2,
        result
      };
    } catch (error) {
      const native = false /* Build.MV3 */;
      console.log("Vim+: catch an eval error:", error);
      return {
        ok: 0,
        result: error,
        stack: native ? null : exposeStack(g_exc ? g_exc.l : []),
        type: native ? "native" : "eval",
        globals: native ? null : g_exc ? g_exc.g : isolate_
      };
    }
  };
  kOpNames.length !== 16 && alert("Assert error: wrong fields in kOpNames");
  //#endregion exported
})();
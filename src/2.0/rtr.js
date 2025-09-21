"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  RTR: () => RTR
});
module.exports = __toCommonJS(main_exports);

// src/ast.ts
function tokenize(code) {
  const tokens = [];
  let i = 0;
  const keywords = /* @__PURE__ */ new Set(["event", "if", "elif", "else", "while", "repeat", "for"]);
  while (i < code.length) {
    const char = code[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (char === '"') {
      let value = "";
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === "\\" && i + 1 < code.length) {
          i++;
          switch (code[i]) {
            case "n":
              value += "\n";
              break;
            case "t":
              value += "	";
              break;
            case "r":
              value += "\r";
              break;
            case "\\":
              value += "\\";
              break;
            case '"':
              value += '"';
              break;
            default:
              value += code[i];
              break;
          }
        } else {
          value += code[i];
        }
        i++;
      }
      i++;
      tokens.push({ type: "string", value });
      continue;
    }
    if (/\d/.test(char)) {
      let value = "";
      while (i < code.length && /[\d.]/.test(code[i])) {
        value += code[i];
        i++;
      }
      tokens.push({ type: "number", value: parseFloat(value) });
      continue;
    }
    if (i + 1 < code.length) {
      const twoChar = code.slice(i, i + 2);
      if (["==", "!=", "<=", ">=", "+=", "-=", "*=", "/="].includes(twoChar)) {
        tokens.push({ type: "operator", value: twoChar });
        i += 2;
        continue;
      }
    }
    if ("+-*/=<>!(){}[];,.~".includes(char)) {
      tokens.push({ type: "operator", value: char });
      i++;
      continue;
    }
    if (/[a-zA-Z_]/.test(char)) {
      let value = "";
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
        value += code[i];
        i++;
      }
      if (keywords.has(value)) tokens.push({ type: "keyword", value });
      else tokens.push({ type: "identifier", value });
      continue;
    }
    console.warn(`Unknown character: ${char} at position ${i}`);
    i++;
  }
  return tokens;
}
var Parser = class {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }
  peek() {
    return this.tokens[this.current];
  }
  advance() {
    if (this.current < this.tokens.length) this.current++;
    return this.tokens[this.current - 1];
  }
  match(...values) {
    for (const value of values) {
      if (this.checkOperator(value)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  check(value) {
    var _a;
    if (this.isAtEnd()) return false;
    return ((_a = this.peek()) == null ? void 0 : _a.value) === value;
  }
  checkOperator(value) {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return (token == null ? void 0 : token.type) === "operator" && (token == null ? void 0 : token.value) === value;
  }
  checkKeyword(value) {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    return (token == null ? void 0 : token.type) === "keyword" && (token == null ? void 0 : token.value) === value;
  }
  matchOperator(value) {
    if (this.checkOperator(value)) {
      this.advance();
      return true;
    }
    return false;
  }
  isAtEnd() {
    return this.current >= this.tokens.length;
  }
  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) statements.push(stmt);
    }
    return { type: "program", statements };
  }
  statement() {
    if (this.checkKeyword("event")) return this.eventStatement();
    if (this.checkKeyword("if")) return this.ifStatement();
    if (this.checkKeyword("while")) return this.whileStatement();
    if (this.checkKeyword("repeat")) return this.repeatStatement();
    if (this.checkKeyword("for")) return this.forStatement();
    return this.expressionStatement();
  }
  eventStatement() {
    this.advance();
    if (!this.matchOperator("(")) throw new Error(`Expected '(' after event`);
    const eventType = this.advance();
    if (!this.matchOperator(")")) throw new Error(`Expected ')' after event name`);
    const body = this.blockStatement();
    return {
      type: "event",
      eventType: eventType.value,
      body
    };
  }
  ifStatement() {
    this.advance();
    if (!this.matchOperator("(")) throw new Error(`Expected '(' after if/elif`);
    const condition = this.expression();
    if (!this.matchOperator(")")) throw new Error(`Expected ')' after if condition`);
    const thenBranch = this.blockStatement();
    let elseBranch = null;
    if (this.checkKeyword("elif") || this.checkKeyword("else")) {
      if (this.checkKeyword("elif")) {
        elseBranch = this.ifStatement();
      } else {
        this.advance();
        elseBranch = this.blockStatement();
      }
    }
    return {
      type: "if",
      condition,
      thenBranch,
      elseBranch
    };
  }
  whileStatement() {
    this.advance();
    if (!this.matchOperator("(")) throw new Error(`Expected '(' after while`);
    const condition = this.expression();
    if (!this.matchOperator(")")) throw new Error(`Expected ')' after while condition`);
    const body = this.blockStatement();
    return {
      type: "while",
      condition,
      body
    };
  }
  repeatStatement() {
    this.advance();
    if (!this.matchOperator("(")) throw new Error(`Expected '(' after repeat`);
    const amount = this.expression();
    if (!this.matchOperator(")")) throw new Error(`Expected ')' after repeat amount`);
    const body = this.blockStatement();
    return {
      type: "repeat",
      amount,
      body
    };
  }
  forStatement() {
    this.advance();
    if (!this.matchOperator("(")) throw new Error(`Expected '(' after for`);
    const variable = this.primary();
    if (variable.type !== "identifier")
      throw new Error(`Expected variable as first argument`);
    if (!this.matchOperator(",")) throw new Error(`Expected ',' after for variable`);
    const array = this.expression();
    if (!this.matchOperator(")")) throw new Error(`Expected ')' after for array`);
    const body = this.blockStatement();
    return {
      type: "for",
      variable,
      array,
      body
    };
  }
  blockStatement() {
    if (!this.matchOperator("{")) throw new Error(`Expected '{' to start block`);
    const statements = [];
    while (!this.checkOperator("}") && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) statements.push(stmt);
    }
    if (!this.matchOperator("}")) throw new Error(`Expected '}' to end block`);
    return { type: "block", statements };
  }
  expressionStatement() {
    const expr = this.expression();
    if (this.checkOperator(";")) this.advance();
    return { type: "expressionStatement", expression: expr };
  }
  expression() {
    return this.assignment();
  }
  assignment() {
    const expr = this.logicalOr();
    if (this.match("=", "+=", "-=", "*=", "/=")) {
      const operator = this.tokens[this.current - 1];
      const value = this.assignment();
      return {
        type: "assignment",
        operator: operator.value,
        left: expr,
        right: value
      };
    }
    return expr;
  }
  logicalOr() {
    return this.logicalAnd();
  }
  logicalAnd() {
    return this.equality();
  }
  equality() {
    let expr = this.comparison();
    while (this.match("==", "!=")) {
      const operator = this.tokens[this.current - 1];
      const right = this.comparison();
      expr = {
        type: "binary",
        operator: operator.value,
        left: expr,
        right
      };
    }
    return expr;
  }
  comparison() {
    let expr = this.term();
    while (this.match("<", ">", "<=", ">=")) {
      const operator = this.tokens[this.current - 1];
      const right = this.term();
      expr = {
        type: "binary",
        operator: operator.value,
        left: expr,
        right
      };
    }
    return expr;
  }
  term() {
    let expr = this.factor();
    while (this.match("+", "-")) {
      const operator = this.tokens[this.current - 1];
      const right = this.factor();
      expr = {
        type: "binary",
        operator: operator.value,
        left: expr,
        right
      };
    }
    return expr;
  }
  factor() {
    let expr = this.unary();
    while (this.match("*", "/")) {
      const operator = this.tokens[this.current - 1];
      const right = this.unary();
      expr = {
        type: "binary",
        operator: operator.value,
        left: expr,
        right
      };
    }
    return expr;
  }
  unary() {
    if (this.match("!", "-", "+")) {
      const operator = this.tokens[this.current - 1];
      const right = this.unary();
      return {
        type: "unary",
        operator: operator.value,
        operand: right
      };
    }
    return this.call();
  }
  call() {
    let expr = this.primary();
    while (true) {
      if (this.matchOperator("(")) {
        const args = [];
        if (!this.checkOperator(")")) {
          do
            args.push(this.expression());
          while (this.matchOperator(","));
        }
        if (!this.matchOperator(")")) throw new Error(`Expected ')' after function arguments`);
        expr = {
          type: "call",
          callee: expr,
          arguments: args
        };
      } else if (this.matchOperator(".")) {
        const property = this.advance();
        if (property.type !== "identifier") throw new Error(`Expected property name after '.', got: ${JSON.stringify(property)}`);
        expr = {
          type: "memberAccess",
          object: expr,
          property: property.value
        };
      } else {
        break;
      }
    }
    return expr;
  }
  primary() {
    var _a, _b;
    if (this.isAtEnd()) throw "Unexpected end of input";
    const token = this.peek();
    if ((token == null ? void 0 : token.type) === "number") {
      return { type: "literal", value: this.advance().value };
    }
    if ((token == null ? void 0 : token.type) === "string") {
      return { type: "literal", value: this.advance().value };
    }
    if ((token == null ? void 0 : token.type) === "identifier") {
      const name = this.advance().value;
      if (name === "null") return { type: "literal", value: null };
      return { type: "identifier", name };
    }
    if (this.checkOperator("(")) {
      const checkpoint = this.current;
      this.advance();
      const params = [];
      let isFunctionDef = true;
      if (((_a = this.peek()) == null ? void 0 : _a.type) === "identifier") {
        do {
          const paramToken = this.peek();
          if ((paramToken == null ? void 0 : paramToken.type) === "identifier") {
            params.push(this.advance().value);
          } else {
            isFunctionDef = false;
            break;
          }
        } while (this.checkOperator(","));
      }
      if (isFunctionDef && this.checkOperator(")") && ((_b = this.tokens[this.current + 1]) == null ? void 0 : _b.value) === "~") {
        this.advance();
        this.advance();
        if (!this.matchOperator("{")) {
          throw new Error(`Expected '{' after '~' in function definition`);
        }
        const body = [];
        while (!this.checkOperator("}") && !this.isAtEnd()) {
          const stmt = this.statement();
          if (stmt) body.push(stmt);
        }
        if (!this.matchOperator("}")) {
          throw new Error(`Expected '}' to end function body`);
        }
        return {
          type: "function",
          parameters: params,
          body: { type: "block", statements: body }
        };
      } else {
        this.current = checkpoint;
        this.advance();
        const expr = this.expression();
        if (!this.matchOperator(")")) {
          throw new Error(`Expected ')' after expression, got: ${JSON.stringify(this.peek())}`);
        }
        return expr;
      }
    }
    throw new Error(`Unexpected token in primary: ${JSON.stringify(token)} at position ${this.current}`);
  }
};
function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}

// src/main.ts
var RTRScope = class {
  constructor(platform) {
    this.layers = [{
      platform,
      rtr: { version: "2.0", environment: { type: "typescript / javascript" } },
      mouse: { x: 0, y: 0, down: false, clicked: false, moved: false },
      keysdown: [],
      "true": true,
      "false": false,
      // @ts-ignore
      log: (...args) => console.log(...args),
      // @ts-ignore
      min: (...args) => Math.min(...args),
      // @ts-ignore
      max: (...args) => Math.max(...args),
      // @ts-ignore
      abs: (x) => Math.abs(x),
      // @ts-ignore
      round: (x) => Math.round(x),
      // @ts-ignore
      floor: (x) => Math.floor(x),
      // @ts-ignore
      ceil: (x) => Math.ceil(x),
      // @ts-ignore
      sqrt: (x) => Math.sqrt(x),
      // @ts-ignore
      sin: (x) => Math.sin(x),
      // @ts-ignore
      cos: (x) => Math.cos(x),
      // @ts-ignore
      tan: (x) => Math.tan(x),
      // @ts-ignore
      asin: (x) => Math.asin(x),
      // @ts-ignore
      acos: (x) => Math.acos(x),
      // @ts-ignore
      atan: (x) => Math.atan(x),
      // @ts-ignore
      join: (...arr) => arr.join(""),
      // @ts-ignore
      split: (str, sep) => str.split(sep),
      // @ts-ignore
      keys: (obj) => Object.keys(obj),
      // @ts-ignore
      values: (obj) => Object.values(obj),
      // @ts-ignore
      length: (obj) => obj.length,
      // @ts-ignore
      item: (obj, index) => obj[index],
      // @ts-ignore
      typeof: (x) => typeof x,
      // @ts-ignore
      range: (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i),
      // @ts-ignore
      input: (msg) => prompt(msg),
      // @ts-ignore
      chr: (x) => String.fromCharCode(x),
      // @ts-ignore
      ord: (x) => x.charCodeAt(0),
      // @ts-ignore
      not: (x) => !x,
      // @ts-ignore
      set: (obj, key, val) => (obj[key] = val, obj),
      obj: () => ({}),
      // @ts-ignore
      del: (obj, key) => (delete obj[key], obj),
      // @ts-ignore
      has: (obj, key) => obj.hasOwnProperty(key),
      // @ts-ignore
      all: (...args) => args.every(Boolean),
      // @ts-ignore
      any: (...args) => args.some(Boolean),
      // @ts-ignore
      return: (val) => this.set("@return_val", val),
      // @ts-ignore
      toNum: (x) => x | 0,
      // @ts-ignore
      toStr: (x) => "" + x
    }];
  }
  addLayer(layer = {}) {
    this.layers.push(layer);
  }
  popLayer() {
    if (this.layers.length < 1) throw "no layers to pop";
    return this.layers.pop();
  }
  get(name) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const element = this.layers[i];
      if (element[name] !== void 0)
        return element[name];
    }
    return null;
  }
  set(name, value) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      if (layer[name] !== void 0) {
        layer[name] = value;
        return;
      }
    }
    const top = this.layers[this.layers.length - 1];
    top[name] = value;
  }
  has(name) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const element = this.layers[i];
      if (element[name] !== void 0)
        return true;
    }
    return false;
  }
};
var RTR = class {
  //"%": (a, b) => ((a % b) + b) % b,
  //"^": (a, b) => a ** b,
  //"?": (a, b, c) => a ? b : c,
  constructor(platform, code) {
    this.unaryOperators = {
      "!": (operand) => !operand,
      "-": (operand) => -operand,
      "+": (operand) => +operand
    };
    this.binaryOperators = {
      "==": (a, b) => a === b,
      "!=": (a, b) => a !== b,
      ">=": (a, b) => a >= b,
      "<=": (a, b) => a <= b,
      ">": (a, b) => a > b,
      "<": (a, b) => a < b,
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => a / b
    };
    if (typeof code === "string")
      code = parse(tokenize(code));
    this.ast = code;
    this.scope = new RTRScope(platform);
    this.runEvent("onload");
  }
  runEvent(name, scope = {}) {
    const events = this.ast.statements.filter((e) => e.eventType === name);
    if (!events) return;
    const event = events[0];
    if (events.length > 1) console.warn(`Duplicate ${event.eventType} event`);
    this.runBlock(event.body, scope);
  }
  runBlock(node, scopeLayer = {}) {
    var _a;
    this.scope.addLayer(scopeLayer);
    let out;
    for (let i = 0; i < node.statements.length; i++) {
      const element = node.statements[i];
      this.runStatement(element);
      if (this.scope.has("@return_val"))
        break;
    }
    return (_a = this.scope.popLayer()["@return_val"]) != null ? _a : null;
  }
  runStatement(node) {
    var _a;
    switch (node.type) {
      case "expressionStatement":
        this.runExpression(node.expression);
        break;
      case "if": {
        if (this.runExpression(node.condition))
          return this.runBlock(node.thenBranch);
        else if (((_a = node.elseBranch) == null ? void 0 : _a.type) === "block")
          return this.runBlock(node.elseBranch);
        else if (node.elseBranch)
          return this.runStatement(node.elseBranch);
        return null;
      }
      case "while": {
        while (this.runExpression(node.condition)) {
          const out = this.runBlock(node.body);
          if (out)
            return out;
        }
        return null;
      }
      case "repeat": {
        const amount = this.runExpression(node.amount);
        for (let index = 0; index < amount; index++) {
          const out = this.runBlock(node.body);
          if (out)
            return out;
        }
        return null;
      }
      case "for": {
        const array = this.runExpression(node.array);
        const varName = node.variable.name;
        const scope = {};
        for (let i = 0; i < array.length; i++) {
          const element = array[i];
          scope[varName] = element;
          const out = this.runBlock(
            node.body,
            scope
          );
          if (out)
            return out;
        }
        return null;
      }
      default:
        throw new Error(`Cannot run statement of type ${node.type}`);
    }
  }
  runExpression(node) {
    var _a;
    switch (node.type) {
      case "call": {
        const args = node.arguments.map((a) => this.runExpression(a));
        const callee = node.callee;
        let func;
        let parent = null;
        if (callee.type == "memberAccess") {
          parent = this.runExpression(callee.object);
          func = parent[callee.property];
        } else {
          func = this.runExpression(callee);
        }
        if (func["@rwlType"] === "func") {
          const layer = Object.fromEntries(
            func["parameters"].map((p, i) => {
              var _a2;
              return [p, (_a2 = args[i]) != null ? _a2 : null];
            })
          );
          if (parent != null)
            layer["this"] = parent;
          this.scope.addLayer(layer);
          const out = this.runBlock(func.body);
          this.scope.popLayer();
          return out;
        }
        if (!(func instanceof Function))
          throw new Error(`cannot call non-function`);
        return (_a = func(...args)) != null ? _a : null;
      }
      case "literal":
        return node.value;
      case "identifier":
        return this.scope.get(node.name);
      case "binary": {
        const left = this.runExpression(node.left);
        const right = this.runExpression(node.right);
        const run = this.binaryOperators[node.operator];
        return run(left, right);
      }
      case "unary": {
        const operand = this.runExpression(node.operand);
        const run = this.unaryOperators[node.operator];
        return run(operand);
      }
      case "function": {
        return this.createFunction(
          node.parameters,
          node.body
        );
      }
      case "assignment": {
        const left = node.left;
        const right = this.runExpression(node.right);
        let assignVal = right;
        switch (node.operator) {
          case "+=":
            assignVal = this.runExpression(left) + right;
            break;
          case "-=":
            assignVal = this.runExpression(left) - right;
            break;
          case "*=":
            assignVal = this.runExpression(left) * right;
            break;
          case "/=":
            assignVal = this.runExpression(left) / right;
            break;
        }
        if (left.type == "identifier")
          this.scope.set(left.name, assignVal);
        else if (left.type == "memberAccess") {
          const obj = this.runExpression(left.object);
          obj[left.property] = assignVal;
        }
        return right;
      }
      case "memberAccess": {
        const obj = this.runExpression(node.object);
        return obj[node.property];
      }
      default:
        console.error(node);
        throw new Error(`Cannot run expression of type ${node.type}`);
    }
  }
  createFunction(parameters, body) {
    return { "@rwlType": "func", parameters, body };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RTR
});

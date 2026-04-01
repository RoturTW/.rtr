// License: MPL-2.0
// This Source Code is subject to the terms of the Mozilla Public License, v2.0,
// If a copy of the MPL was not distributed with this file,
// Then you can obtain one at https://mozilla.org/MPL/2.0/

const RE_NUMBER = /^-?\d+(\.\d+)?$/;
const RE_SIMPLE_WORD = /^[^.,()\-+\/*%|&><=!~\s]+$/;

function parseData(line) {
  while (line.startsWith("(") && line.endsWith(")")) line = line.slice(1, -1);

  if ((line.startsWith("[") && line.endsWith("]")) || (line.startsWith("{") && line.endsWith("}"))) {
    try {
      return { type: line.startsWith("[") ? "array" : "object", data: JSON.parse(line) };
    } catch {
      return { type: "object", data: {} };
    }
  } else {
    if (RE_NUMBER.test(line)) return { type: "number", data: parseFloat(line) };
    else if (line.endsWith(")") && line.indexOf("(") > 0) {
      let open = line.indexOf("(");
      let func = line.substring(0, open);
      let data = parseData(line.substring(open + 1, line.length - 1));
      let func_dat = { cmd: func, type: "func", data: data };
      if (func.indexOf(":") !== -1) {
        let parts = func.split(":");
        func_dat["class"] = parts[0];
        func_dat["cmd"] = parts[1];
      }
      return func_dat;
    } else if (line.indexOf(" ") === -1) {
      if (line === "true" || line === "false") return { type: "boolean", data: line === "true" };
      else if (line.startsWith("\"") && line.endsWith("\"")) return { type: "string", data: line.slice(1, -1) };
      else if (line === "null") return { type: "null", data: null };
      else if (RE_NUMBER.test(line)) return { type: "number", data: parseFloat(line) };
      else if (RE_SIMPLE_WORD.test(line)) return { type: "none", data: line };
      else if (line.includes(".")) return { type: "property", data: line.split(".").map((x, i) => i === 0 ? parseData(x) : x) };
    }
  }

  let out = [], buf = "", depth = 0, quotes = false;
  for (let ch of line) {
    if (ch === "\"") { quotes = !quotes; buf += ch; continue; }
    if (!quotes) {
      if ("([{".includes(ch)) { depth++; buf += ch; continue; }
      if (")]}".includes(ch)) { depth--; buf += ch; continue; }
      if (depth === 0 && "+-*/^%&|=><!~".includes(ch)) {
        if (buf.trim()) out.push(parseData(buf.trim()));
        out.push(ch); buf = "";
        continue;
      }
    }
    buf += ch;
  }
  if (buf.trim()) out.push(parseData(buf.trim()));

  const ops = ["==", "!=", ">", "<", "+", "-", "*", "/", "^", "%", "&&", "||"];
  for (let i = 0; i < out.length; i++) {
    if (typeof out[i] === "string" && ops.includes(out[i])) {
      let left = out[i - 1], right = out[i + 1];
      out[i - 1] = { type: "operation", op: out[i], data: [left, right] };
      out.splice(i, 2);
      i--;
    }
  }
  return out.length === 1 ? out[0] : out;
}

function parseBlock(lines, i) {
  let block = [];
  i++;
  for (; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith("}")) break;
    const regex = /\(([^()]+)\)~{/;
    if (regex.test(line)) {
      while (regex.test(line)) {
        let [nested, newIndex] = parseBlock(lines, i);
        let line_data = line.slice(line.indexOf("(") + 1, line.lastIndexOf(")")).split(",").map(x => parseData(x.trim()));
        line = line.replace(regex, JSON.stringify({ type: "define", data: line_data, content: nested }));
        i = newIndex - 1;
      }
    } else if (line.endsWith("{")) {
      let pre = line.slice(0, -1).trim();
      let open = pre.indexOf("(");
      let cmd = pre.substring(0, open);
      let line_data = parseData(pre.substring(open + 1, pre.length - 1));
      let [nested, newIndex] = parseBlock(lines, i);
      block.push({ cmd, type: "func", data: line_data, content: nested });
      i = newIndex - 1;
      continue;
    }
    if (line.includes("=")) {
      let eq = line.indexOf("="),
        variable = line.slice(0, eq).trim(),
        rest = line.slice(eq);
      let opList = ["+=", "-=", "*=", "/=", "^=", "%="];
      let cmd = opList.some(op => rest.startsWith(op)) ? rest.slice(0, 2) : "=";
      rest = rest.startsWith(cmd) ? rest.slice(cmd.length).trim() : rest.slice(1).trim();
      line = { cmd, type: "func", variable, data: parseData(rest) };
    } else line = parseData(line);
    block.push(line);
  }
  return [block, i + 1];
}

class RTR {
  constructor(platform, code) {
    code = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/;\s*/g, "\n")

    this.vars = [{
      window: {
        platform: Object.assign({
          name: "unknown",
          version: "unknown"
        }, platform),
        keysdown: [],
        rtr: {
          version: "1.4",
          environment: { type: "javascript", }
        },
        mouse: {
          x: 0,
          y: 0,
          down: false,
          clicked: false,
          moved: false
        },
        ast: this.compileRTR(code)
      }
    }];

    this.operators = {
      "==": (a, b) => a === b,
      "!=": (a, b) => a !== b,
      ">": (a, b) => a > b,
      "<": (a, b) => a < b,
      "&&": (a, b) => a && b,
      "||": (a, b) => a || b,
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => a / b,
      "%": (a, b) => ((a % b) + b) % b,
      "^": (a, b) => Math.pow(a, b)
    };

    this.runEvent("onload");
  }

  removeWhitespace(s) {
    let inQuote = false, out = "";
    for (let i = 0; i < s.length; i++) {
      let c = s[i];
      if (c === '"') inQuote = !inQuote;
      if (inQuote || c !== " ") out += c;
    }
    return out;
  }

  tokeniseLine(line) {
    let tokens = [], current = "", depth = 0;
    for (let i = 0; i < line.length; i++) {
      let ch = line[i];
      if (ch === "(") {
        if (!depth && current) (tokens.push(current), current = "");
        current += ch;
        depth++;
      } else if (ch === ")") {
        current += ch;
        depth--;
      } else if (!/[a-zA-Z0-9_:]/.test(ch) && !depth) {
        if (current) (tokens.push(current), current = "");
        tokens.push(ch);
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  compileRTR(rtr) {
    rtr = this.removeWhitespace(rtr)
      .replace(/{(\w)/gm, "{\n$1")
      .replace(/[\)}\]]}/gm, ")\n}")
      .replace(/([{,])\n(")/gm, "$1$2")
      .replace(/,\n/gm, ",")
      .replace(/,([}\]])/gm, "$1")
      .replace(/([\)}])(\w)/gm, "$1\n$2")
      .replace(/(\w)}/gm, "$1\n}")

      console.log(rtr);

    const result = { events: [], style: {}, all: {} };
    const lines = rtr.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const tokens = this.tokeniseLine(line);
      if (tokens[2] === "{") {
        const [block, newIndex] = parseBlock(lines, i);
        if (tokens[0] === "event") {
          const ev = tokens[1].slice(1, -1);
          result.events.push(ev);
          const parts = ev.split(" ");
          if (parts.length === 2) {
            result.all[parts[0]] = result.all[parts[0]] || {};
            result.all[parts[0]][parts[1]] = { content: block };
          } else {
            result.all[parts[0]] = { content: block };
          }
        } else if (tokens[0] === "style") {
          const parsed = parseData(line.slice(0, -1));
          let names = Array.isArray(parsed?.data) ? parsed.data : [parsed.data];
          names = names.map(v => v.data);
          const styleKey = names[0],
            subKey = names[1] || "default";
          const output = result.style[styleKey] || { default: {} };
          for (const val of block) {
            if (val.cmd === "=") {
              output[subKey] = output[subKey] || {};
              output[subKey][val.variable] = val.data.data;
            }
          }
          result.style[styleKey] = output;
        }
        i = newIndex - 1;
      }
    }
    return result;
  }

  hasEvent(event) {
    return typeof this.vars[0].window.ast.all[event] !== "undefined";
  }

  runEvent(event) {
    if (!this.hasEvent(event)) return;
    this.call(this.vars[0].window.ast.all[event].content);
  }

  openScope() {
    this.vars.push({});
  }

  closeScope() {
    this.vars.pop();
  }

  getVar(variable) {
    const scope = this.vars;
    for (let i = scope.length - 1; i >= 0; i--) {
      if (scope[i][variable] !== undefined) return scope[i][variable];
    }
    return { type: "number", data: 0 };
  }

  setVar(variable, val, assignment) {
    const scope = this.vars[this.vars.length - 1];
    if (variable.includes(".")) {
      let parts = variable.split(".");
      let obj = this.getVar(parts[0]);
      for (let i = 1; i < parts.length - 1; i++) obj = obj[parts[i]];

      obj[parts[parts.length - 1]] = val;
      return;
    }
    switch (assignment) {
      case "=": scope[variable] = val; break;
      case "+=": scope[variable] += +val; break;
      case "-=": scope[variable] -= +val; break;
      case "*=": scope[variable] *= +val; break;
      case "/=": scope[variable] /= +val; break;
      case "^=": scope[variable] **= +val; break;
      case "%=": scope[variable] %= +val; break;
    }
  }

  evaluateNode(node) {
    let data = node?.data;
    switch (node?.type) {
      case "property": {
        let out = this.evaluateNode(data[0]);
        for (let i = 1; i < data.length; i++) { out = out[data[i]]; }
        return out;
      }
      case "array":
      case "object":
      case "string":
      case "define":
        return data;
      case "number":
        return +data;
      case "boolean":
        return data;
      case "none":
        return this.getVar(data);
      case "func": {
        let cmd = node.cmd;
        if (!Array.isArray(data)) data = [data];
        switch (cmd) {
          case "log": return console.log(...data.map(d => this.evaluateNode(d)));
          case "min": return Math.min(...data.map(d => this.evaluateNode(d)));
          case "max": return Math.max(...data.map(d => this.evaluateNode(d)));
          case "abs": return Math.abs(this.evaluateNode(data[0]));
          case "round": return Math.round(this.evaluateNode(data[0]));
          case "floor": return Math.floor(this.evaluateNode(data[0]));
          case "ceil": return Math.ceil(this.evaluateNode(data[0]));
          case "sqrt": return Math.sqrt(this.evaluateNode(data[0]));
          case "sin": return Math.sin(this.evaluateNode(data[0]));
          case "cos": return Math.cos(this.evaluateNode(data[0]));
          case "tan": return Math.tan(this.evaluateNode(data[0]));
          case "asin": return Math.asin(this.evaluateNode(data[0]));
          case "acos": return Math.acos(this.evaluateNode(data[0]));
          case "atan": return Math.atan(this.evaluateNode(data[0]));
          case "atan2": return Math.atan2(this.evaluateNode(data[0]), this.evaluateNode(data[1]));
          case "join": return data.map(d => this.evaluateNode(d)).join("");
          case "split": return this.evaluateNode(data[0]).split(this.evaluateNode(data[1]));
          case "keys": return Object.keys(this.evaluateNode(data[0]));
          case "values": return Object.values(this.evaluateNode(data[0]));
          case "length": return this.evaluateNode(data[0]).length;
          case "item": return this.evaluateNode(data[0])[this.evaluateNode(data[1])];
          case "=": return this.setVar(node.variable, this.evaluateNode(data[0]), "=");
          case "+=": return this.setVar(node.variable, this.evaluateNode(data[0]), "+=");
          case "-=": return this.setVar(node.variable, this.evaluateNode(data[0]), "-=");
          case "*=": return this.setVar(node.variable, this.evaluateNode(data[0]), "*=");
          case "/=": return this.setVar(node.variable, this.evaluateNode(data[0]), "/=");
          case "^=": return this.setVar(node.variable, this.evaluateNode(data[0]), "^=");
          case "%=": return this.setVar(node.variable, this.evaluateNode(data[0]), "%=");
          case "typeof": return typeof this.evaluateNode(data[0]);
          case "set": {
            const key = this.evaluateNode(data[0]),
              obj = this.evaluateNode(data[2]);
            return (obj[key] = this.evaluateNode(data[1]), obj);
          }
          case "del": {
            const obj = this.evaluateNode(data[1]);
            return (delete obj[this.evaluateNode(data[0])], obj);
          }
          case "while": while (this.evaluateNode(data[0])) this.call(node.content); return;
          case "repeat": for (let i = 0; i < this.evaluateNode(data[0]); i++) this.call(node.content); return;
          case "if": if (this.evaluateNode(data[0])) this.call(node.content); return;
          case "return":
            this.setVar(" return_val", this.evaluateNode(data[0]), "=");
            this.setVar(" returned", true, "=");
            return;
          default: {
            const func = this.getVar(cmd, "main");
            if (data?.type) data = [data];
            this.openScope("main");

            for (let i = 0; i < func.data.length; i++) this.setVar(func.data[i].data, this.evaluateNode(data[i]), "=");
            const func_out = this.callAndReturn(func.content);

            this.closeScope("main");
            return func_out;
          }
        }
      }
      case "operation": {
        const opFn = this.operators[node.op];
        return typeof opFn === "function" ? opFn(+this.evaluateNode(data[1]), +this.evaluateNode(data[0])) : "";
      }
      default: return Array.isArray(node) ? node[0] : node;
    }
  }

  call(code) {
    for (let i = 0; i < code.length; i++) this.evaluateNode(code[i]);
  }

  callAndReturn(code) {
    for (let i = 0; i < code.length; i++) {
      this.evaluateNode(code[i]);
      if (this.getVar(" returned")) return this.evaluateNode(this.getVar(" return_val"));
    }
  }
}

const main = new RTR({ name: "originOS", version: "v5.5.5" }, `
event (onload) {
  a = 0
  b = 1
  repeat (1000) {
    c = a + b
    a = b
    b = c
  }
  window.platform.name = "hi"
  log(window.platform.name)
  log(a)
}`);


const second = new RTR({ name:"originOS", version:"v5.5.5" },`event(onload){a=0;b=1;repeat(1000){c=a+b;a=b;b=c}log(window.platform.name)log(a)}`);

class RTR {
  constructor(platform, code) {
    this.RE_NUMBER = /^-?\d+(\.\d+)?$/;
    this.operators = {
      "==": (a, b) => a === b,
      "!=": (a, b) => a !== b,
      ">=": (a, b) => a >= b,
      "<=": (a, b) => a <= b,
      ">": (a, b) => a > b,
      "<": (a, b) => a < b,
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => a / b,
      "%": (a, b) => ((a % b) + b) % b,
      "^": (a, b) => a ** b,
    };

    this.vars = [{
      platform: Object.assign({ name: "unknown", version: "unknown" }, platform),
      rtr: { version: "1.6", environment: { type: "javascript", } },
      mouse: { x: 0, y: 0, down: false, clicked: false, moved: false },
      keysdown: [],
      log: (...args) => console.log(...args),
      min: (...args) => Math.min(...args),
      max: (...args) => Math.max(...args),
      abs: (x) => Math.abs(x),
      round: (x) => Math.round(x),
      floor: (x) => Math.floor(x),
      ceil: (x) => Math.ceil(x),
      sqrt: (x) => Math.sqrt(x),
      sin: (x) => Math.sin(x),
      cos: (x) => Math.cos(x),
      tan: (x) => Math.tan(x),
      asin: (x) => Math.asin(x),
      acos: (x) => Math.acos(x),
      atan: (x) => Math.atan(x),
      join: (...arr) => arr.join(""),
      split: (str, sep) => str.split(sep),
      keys: (obj) => Object.keys(obj),
      values: (obj) => Object.values(obj),
      length: (obj) => obj.length,
      item: (obj, index) => obj[index],
      typeof: (x) => typeof x,
      range: (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i),
      input: (msg) => prompt(msg),
      chr: (x) => String.fromCharCode(x),
      ord: (x) => x.charCodeAt(0),
      not: (x) => !x,
      "!": (x) => !x,
      set: (obj, key, val) => (obj[key] = val, obj),
      obj: () => ({}),
      del: (obj, key) => (delete obj[key], obj),
      has: (obj, key) => obj.hasOwnProperty(key),
      all: (...args) => args.every(Boolean),
      any: (...args) => args.some(Boolean),
      return: (val) => { this.setVar(" return_val", val, "="); this.setVar(" returned", true, "="); },
      toNum: (x) => x | 0,
      toStr: (x) => "" + x,
    }, {}];

    this.ast = this.compileRTR(code);
    this.runEvent("onload");
  }

  splitByDelimiters(line, delimiters) {
    let inQuote = false, depth = 0, current = "", out = [];
    for (let i = 0; i < line.length; i++) {
      let ch = line[i];
      if (ch === '"') inQuote = !inQuote;
      if (inQuote || !delimiters.includes(ch)) {
        current += ch;
      } else if (!inQuote && delimiters.includes(ch)) {
        if (!depth) {
          out.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      if ("([{".includes(ch)) depth++;
      if (")]}".includes(ch)) depth--;
    }
    if (current) out.push(current);
    return out;
  }

  parseData(line) {

    while (line.startsWith("(") && line.endsWith(")")) line = line.slice(1, -1);
    if (line.startsWith("\"") && line.endsWith("\"") && this.splitByDelimiters(line, "\"").length === 1) return { type: "string", data: line.slice(1, -1) };

    if ((line.startsWith("[") && line.endsWith("]")) || (line.startsWith("{") && line.endsWith("}"))) {
      try {
        return { type: line.startsWith("[") ? "array" : "object", data: JSON.parse(line) };
      } catch {
        return { type: "object", data: {} };
      }
    } else if (line.endsWith(")") && line.indexOf("(") > 0) {
      let open = line.indexOf("(");
      let func = line.substring(0, open);
      if (func.match(/^\w+$/) !== null) {
        let val = this.splitByDelimiters(line, ".");
        if (val.length > 1) return { type: "property", data: val.map((x, i) => i === 0 ? this.parseData(x) : x) };
        return {
          cmd: this.parseData(func), type: "func",
          data: this.splitByDelimiters(line.substring(open + 1, line.length - 1), ",")
            .map(arg => this.parseData(arg))
        };
      } else {
        let val = this.splitByDelimiters(func, ".");
        if (val.length > 1) return { type: "func", cmd: this.parseData(func), data: this.splitByDelimiters(line.substring(open + 1, line.length - 1), ",").map(arg => this.parseData(arg)) };
      }
    }
    if (line.indexOf(" ") === -1) {
      if (line === "true" || line === "false") return { type: "boolean", data: line === "true" };
      else if (line === "null") return { type: "null", data: null };
      else if (this.RE_NUMBER.test(line)) return { type: "number", data: parseFloat(line) };
      else if (/^[^.,()\-+\/*%|&><=!~\s]+$/.test(line)) return { type: "none", data: line };
      else {
        let val = this.splitByDelimiters(line, ".");
        if (val.length > 1) return { type: "property", data: val.map((x, i) => i === 0 ? this.parseData(x) : x) };
      }
    }
    let out = [], buf = "", quotes = false;
    let ops = Object.keys(this.operators);
    ops.sort((a, b) => b.length - a.length);
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        quotes = !quotes;
        buf += line[i];
        continue;
      }
      if (quotes) {
        buf += line[i];
        continue;
      }
      let matched = false;
      for (const op of ops) {
        if (line.slice(i, i + op.length) === op) {
          if (buf.trim() !== "") {
            out.push(this.parseData(buf.trim()));
            buf = "";
          }
          out.push(op);
          i += op.length - 1;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      buf += line[i];
    }
    if (buf.trim() !== "") out.push(this.parseData(buf.trim()));
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

  parseBlock(lines, i) {
    let block = [];
    i++;
    for (; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.startsWith("}")) break;
      const regex = /\(([^()]*)\)~{/;
      if (regex.test(line)) {
        while (regex.test(line)) {
          let [nested, newIndex] = this.parseBlock(lines, i);
          let line_data = line.slice(line.indexOf("(") + 1, line.lastIndexOf(")"))
          line_data = this.splitByDelimiters(line_data, ",").map(x => this.parseData(x.trim()));

          line = line.replace(regex, JSON.stringify({ type: "define", data: line_data, content: nested }));
          i = newIndex - 1;
        }
      } else if (line.endsWith("{")) {
        let pre = line.slice(0, -1).trim();
        let start = pre.indexOf("(");
        let open = start === -1 ? pre.length : start;
        let cmd = pre.substring(0, open).trim();
        let line_data = (start !== -1) ? pre.substring(open + 1, pre.length - 1).trim() : "";

        let parsed = line_data ? this.splitByDelimiters(line_data, ",").map((x) => this.parseData(x)) : [];
        let [nested, newIndex] = this.parseBlock(lines, i);

        if (["if", "elif", "else"].includes(cmd)) {
          let prev = block[block.length - 1];
          if (cmd === "if") {
            block.push({ cmd: "if", type: "func", data: parsed, content: nested });
          } else if (cmd === "elif") {
            if (prev && ["if", "elif"].includes(prev.cmd) && !prev.elif && !prev.else) {
              prev.elif = { cmd: "if", type: "func", data: parsed, content: nested };
            } else {
              block.push({ cmd: "if", type: "func", data: parsed, content: nested });
            }
          } else if (cmd === "else") {
            if (prev && ["if", "elif"].includes(prev.cmd) && !prev.else) {
              prev.else = { cmd: "if", type: "func", data: [], content: nested };
            } else {
              block.push({ cmd: "if", type: "func", data: [], content: nested });
            }
          }
        } else {
          block.push({ cmd, type: "func", data: parsed, content: nested });
        }

        i = newIndex - 1;
        continue;
      }
      const assignmentMatch = line.match(/^(.*?)\s*(\+=|-=|\*=|\/=|\^=|%=|(?<!=)=(?!=))\s*(.*)$/);
      if (assignmentMatch) {
        const [, variable, operator, expr] = assignmentMatch;
        line = { cmd: operator, type: "func", variable: variable.trim(), data: this.parseData(expr) };
      } else {
        line = this.parseData(line);
      }
      block.push(line);
    }
    return [block, i + 1];
  }

  tokeniseLine(line) {
    let tokens = [], current = "", depth = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
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
    rtr = this.constructor.removeWhiteSpace(rtr);

    const result = { events: [], style: {}, all: {} };
    const lines = rtr.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim(),
        tokens = this.tokeniseLine(line);
      if (tokens[2] === "{") {
        const [block, newIndex] = this.parseBlock(lines, i);
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
          const parsed = this.parseData(line.slice(0, -1));
          let names = (Array.isArray(parsed?.data) ? parsed.data : [parsed.data]).map(v => v.data);
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

  static removeWhiteSpace(rtr) {
    let out = "", inString = false, stringChar = "";

    for (let i = 0; i < rtr.length; i++) {
      let c = rtr[i];
      if (c === '"' || c === "'") {
        if (!inString) {
          inString = true;
          stringChar = c;
        } else if (c === stringChar && rtr[i - 1] !== "\\") {
          inString = false;
        }
        out += c;
      } else if (!inString && c === "/" && rtr[i + 1] === "*") {
        i += 2;
        while (i < rtr.length && !(rtr[i] === "*" && rtr[i + 1] === "/")) i++;
        i++;
      } else {
        out += c;
      }
    }
    rtr = out;

    out = "";
    let inQuote = false;
    for (let i = 0; i < rtr.length; i++) {
      let c = rtr[i];
      if (c === '"') inQuote = !inQuote;
      if (inQuote || c !== " ") out += c;
    }

    return out
      .replaceAll(";", "\n")
      .replace(/\n+/g, "\n")
      .replace(/{(\w)/gm, "{\n$1")
      .replace(/[\)}\]]}/gm, ")\n}")
      .replace(/}}/gi, "}\n}")
      .replace(/([{,])\n(")/gm, "$1$2")
      .replace(/,\n/gm, ",")
      .replace(/,([}\]])/gm, "$1")
      .replace(/([\)}])(\w)/gm, "$1\n$2")
      .replace(/(\w)}/gm, "$1\n}")
  }

  static minify(rtr) {
    return this.removeWhiteSpace(rtr.trim())
      .replace(/(\w)\n(\w)/g, "$1;$2")
      .replace(/(?<!\()\n(?!\))+/g, ";")
      .replace(/{;/g, "{")
      .replace(/\(;/g, "(")
      .replace(/([}\)]);([\w])/g, "$1$2")
      .replace(/([\w\)]);}/g, "$1}")
  }

  hasEvent(event) {
    return typeof this.ast.all[event] !== "undefined";
  }

  runEvent(event) {
    if (this.hasEvent(event)) this.call(this.ast.all[event].content);
  }

  getVar(variable) {
    const scope = this.vars;
    for (let i = scope.length - 1; i >= 0; i--) if (scope[i][variable] !== undefined) return scope[i][variable];
    return null;
  }

  setVar(variable, val, assignment) {
    let scope;
    if (variable.includes(".")) {
      let parts = variable.split(".");
      let obj = this.getVar(parts[0]);

      variable = parts[parts.length - 1]

      for (let i = 1; i < parts.length - 1; i++) obj = obj[parts[i]];

      scope = obj;
    } else {
      scope = this.vars[this.vars.length - 1];
    }

    switch (assignment) {
      case "=": scope[variable] = val; break;
      default: scope[variable] = this.operators[assignment.slice(0, -1)](scope[variable], val); break;
    }
  }

  evaluateNode(node) {
    let data = node?.data;
    switch (node?.type) {
      case "property": {
        let out = this.evaluateNode(data[0]);
        for (let i = 1; i < data.length; i++) out = out[data[i]];
        return out;
      }
      case "array": case "object": case "string": case "define": case "boolean": return data;
      case "number": return +data;
      case "none": return this.getVar(data);
      case "func": {
        let cmd = node.cmd;
        cmd = typeof cmd === "object" ? this.evaluateNode(cmd) : cmd;
        if (!Array.isArray(data)) data = [data];
        if (typeof node.variable !== "undefined" && cmd.endsWith("=")) return this.setVar(node.variable, this.evaluateNode(data[0]), cmd);
        switch (cmd) {
          case "obj": return {};
          case "while": while (this.evaluateNode(data[0])) this.call(node.content); return;
          case "repeat": for (let i = this.evaluateNode(data[0]); i > 0.5; i--) this.call(node.content); return;
          case "scope": this.vars.push({}); this.call(node.content); this.vars.pop(); return;
          case "for": {
            const variable = data[0].data;
            const range = this.evaluateNode(data[1]);

            for (let i = 0; i < range.length; i++) {
              this.setVar(variable, range[i], "=");
              this.call(node.content);
            }
            return;
          }
          case "if": {
            const condition = this.evaluateNode(data[0]);
            if (condition) this.call(node.content);
            else if (node.elif) this.evaluateNode(node.elif);
            else if (node.else) this.call(node.else.content);
            return;
          }
          default: {
            try {
              if (typeof cmd === "function") return cmd(...data.map(x => this.evaluateNode(x)));

              let func;
              if (cmd.type === "define") {
                func = cmd;
              } else {
                func = this.getVar(cmd);
              }

              if (data?.type) data = [data];
              this.vars.push({});
              for (let i = 0; i < func.data.length; i++) this.setVar(func.data[i].data, this.evaluateNode(data[i]), "=");
              const func_out = this.call(func.content);
              this.vars.pop();
              return func_out;
            } catch (e) {
              throw new Error("Unknown function: " + cmd + e);
            }
          }
        }
      }
      case "operation": {
        const opFn = this.operators[node.op];
        return typeof opFn === "function" ? opFn(this.evaluateNode(data[0]), this.evaluateNode(data[1])) : "";
      }
    }
  }

  call(code) {
    for (let i = 0; i < code.length; i++) {
      this.evaluateNode(code[i]);
      if (this.getVar(" returned"))
        return this.getVar(" return_val");
    }
  }
}

let start = performance.now();

const main = new RTR({ name: "originOS", version: "v5.5.5" }, `

event (onload) {
  ob = obj()

  log(ob)

  ob.fn = (val)~{
    log(val)
    return(5 + 10)
  }

  log(ob.fn(toNum(10)))
}
`);

// console.log(JSON.stringify(main.ast, null, 2));

console.log("Execution time:", performance.now() - start, "ms");

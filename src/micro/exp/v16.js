// License: MPL-2.0
// This Source Code is subject to the terms of the Mozilla Public License, v2.0,
// If a copy of the MPL was not distributed with this file,
// Then you can obtain one at https://mozilla.org/MPL/2.0/

class rtrExp {
  constructor() {
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
      "?": (a, b, c) => a ? b : c,
    };

    this.functions = {
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
    };
  }

  splitByDelimiters(str, delimiters) {
    let inQuote = false, depth = 0, current = "", out = [];
    for (let i = 0; i < str.length; i++) {
      let ch = str[i];
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

  parseExpression(expr) {
    // Clean up the expression
    expr = expr.trim();
    
    // Handle parentheses
    while (expr.startsWith("(") && expr.endsWith(")")) {
      const inner = expr.slice(1, -1);
      if (this.balancedParentheses(inner)) {
        expr = inner;
      } else {
        break;
      }
    }
    
    // Handle function calls
    if (expr.indexOf("(") > 0 && expr.endsWith(")")) {
      const funcNameEnd = expr.indexOf("(");
      const funcName = expr.substring(0, funcNameEnd);
      const argsStr = expr.substring(funcNameEnd + 1, expr.length - 1);
      
      if (this.functions[funcName]) {
        const args = this.splitByDelimiters(argsStr, ",")
          .map(arg => this.evaluate(arg.trim()));
        return this.functions[funcName](...args);
      }
    }

    // Handle operations
    let ops = Object.keys(this.operators);
    ops.sort((a, b) => b.length - a.length);

    for (const op of ops) {
      const parts = this.splitOperator(expr, op);
      if (parts) {
        const [left, right] = parts;
        return this.operators[op](this.evaluate(left), this.evaluate(right));
      }
    }

    // Handle literals
    if (this.RE_NUMBER.test(expr)) {
      return parseFloat(expr);
    } else if (expr === "true") {
      return true;
    } else if (expr === "false") {
      return false;
    }

    // Default
    return expr;
  }

  splitOperator(expr, op) {
    let depth = 0;
    let inQuote = false;
    
    for (let i = 0; i <= expr.length - op.length; i++) {
      if (expr[i] === '"') inQuote = !inQuote;
      if (expr[i] === '(') depth++;
      if (expr[i] === ')') depth--;
      
      if (!inQuote && depth === 0 && expr.substring(i, i + op.length) === op) {
        return [
          expr.substring(0, i).trim(),
          expr.substring(i + op.length).trim()
        ];
      }
    }
    return null;
  }

  balancedParentheses(str) {
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '(') depth++;
      if (str[i] === ')') depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  }

  evaluate(expr) {
    return this.parseExpression(expr);
  }
}

// Example usage
const evaluator = new rtrExp();
console.log(evaluator.evaluate("not(1 + 10 == 11)"));  // false
console.log(evaluator.evaluate("1 + 2 * 3"));          // 7
console.log(evaluator.evaluate("not(5 > 3)"));         // false
console.log(evaluator.evaluate("min(10, 5, 8)"));      // 5

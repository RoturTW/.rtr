require("./framework.js");

console.log("=== Function Tests ===\n");

test("function definition", "event (onload) { fn = (x)~{ return(x + 1) } }", []);
test("function call", "event (onload) { fn = (x)~{ log(x); return(x + 1) }; log(fn(5)) }", ["5", "6"]);
test("function return value", "event (onload) { fn = (x)~{ return(x * 2) }; log(fn(5)) }", ["10"]);
test("function multiple params", "event (onload) { add = (a, b)~{ return(a + b) }; log(add(3, 4)) }", ["7"]);
test("function no params", "event (onload) { fn = ()~{ return(42) }; log(fn()) }", ["42"]);
test("function expression", "event (onload) { fn = (x)~{ return(x * x + 1) }; log(fn(3)) }", ["10"]);
test("function closure", "event (onload) { makeAdder = (n)~{ return((x)~{ return(x + n) }) }; add5 = makeAdder(5); log(add5(10)) }", ["15"]);

results();

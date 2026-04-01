require("./framework.js");

console.log("=== Math Tests ===\n");

test("abs positive", "event (onload) { log(abs(5)) }", ["5"]);
test("abs negative", "event (onload) { log(abs(-5)) }", ["5"]);
test("abs zero", "event (onload) { log(abs(0)) }", ["0"]);
test("sqrt", "event (onload) { log(sqrt(16)) }", ["4"]);
test("sqrt decimal", "event (onload) { log(sqrt(2)) }", ["1.4142135623730951"]);
test("round up", "event (onload) { log(round(3.7)) }", ["4"]);
test("round down", "event (onload) { log(round(3.2)) }", ["3"]);
test("floor", "event (onload) { log(floor(3.7)) }", ["3"]);
test("ceil", "event (onload) { log(ceil(3.2)) }", ["4"]);
test("min two", "event (onload) { log(min(3, 1)) }", ["1"]);
test("min three", "event (onload) { log(min(3, 1, 4)) }", ["1"]);
test("max two", "event (onload) { log(max(3, 1)) }", ["3"]);
test("max three", "event (onload) { log(max(3, 1, 4)) }", ["4"]);

results();

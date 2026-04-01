require("./framework.js");

console.log("=== Comparison Tests ===\n");

test("greater than true", "event (onload) { log(5 > 3) }", ["true"]);
test("greater than false", "event (onload) { log(3 > 5) }", ["false"]);
test("less than true", "event (onload) { log(3 < 5) }", ["true"]);
test("less than false", "event (onload) { log(5 < 3) }", ["false"]);
test("greater or equal true", "event (onload) { log(5 >= 5) }", ["true"]);
test("greater or equal false", "event (onload) { log(4 >= 5) }", ["false"]);
test("less or equal true", "event (onload) { log(5 <= 5) }", ["true"]);
test("less or equal false", "event (onload) { log(6 <= 5) }", ["false"]);
test("equality true", "event (onload) { log(5 == 5) }", ["true"]);
test("equality false", "event (onload) { log(5 == 3) }", ["false"]);
test("inequality true", "event (onload) { log(5 != 3) }", ["true"]);
test("inequality false", "event (onload) { log(5 != 5) }", ["false"]);

results();

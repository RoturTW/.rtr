require("./framework.js");

console.log("=== Operator Tests ===\n");

test("addition", "event (onload) { log(2 + 3) }", ["5"]);
test("subtraction", "event (onload) { log(10 - 4) }", ["6"]);
test("multiplication", "event (onload) { log(3 * 4) }", ["12"]);
test("division", "event (onload) { log(10 / 2) }", ["5"]);
test("modulo", "event (onload) { log(10 % 3) }", ["1"]);
test("power", "event (onload) { log(2 ^ 3) }", ["8"]);

test("compound +=", "event (onload) { x = 5; x += 3; log(x) }", ["8"]);
test("compound -=", "event (onload) { x = 5; x -= 3; log(x) }", ["2"]);
test("compound *=", "event (onload) { x = 5; x *= 3; log(x) }", ["15"]);
test("compound /=", "event (onload) { x = 10; x /= 2; log(x) }", ["5"]);

results();

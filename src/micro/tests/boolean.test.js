require("./framework.js");

console.log("=== Boolean Tests ===\n");

test("true literal", "event (onload) { log(true) }", ["true"]);
test("false literal", "event (onload) { log(false) }", ["false"]);
test("not true", "event (onload) { log(not(true)) }", ["false"]);
test("not false", "event (onload) { log(not(false)) }", ["true"]);
test("bang operator", "event (onload) { log(!(true)) }", ["false"]);
test("double negation", "event (onload) { log(not(not(true))) }", ["true"]);
test("all true", "event (onload) { log(all(true, true, true)) }", ["true"]);
test("all false", "event (onload) { log(all(true, false)) }", ["false"]);
test("any true", "event (onload) { log(any(false, false, true)) }", ["true"]);
test("any false", "event (onload) { log(any(false, false)) }", ["false"]);
test("boolean in expression", "event (onload) { log(true == true) }", ["true"]);
test("boolean comparison", "event (onload) { log(true != false) }", ["true"]);

results();

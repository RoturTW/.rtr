require("./framework.js");

console.log("=== Object Tests ===\n");

test("object creation", "event (onload) { ob = obj(); log(type(ob)) }", ["object"]);
test("object property set", "event (onload) { ob = obj(); ob.val = 10 }", []);
test("object property get", "event (onload) { ob = obj(); ob.val = 10; log(ob.val) }", ["10"]);
test("object property nested", "event (onload) { ob = obj(); ob.inner = obj(); ob.inner.val = 5; log(ob.inner.val) }", ["5"]);
test("object has true", "event (onload) { ob = obj(); ob.val = 5; log(has(ob, \"val\")) }", ["true"]);
test("object has false", "event (onload) { ob = obj(); ob.val = 5; log(has(ob, \"missing\")) }", ["false"]);
test("object del", "event (onload) { ob = obj(); ob.val = 5; del(ob, \"val\"); log(has(ob, \"val\")) }", ["false"]);
test("object keys", "event (onload) { ob = obj(); ob.a = 1; ob.b = 2; log(keys(ob)) }", ["[\"a\",\"b\"]"]);
test("object values", "event (onload) { ob = obj(); ob.a = 1; ob.b = 2; log(values(ob)) }", ["[1,2]"]);
test("object set function", "event (onload) { ob = obj(); set(ob, \"key\", \"val\"); log(ob.key) }", ["val"]);

results();

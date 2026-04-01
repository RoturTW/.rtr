require("./framework.js");

console.log("=== Control Flow Tests ===\n");

test("if true", `event (onload) { x = 5; if(x > 3) { log("big") } }`, ["big"]);
test("if false", `event (onload) { x = 2; if(x > 3) { log("big") } }`, []);
test("if-else true", `event (onload) { x = 5; if(x > 3) { log("big") } else { log("small") } }`, ["big"]);
test("if-else false", `event (onload) { x = 2; if(x > 3) { log("big") } else { log("small") } }`, ["small"]);
test("if-elif-else first", `event (onload) { x = 1; if(x == 1) { log("one") } elif(x == 2) { log("two") } else { log("other") } }`, ["one"]);
test("if-elif-else second", `event (onload) { x = 2; if(x == 1) { log("one") } elif(x == 2) { log("two") } else { log("other") } }`, ["two"]);
test("if-elif-else else", `event (onload) { x = 99; if(x == 1) { log("one") } elif(x == 2) { log("two") } else { log("other") } }`, ["other"]);

results();

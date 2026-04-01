require("./framework.js");

console.log("=== Loop Tests ===\n");

test("repeat", "event (onload) { repeat(3) { log(\"hi\") } }", ["hi", "hi", "hi"]);
test("repeat with counter", "event (onload) { i = 0; repeat(3) { i = i + 1; log(i) } }", ["1", "2", "3"]);
test("for range", "event (onload) { for(i, range(0, 3)) { log(i) } }", ["0", "1", "2", "3"]);
test("for sum", "event (onload) { sum = 0; for(i, range(1, 5)) { sum = sum + i }; log(sum) }", ["15"]);
test("while", "event (onload) { i = 0; while(i < 3) { log(i); i = i + 1 } }", ["0", "1", "2"]);
test("while with condition", "event (onload) { sum = 0; i = 1; while(i <= 5) { sum = sum + i; i = i + 1 }; log(sum) }", ["15"]);

results();

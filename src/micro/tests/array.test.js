require("./framework.js");

console.log("=== Array Tests ===\n");

test("array literal", "event (onload) { arr = [1, 2, 3]; log(arr) }", ["[1,2,3]"]);
test("array length", "event (onload) { arr = [1, 2, 3]; log(length(arr)) }", ["3"]);
test("array item by index", "event (onload) { arr = [10, 20, 30]; log(item(arr, 0)) }", ["10"]);
test("array item last", "event (onload) { arr = [10, 20, 30]; log(item(arr, 2)) }", ["30"]);
test("nested array", "event (onload) { arr = [[1, 2], [3, 4]]; log(item(item(arr, 0), 0)) }", ["1"]);
test("array with strings", `event (onload) { arr = ["a", "b"]; log(arr) }`, ['["a","b"]']);
test("array with mixed types", "event (onload) { arr = [1, \"two\", true]; log(length(arr)) }", ["3"]);

results();

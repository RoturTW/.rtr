// Test runner - run all tests against a given rtr file
const path = require("path");
const { spawn } = require("child_process");

if (!process.argv[2]) {
  console.log("Usage: node runner.js <path-to-rtr.js>");
  console.log("Example: node runner.js ../v16.js");
  process.exit(1);
}

const rtrPath = path.resolve(process.argv[2]);
const testDir = __dirname;
const testFiles = [
  "array.test.js",
  "boolean.test.js", 
  "comparison.test.js",
  "function.test.js",
  "math.test.js",
  "object.test.js",
  "controlflow.test.js",
  "loop.test.js",
  "operator.test.js",
];

let totalPassed = 0;
let totalFailed = 0;

async function runTests() {
  console.log(`Running tests against: ${rtrPath}\n`);
  
  for (const testFile of testFiles) {
    const result = await new Promise((resolve) => {
      const proc = spawn("node", [path.join(testDir, testFile), rtrPath], {
        cwd: testDir,
        timeout: 5000,
      });
      
      let output = "";
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        proc.kill();
        resolve("Test timed out");
      }, 3000);
      
      proc.stdout.on("data", d => output += d);
      proc.stderr.on("data", d => output += d);
      proc.on("close", () => {
        clearTimeout(timeout);
        if (!timedOut) resolve(output);
      });
    });
    
    // Extract passed/failed from output
    const match = result.match(/Results: (\d+)\/(\d+) passed/);
    if (match) {
      const passed = parseInt(match[1]);
      const failed = parseInt(match[2]) - passed;
      totalPassed += passed;
      totalFailed += failed;
    }
    
    console.log(result);
  }
  
  console.log(`\n=== TOTAL: ${totalPassed}/${totalPassed + totalFailed} passed ===`);
  process.exit(totalFailed === 0 ? 0 : 1);
}

runTests();

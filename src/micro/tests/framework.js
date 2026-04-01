// Central test framework - import this in test files
let passed = 0, failed = 0;

global.test = function(name, code, expected) {
  let logs = [];
  let origLog = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try { new RTR({ name: "test", version: "1.0" }, code); }
  catch(e) { logs = ["ERROR: " + e.message]; }
  finally { console.log = origLog; }
  
  if (JSON.stringify(logs) === JSON.stringify(expected)) {
    passed++;
    console.log(`✓ ${name}`);
  } else {
    failed++;
    console.log(`✗ ${name}`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Got: ${JSON.stringify(logs)}`);
  }
};

global.results = function() {
  console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
  process.exit(failed === 0 ? 0 : 1);
};

const RTR = require(process.argv[2]);

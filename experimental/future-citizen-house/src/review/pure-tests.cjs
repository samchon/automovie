// Discover and invoke every authored pure test export in this production.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../house");
/** @param {string} dir @returns {string[]} */
const discover = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory()
      ? discover(name)
      : entry.name.endsWith(".test.ts")
        ? [name]
        : [];
  });
const files = discover(root).sort((a, b) => a.localeCompare(b));
let tests = 0,
  failures = 0;
if (!files.length) {
  failures++;
  console.error("NO TEST FILES");
}
for (const file of files) {
  let exports;
  try {
    exports = require(file);
  } catch (error) {
    failures++;
    console.error(`FAIL LOAD ${path.relative(root, file)}: ${error}`);
    continue;
  }
  const cases = Object.entries(exports).filter(
    ([name, value]) => name.startsWith("verify") && typeof value === "function",
  );
  if (!cases.length) {
    failures++;
    console.error(`NO TEST EXPORT ${path.relative(root, file)}`);
  }
  for (const [name, test] of cases) {
    tests++;
    try {
      test();
      console.log(`PASS ${path.relative(root, file)} ${name}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${path.relative(root, file)} ${name}: ${error}`);
    }
  }
}
console.log(
  `pure-tests: ${files.length} files, ${tests} exports, ${failures} failures`,
);
if (failures) process.exitCode = 1;

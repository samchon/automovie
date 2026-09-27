const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { audit } = require("./building-interface-sweep.cjs");

const name = "05-closet-fittings.md";
const source = fs.readFileSync(path.resolve(__dirname, `../../docs/models/${name}`), "utf8");
/** @param {string} text */
const check = (text) => audit([{ name, source: text }]);

void test("side-wall contacts use both ends of each authored fitting", () => {
  const result = check(source);
  assert.equal(result.axialClaims, 2);
  assert.equal(result.checkedIntervals, 3);
  assert.deepEqual(result.failures, []);
});

void test("shortened fitting ranges leave positive gaps at reviewed walls", () => {
  const rod = source.replace("Z=[−4.56,−3.51] m의 길이 1.05 m", "Z=[−4.51,−3.56] m의 길이 0.95 m")
    .replace("두 측벽의 안쪽 면 Z=[−4.56,−3.51] m", "두 측벽의 안쪽 면 Z=[−4.51,−3.56] m");
  const shelves = source.replace("모두 X=[1.87,3.07]", "모두 X=[1.92,3.02]");
  assert.equal(check(rod).failures.length, 4);
  assert.equal(check(shelves).failures.length, 2);
});

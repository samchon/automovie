const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { audit } = require("./building-interface-sweep.cjs");

const directory = path.resolve(__dirname, "../../docs/models");
const files = fs.readdirSync(directory).filter(name => name.endsWith(".md"))
  .map(name => ({ name, source: fs.readFileSync(path.join(directory, name), "utf8") }));
/** @param {{name:string,source:string}[]} population */
const check = (population) => audit(population);

void test("all authored axial wall contacts have two measured ends", () => {
  const result = check(files);
  assert.ok(result.h2 > 0);
  assert.ok(result.axialClaims > 0);
  assert.ok(result.checkedIntervals >= result.axialClaims);
  assert.deepEqual(result.failures, []);
});

void test("moving an authored contact interval off its wall fails", () => {
  const target = files.find(file => /두\s*[XYZ]\s*끝면[^\n]*(?:측벽|옆벽|양쪽 벽)/.test(file.source));
  assert.ok(target);
  const paragraph = target.source.replace(/<!--[\s\S]*?-->/g, "").split(/\n+/)
    .find(text => /두\s*[XYZ]\s*끝면[^\n]*(?:측벽|옆벽|양쪽 벽)/.test(text));
  assert.ok(paragraph);
  const claim = /두\s*([XYZ])\s*끝면[^\n]*(?:측벽|옆벽|양쪽 벽)/.exec(paragraph);
  assert.ok(claim);
  const axis = claim[1];
  const interval = new RegExp(`${axis}=\\[([−-]?\\d+(?:\\.\\d+)?),([−-]?\\d+(?:\\.\\d+)?)\\]`).exec(paragraph);
  assert.ok(interval);
  /** @param {string} text */
  const number = (text) => Number(text.replace("−", "-"));
  const moved = `${axis}=[${number(interval[1]) + 0.05},${number(interval[2]) + 0.05}]`;
  const population = files.map(file => file === target ? { ...file, source:file.source.replace(paragraph, paragraph.replace(interval[0], moved)) } : file);
  assert.ok(check(population).failures.length > 0);
});

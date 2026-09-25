/** Produces conservative candidates for the manual model face audit.
 * A matching sentence is not a proof of geometry, placement, or UV. A missing
 * sentence is a review obligation; --strict refuses to call this pass clean. */
const fs = require("node:fs");
const path = require("node:path");
const { witness } = require("./model-face-witness.cjs");

const docs = path.resolve(__dirname, "../../docs");
/** @param {string} p */
const read = (p) => fs.readFileSync(path.join(docs, p), "utf8");
const account = read("accounts/models/surface-ownership.md");
const pairs = [];
for (const line of account.split(/\r?\n/)) {
  const m = /^\| \[[^\]]+\]\(\.\.\/\.\.\/models\/([^#)]+)#([^)]+)\) \| ([^|]*) \| ([^|]*) \|/.exec(
    line,
  );
  if (!m || !m[3].includes("src/models/")) continue;
  for (const id of [...m[4].matchAll(/`([a-z][a-z0-9-]*)`/g)].map((x) => x[1]))
    pairs.push({ owner: `${m[1]}#${m[2]}`, file: m[1], anchor: m[2], id });
}
const files = [...new Set(pairs.map((p) => p.file))];
/** @type {Map<string, string>} */
const sections = new Map();
for (const file of files) {
  for (const chunk of read(`models/${file}`).split(/^## /m).slice(1)) {
    const anchor = /\{#([^}]+)\}/.exec(chunk.split("\n", 1)[0])?.[1];
    if (!anchor) throw new Error(`Missing H2 anchor in ${file}`);
    sections.set(`${file}#${anchor}`, chunk.replace(/<!--[\s\S]*?-->/g, ""));
  }
}
const inventory = [];
for (const pair of pairs) {
  const body = sections.get(pair.owner);
  if (!body) throw new Error(`Account points to absent H2 ${pair.owner}`);
  const found = witness(body, pair.id);
  inventory.push({
    ...pair,
    named: found.named,
    candidate: found.sentence !== null,
    sentence: found.sentence,
  });
}
const missing = inventory.filter((p) => !p.candidate);
const summary = {
  pairs: inventory.length,
  partSentenceCandidates: inventory.length - missing.length,
  requiringManualReview: missing.length,
  withoutLiteralFaceId: missing.filter((p) => p.named === 0).length,
};
if (process.argv.includes("--json")) console.log(JSON.stringify({ summary, inventory }, null, 2));
else {
  console.log(JSON.stringify(summary));
  if (process.argv.includes("--verbose"))
    for (const p of missing) console.log(
      `REVIEW PART ${p.owner} :: ${p.id} :: tokenSentences=${p.named}`,
    );
}
if (process.argv.includes("--strict") && missing.length) process.exitCode = 1;

/** Produces conservative candidates for the manual model face audit.
 * A matching sentence is not a proof of geometry, placement, or UV. A missing
 * sentence is a review obligation; --strict refuses to call this pass clean. */
const fs = require("node:fs");
const path = require("node:path");

const docs = path.resolve(__dirname, "../../docs");
/** @param {string} p */
const read = (p) => fs.readFileSync(path.join(docs, p), "utf8");
const account = read("accounts/models/surface-ownership.md");
const pairs = [];
for (const line of account.split(/\r?\n/)) {
  const m = /^\| \[[^\]]+\]\(\.\.\/\.\.\/models\/([^#)]+)#([^)]+)\) \| ([^|]*) \| ([^|]*) \|/.exec(line);
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
const list = /(?:재질 경계|표면 id|면 id|face id|id 목록|표면 파티션|경계는|경계를)/;
const measure = /\d+(?:\.\d+)?\s*(?:m|UV\/m)|\[[−+\-.\d,\s]+\]\s*m|\d+(?:\.\d+)?\s*×\s*\d/;
const placement = /(?:X|Y|Z)\s*=\s*\[|(?:X|Y|Z)\s*=\s*[−-]?\d|원점|중심|모서리|끝에서|윗면|아랫면|뒤쪽|앞쪽|상단|하단|좌우|양끝|둘레|깊이/;
for (const pair of pairs) {
  const body = sections.get(pair.owner);
  if (!body) throw new Error(`Account points to absent H2 ${pair.owner}`);
  const sentences = body.split(/(?<=다\.)\s+|\r?\n/).map((s) => s.trim()).filter(Boolean);
  const token = `\`${pair.id}\``;
  const named = sentences.filter((s) => s.includes(token));
  const defining = named.filter((s) => !list.test(s) && measure.test(s) && placement.test(s));
  inventory.push({ ...pair, named: named.length, candidate: defining.length > 0, sentence: defining[0] ?? null });
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
    for (const p of missing) console.log(`REVIEW PART ${p.owner} :: ${p.id} :: tokenSentences=${p.named}`);
}
if (process.argv.includes("--strict") && missing.length) process.exitCode = 1;

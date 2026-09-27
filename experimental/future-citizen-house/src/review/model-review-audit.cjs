// Read every model review against its paired acknowledgement and the containing
// H2's authored body. This locates mechanical alarms; literal review decides truth.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");

/** @typedef {{ line: number; key: string; prose: string }} ReviewRow */
/** @typedef {{ file: string; anchor: string; evidence: Map<string, string>; reviews: ReviewRow[]; body: string[]; parts: Set<string> }} Unit */

/** @param {string} file @param {string} contents */
function units(file, contents) {
  /** @type {Unit} */
  const first = { file, anchor: "(file)", evidence: new Map(), reviews: [], body: [], parts: new Set() };
  /** @type {Unit[]} */
  const result = [first];
  let unit = first;
  let inComment = false;
  for (const [index, line] of contents.split(/\r?\n/).entries()) {
    const heading = line.match(/^## .*\{#([^}]+)\}$/);
    if (heading) {
      unit = { file, anchor: heading[1], evidence: new Map(), reviews: [], body: [], parts: new Set() };
      result.push(unit);
    }
    if (line.trim() === "<!--") inComment = true;
    if (!inComment) {
      unit.body.push(line);
      const inventory = line.match(/^@inventory\s+[^:]+:\s*(.*)$/);
      if (inventory) for (const part of inventory[1].split(/,\s*/)) unit.parts.add(part);
      const part = line.match(/^\|\s*@part\s*\|[^|]*\|\s*([^| ]+)/);
      if (part) unit.parts.add(part[1]);
    }
    const ack = line.match(/^@evidence(Exclude)?\s+(\S+)\s+(.+)$/);
    if (ack) unit.evidence.set(`${ack[1] || ""}:${ack[2]}`, ack[3]);
    const review = line.match(/^@evidence(Exclude)?Review\s+(\S+)\s+#(?:[0-9a-f]{7}|_______)\s+(.+)$/);
    if (review) unit.reviews.push({ line: index + 1, key: `${review[1] || ""}:${review[2]}`, prose: review[3] });
    if (line.trim() === "-->") inComment = false;
  }
  return result;
}

/** @param {string} prose @param {Set<string>} parts */
function faceTokens(prose, parts) {
  const found = [];
  for (const token of prose.match(/[A-Za-z][A-Za-z0-9-]*\/[A-Za-z][A-Za-z0-9-*]*(?:\/[A-Za-z][A-Za-z0-9-*]*)*/g) || []) {
    const [part, ...faces] = token.split("/");
    if (part === "body" || parts.has(part) || (part.endsWith("-*") && [...parts].some((member) => member.startsWith(part.slice(0, -1)))))
      for (const face of faces) found.push(`${part}/${face}`);
  }
  return found;
}

/** @param {ReturnType<typeof units>[number]} unit */
function bodyFaces(unit) {
  const found = new Set();
  for (const line of unit.body) {
    for (const token of line.match(/[A-Za-z][A-Za-z0-9-]*\/[A-Za-z][A-Za-z0-9-*]*(?:\/[A-Za-z][A-Za-z0-9-*]*)*/g) || []) {
      const [part, ...faces] = token.split("/");
      if (part === "body" || unit.parts.has(part) || (part.endsWith("-*") && [...unit.parts].some((member) => member.startsWith(part.slice(0, -1)))))
        for (const face of faces) found.add(`${part}/${face}`);
    }
  }
  return found;
}

/** @param {ReturnType<typeof units>} hosts @param {"duplicates"|"faces"} mode */
function audit(hosts, mode) {
  const errors = [];
  let reviews = 0;
  let addresses = 0;
  for (const unit of hosts) for (const review of unit.reviews) {
    reviews++;
    const at = `${unit.file}#${unit.anchor}:${review.line}`;
    if (mode === "duplicates") {
      if (!unit.evidence.has(review.key)) errors.push(`${at}: missing acknowledgement ${review.key}`);
      else if (unit.evidence.get(review.key) === review.prose) errors.push(`${at}: copied acknowledgement`);
      continue;
    }
    const available = bodyFaces(unit);
    for (const token of faceTokens(review.prose, unit.parts)) {
      addresses++;
      if (!available.has(token)) errors.push(`${at}: ${token} absent from H2 body`);
    }
  }
  if (reviews === 0) errors.push("no review rows found");
  if (mode === "faces" && addresses === 0) errors.push("no model face addresses found in reviews");
  return { reviews, addresses, errors };
}

if (process.argv.includes("--fixture-duplicates") || process.argv.includes("--fixture-faces")) {
  /** @param {string} reason @param {string} face */
  const fixture = (reason, face) => units("fixture.md", `## Fixture {#object}\n<!--\n@evidence settings/a.md#x ${reason}\n@evidenceReview settings/a.md#x #_______ ${face}\n-->\n@inventory state: body\nThe body/outer surface is exposed.`);
  const duplicates = process.argv.includes("--fixture-duplicates");
  const mode = duplicates ? "duplicates" : "faces";
  const green = audit(fixture("A storage destination exists.", "The `body/outer` surface is exposed."), mode);
  const red = audit(fixture("A storage destination exists.", duplicates ? "A storage destination exists." : "The `body/inner` surface is exposed."), mode);
  if (green.errors.length || red.errors.length !== 1) throw Error(`${mode} fixture did not separate green/red: ${JSON.stringify({ green, red })}`);
  console.log(`model review ${mode} fixture: green 0, mutation red ${red.errors.length}`);
} else {
  const mode = process.argv.includes("--faces") ? "faces" : "duplicates";
  const files = fs.readdirSync(path.join(root, "docs/models")).filter((name) => /^\d{3}-.+\.md$/.test(name));
  const extra = mode === "duplicates" ? ["docs/accounts/models/legacy-fitout.md", "docs/contracts/model-fitout-handoff.md"] : [];
  const hosts = [...files.map((name) => `docs/models/${name}`), ...extra]
    .flatMap((file) => units(file, fs.readFileSync(path.join(root, file), "utf8")));
  const result = audit(hosts, mode);
  for (const error of result.errors) console.error(error);
  console.log(`model review ${mode}: ${result.reviews} reviews, ${result.addresses} face tokens, ${result.errors.length} errors`);
  if (result.errors.length) process.exitCode = 1;
}

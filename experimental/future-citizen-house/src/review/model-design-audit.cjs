// Structural-presence and derived prose checks for every authored model H2.
// These checks count states and rows and compare variant claims with those
// rows; they do not certify that every named component is constructible.
// The population comes from files and syntax.
const fs = require("node:fs");
const path = require("node:path");
const { randomInt } = require("node:crypto");

const root = path.resolve(__dirname, "../..");
const files = fs.readdirSync(path.join(root, "docs/models"))
  .filter((name) => /^(?!000)\d{3}-.+\.md$/.test(name))
  .sort((a, b) => a.localeCompare(b));

/** @param {Map<string,string>} [overrides] */
function audit(overrides = new Map()) {
  /** @type {string[]} */ const errors = [];
  /** @type {Set<string>} */ const anchors = new Set();
  let h2 = 0, states = 0, partRows = 0;
  for (const file of files) {
    const source = overrides.get(file) ?? fs.readFileSync(path.join(root, "docs/models", file), "utf8");
    const chunks = source.split(/^## /m).slice(1);
    for (const chunk of chunks) {
      const anchor = /^.*\{#([^}]+)\}/.exec(chunk)?.[1];
      if (!anchor) { errors.push(`${file}: unanchored H2`); continue; }
      if (anchors.has(anchor)) errors.push(`${anchor}: duplicate H2`);
      anchors.add(anchor);
      h2++;
      if (!/ref0[1-5]/.test(chunk)) errors.push(`${anchor}: reference basis absent`);
      if (!/unverified/.test(chunk)) errors.push(`${anchor}: verification limit absent`);
      if (!/(?:정면|측면|상부|45°)/.test(chunk)) errors.push(`${anchor}: neutral observation absent`);
      const inventory = [...chunk.matchAll(/^@inventory\s+([^:]+):\s*(.+)$/gm)];
      const envelopes = new Set([...chunk.matchAll(/^\| @envelope \| ([^|]+) \|/gm)]
        .map((match) => match[1].trim()));
      const parts = [...chunk.matchAll(/^\| @part \| ([^|]+) \| ([^|]+) \|/gm)];
      partRows += parts.length;
      states += inventory.length;
      if (!inventory.length || !parts.length) errors.push(`${anchor}: state or part population absent`);
      for (const match of inventory) {
        const state = match[1].trim();
        if (!envelopes.has(state)) errors.push(`${anchor}/${state}: envelope absent`);
        if (!parts.some((row) => row[1].trim() === state)) errors.push(`${anchor}/${state}: part rows absent`);
      }
      const declared = new Set(inventory.map((match) => match[1].trim()));
      for (const row of parts) if (!declared.has(row[1].trim()))
        errors.push(`${anchor}/${row[1].trim()}: part row lacks inventory state`);
      for (const state of envelopes) if (!declared.has(state))
        errors.push(`${anchor}/${state}: envelope lacks inventory state`);
      /** @type {Record<string,number>} */
      const numberWords = { "한": 1, "하나": 1, "두": 2, "둘": 2, "세": 3, "셋": 3, "네": 4, "넷": 4 };
      /** @param {string} word */
      const count = (word) => Number(word) || numberWords[word];
      const members = new Map([...declared].map((state) => [state,
        new Set(parts.filter((row) => row[1].trim() === state).map((row) => row[2].trim()))]));
      for (const claim of chunk.matchAll(/(한|하나|두|둘|세|셋|네|넷|\d+)\s*부품과\s*다리\s*(한|하나|두|둘|세|셋|네|넷|\d+)/g)) {
        const possible = [...members].flatMap(([base, baseParts]) => [...members]
          .filter(([variant, variantParts]) => variant !== base && variantParts.size > baseParts.size &&
            [...baseParts].every((part) => variantParts.has(part)))
          .map(([variant, variantParts]) => {
            const added = [...variantParts].filter((part) => !baseParts.has(part));
            return { base, variant, legs: added.filter((part) => /(?:^|-)leg-?\d+$/.test(part)).length,
              other: added.filter((part) => !/(?:^|-)leg-?\d+$/.test(part)).length };
          }));
        if (!possible.some((pair) => pair.other === count(claim[1]) && pair.legs === count(claim[2])))
          errors.push(`${anchor}: prose variant addition ${claim[0]} contradicts part-state delta`);
      }
      for (const claim of chunk.matchAll(/각 leaf(?:는|의).{0,130}하단.{0,100}(?:고정 프레임|fixed-front-bottom)/g)) {
        const prefix = chunk.slice(Math.max(0, claim.index - 20), claim.index);
        const qualified = /`([a-z][a-z0-9-]*)`의\s*$/.exec(prefix)?.[1];
        const doorStates = [...members].filter(([state, names]) =>
          (!qualified || state.startsWith(qualified)) && [...names].some((part) => part.startsWith("door-")));
        if (!doorStates.length || doorStates.some(([, names]) => !names.has("fixed-front-bottom")))
          errors.push(`${anchor}: prose leaf-bottom frame contradicts variant parts`);
      }
      if (/(?:네|4)\s*(?:다리|발)\s*중심.{0,80}원점/.test(chunk)) {
        const legRows = chunk.split(/\r?\n/).filter((line) => /^\| @part \|/.test(line))
          .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
          .filter((cells) => /^leg-[0-3]$/.test(cells[2]));
        /** @type {Map<string,number[][]>} */ const grouped = new Map();
        for (const cells of legRows) {
          const bounds = [cells[4], cells[6]].map((cell) => cell.replaceAll("−", "-").split("..").map(Number));
          const center = bounds.map(([lo, hi]) => (lo + hi) / 2);
          const existing = grouped.get(cells[1]) ?? [];
          existing.push(center);
          grouped.set(cells[1], existing);
        }
        if (![...grouped.values()].some((centers) => centers.length === 4 &&
          centers.every(([x, z]) => Number.isFinite(x) && Number.isFinite(z)) &&
          Math.abs(centers.reduce((sum, [x]) => sum + x, 0)) < 0.000001 &&
          Math.abs(centers.reduce((sum, [, z]) => sum + z, 0)) < 0.000001))
          errors.push(`${anchor}: prose leg-centre origin contradicts measured leg centres`);
      }
      const ordinalLegs = chunk.split(/\r?\n/).filter((line) => /^\| @part \|/.test(line))
        .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
        .filter((cells) => /^leg-[0-3]$/.test(cells[2]));
      for (const state of new Set(ordinalLegs.map((cells) => cells[1]))) {
        const legs = ordinalLegs.filter((cells) => cells[1] === state).map((cells) => {
          const center = [cells[4], cells[6]].map((cell) => {
            const [lo, hi] = cell.replaceAll("−", "-").split("..").map(Number);
            return (lo + hi) / 2;
          });
          return { id: cells[2], x: center[0], z: center[1] };
        });
        if (legs.length !== 4 || new Set(legs.map((leg) => leg.x)).size !== 2 ||
          new Set(legs.map((leg) => leg.z)).size !== 2) continue;
        const ordered = [...legs].sort((a, b) => a.x - b.x || a.z - b.z);
        if (ordered.some((leg, index) => leg.id !== `leg-${index}`))
          errors.push(`${anchor}/${state}: leg IDs contradict X-then-Z spatial order`);
      }
    }
  }
  return { scope: "structural-presence-and-derived-claims", files: files.length, prototypes: h2, states, partRows, errors };
}

const result = audit();
console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;
if (process.argv.includes("--fixture")) {
  const candidates = files.flatMap((file) => {
    const source = fs.readFileSync(path.join(root, "docs/models", file), "utf8");
    return [...source.matchAll(/^@inventory\s+[^:]+:\s*.+$/gm)].map((match) => ({ file, source, row: match[0] }));
  });
  const selected = candidates[randomInt(candidates.length)];
  const mutated = audit(new Map([[selected.file, selected.source.replace(selected.row, "")]]));
  const red = mutated.errors.length > 0;
  console.log(JSON.stringify({ candidates: candidates.length, mutations: 1, red: red ? 1 : 0,
    selectedFile: selected.file, error: mutated.errors[0] }, null, 2));
  if (!red) process.exitCode = 1;
}
module.exports = { audit };

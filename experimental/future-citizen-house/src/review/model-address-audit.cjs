// Prose face addresses and state-local part inventories must name the same
// population. The generated state-address record locks each reviewed state;
// regenerating it is a design edit, never part of validation.
const fs = require("node:fs");
const path = require("node:path");
const { inventory } = require("./model-inventory.cjs");

const root = path.resolve(__dirname, "../..");
const files = ["001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"];
const populations = inventory(root);
const startMarker = "<!-- @generated-address-state:start -->";
const endMarker = "<!-- @generated-address-state:end -->";

function writeStateAddresses() {
  for (const name of files) {
    const file = path.join(root, "docs/models", `${name}.md`);
    const original = fs.readFileSync(file, "utf8");
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    const blocks = original.split(/(?=^## )/m);
    const next = blocks.map((block) => {
      const match = /^## .*\{#([^}]+)\}/.exec(block);
      const states = match && populations.get(match[1]);
      if (!states) return block;
      const without = block.replace(new RegExp(`\\r?\\n${startMarker}[\\s\\S]*?${endMarker}\\r?\\n?`), "").trimEnd();
      const declarations = [...states].map(([state, parts]) =>
        `@address-state ${state}: ${[...parts].join(", ")}`);
      return `${without}${eol}${eol}${startMarker}${eol}${declarations.join(eol)}${eol}${endMarker}${eol}${eol}`;
    }).join("").replace(/(?:\r?\n)+$/, eol);
    if (next !== original) fs.writeFileSync(file, next);
  }
}

/** @param {string} token @param {Set<string>} members */
function resolvePart(token, members) {
  const range = /^(.*?)-(\d+)\.\.(\d+|n-1|2n-1)$/.exec(token);
  if (range) {
    const start = Number(range[2]);
    if (/^\d+$/.test(range[3]))
      return Array.from({ length: Number(range[3]) - start + 1 }, (_, i) => `${range[1]}-${start + i}`)
        .filter((part) => members.has(part));
    return [...members].filter((part) => part.startsWith(`${range[1]}-`) &&
      /^\d+$/.test(part.slice(range[1].length + 1)) && Number(part.slice(range[1].length + 1)) >= start);
  }
  const symbolic = token.replace(/-(?:j|i)(?=-|$)/g, "-[0-9]+");
  if (symbolic !== token) {
    const pattern = new RegExp(`^${symbolic}$`);
    return [...members].filter((part) => pattern.test(part));
  }
  return members.has(token) ? [token] : [];
}

/** @param {string} token @param {Set<string>} members */
function addressParts(token, members) {
  const segments = token.split("/");
  const first = segments[0];
  const candidates = [first];
  const dash = first.lastIndexOf("-");
  if (dash > 0) {
    const stem = first.slice(0, dash + 1);
    for (const segment of segments.slice(1)) candidates.push(stem + segment);
  }
  return [...new Set(candidates.flatMap((candidate) => resolvePart(candidate, members)))];
}

/** @param {Map<string,string>} [overrides] */
function audit(overrides = new Map()) {
  const measuredPopulations = overrides.size ? inventory(root, overrides) : populations;
  /** @type {string[]} */
  const errors = [];
  let addressLines = 0, proseParts = 0, states = 0, stateParts = 0;
  for (const name of files) {
    const source = overrides.get(name) ?? fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    let anchor = "";
    /** @type {string[]} */ let section = [];
    /** @param {string} owner @param {string[]} lines */
    const check = (owner, lines) => {
      if (!owner) return;
      const inventoryStates = measuredPopulations.get(owner);
      if (!inventoryStates) { errors.push(`${owner}: no inventory owner`); return; }
      const all = new Set([...inventoryStates.values()].flatMap((set) => [...set]));
      const named = new Set();
      const addressStates = new Map();
      let localAddressLines = 0;
      for (const line of lines) {
        const stateLine = /^@address-state\s+([^:]+):\s*(.+)$/.exec(line);
        if (stateLine) {
          const state = stateLine[1].trim();
          if (addressStates.has(state)) errors.push(`${owner}/${state}: duplicate address state`);
          const parts = stateLine[2].split(",").map((token) => token.trim());
          if (new Set(parts).size !== parts.length) errors.push(`${owner}/${state}: duplicate address part`);
          addressStates.set(state, new Set(parts));
          continue;
        }
        if (/^\||^@|^<!--/.test(line)) continue;
        let matchedLine = false;
        for (const match of line.matchAll(/`([a-z][a-z0-9.\-/]+)`/g)) {
          const token = match[1];
          // A model ID's first slash selects a prototype; it is not a local
          // part/face path. Its destination is checked by the child audit.
          if (/^(cabinet|fixed-bed|murphy-bed|work-desk|living-sofa|portable-lamp|potted-plant|laundry-washer|laundry-dryer|book|folded-towel|bedroom-rug|round-rug|wall-art)\//.test(token)) continue;
          const resolved = addressParts(token, all);
          for (const part of resolved) named.add(part);
          proseParts += resolved.length;
          if (resolved.length && token.includes("/")) matchedLine = true;
        }
        if (matchedLine) { addressLines++; localAddressLines++; }
      }
      if (!localAddressLines) errors.push(`${owner}: no prose address line`);
      for (const part of all) if (!named.has(part))
        errors.push(`${owner}: inventoried part ${part} has no prose face address`);
      for (const [state, members] of inventoryStates) {
        states++;
        stateParts += members.size;
        const addressed = addressStates.get(state);
        if (!addressed) { errors.push(`${owner}/${state}: no @address-state declaration`); continue; }
        for (const part of members) if (!addressed.has(part))
          errors.push(`${owner}/${state}: inventory part ${part} has no state address`);
        for (const part of addressed) if (!members.has(part))
          errors.push(`${owner}/${state}: state address ${part} has no inventory part`);
      }
      for (const state of addressStates.keys()) if (!inventoryStates.has(state))
        errors.push(`${owner}/${state}: address state has no inventory state`);
    };
    for (const line of source.split(/\r?\n/)) {
      const heading = /^## .*\{#([^}]+)\}/.exec(line);
      if (heading) { check(anchor, section); anchor = heading[1]; section = []; }
      else if (anchor) section.push(line);
    }
    check(anchor, section);
  }
  return { prototypes: measuredPopulations.size, states, stateParts, addressLines, proseParts, errors };
}

function fixture() {
  const cases = [
    ["003-service-fixtures", "`rim/upper/edge/underside`, `zone-0..3", "`zone-0..3"],
    ["003-service-fixtures", "@inventory default: body, door-lower, door-upper, handle-lower, handle-upper, toe", "@inventory default: body, door-lower, door-upper, handle-lower, handle-upper, toe, badge"],
    ["001-seating-and-work", "@inventory straight: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1, pillow-2", "@inventory straight: frame, leg-0, leg-1, leg-2, leg-3, seat-0, seat-1, seat-2, back-frame, back-cushion-0, back-cushion-1, back-cushion-2, arm-left, arm-right, pillow-0, pillow-1"],
  ];
  let red = 0;
  for (const [name, before, after] of cases) {
    const source = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    if (!source.includes(before)) throw Error(`address fixture source absent: ${before}`);
    const changed = source.replace(before, after);
    const result = audit(new Map([[name, changed]]));
    if (!result.errors.length) throw Error(`address fixture remained green: ${before}`);
    red++;
  }
  return { mutations: cases.length, red };
}

if (require.main === module) {
  if (process.argv.includes("--write")) writeStateAddresses();
  const result = audit();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
  if (process.argv.includes("--fixture")) console.log(JSON.stringify(fixture(), null, 2));
}
module.exports = { audit, fixture };

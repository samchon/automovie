// Prose face addresses and independently authored state-local part inventories
// must name the same population. Validation never writes either population.
const fs = require("node:fs");
const path = require("node:path");
const { randomInt } = require("node:crypto");
const { inventory } = require("./model-inventory.cjs");

const root = path.resolve(__dirname, "../..");
const files = fs.readdirSync(path.join(root, "docs/models"))
  .filter((name) => /^(?!000)\d{3}-.+\.md$/.test(name)).sort((a, b) => a.localeCompare(b))
  .map((name) => name.slice(0, -3));
const populations = inventory(root);
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
      /** @param {string} line */
      const stableAddress = (line) => /안정(?: 면)? 주소|주소는/.test(line);
      /** @type {Map<string,Set<string>>} */ const stableFaces = new Map();
      for (const line of lines.filter(stableAddress))
        for (const match of line.matchAll(/`([a-z][a-z0-9.\-/]+)`/g)) {
          const [part, ...faces] = match[1].split("/");
          if (!all.has(part) || !faces.length) continue;
          const declared = stableFaces.get(part) ?? new Set();
          for (const face of faces) declared.add(face);
          stableFaces.set(part, declared);
        }
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
          const segments = token.split("/");
          if (!stableAddress(line) && segments.length === 2 && all.has(segments[0]) &&
            stableFaces.has(segments[0]) && !stableFaces.get(segments[0])?.has(segments[1]))
            errors.push(`${owner}: ${token} prose face absent from stable address`);
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
  /** @type {Array<{name:string,line:string,kind:string}>} */
  const candidates = [];
  for (const name of files) {
    const source = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    for (const line of source.split(/\r?\n/))
      if (/^@(address-state|inventory)\s+[^:]+:\s*\S/.test(line))
        candidates.push({ name, line, kind: line.startsWith("@address-state") ? "address" : "inventory" });
  }
  if (!candidates.length) throw Error("empty model state-address mutation population");
  const remaining = [...candidates];
  const sampled = [];
  while (remaining.length && sampled.length < 10)
    sampled.push(remaining.splice(randomInt(remaining.length), 1)[0]);
  const results = [];
  for (const candidate of sampled) {
    const source = fs.readFileSync(path.join(root, "docs/models", `${candidate.name}.md`), "utf8");
    const changed = source.split(/\r?\n/).filter((line) => line !== candidate.line).join("\n");
    if (changed === source) throw Error(`${candidate.name}: selected ${candidate.kind} row unchanged`);
    const findings = audit(new Map([[candidate.name, changed]])).errors;
    results.push({ owner: candidate.name, kind: candidate.kind, red: findings.length > 0,
      first: findings[0] || null });
  }
  const red = results.filter((entry) => entry.red).length;
  if (red !== results.length) throw Error(`random model address mutations red ${red}/${results.length}`);
  return { population: candidates.length, mutations: results.length, red, results };
}

if (require.main === module) {
  const result = audit();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
  if (process.argv.includes("--fixture")) console.log(JSON.stringify(fixture(), null, 2));
}
module.exports = { audit, fixture };

// Measures authored model-part envelopes and contacts before modelSources exist.
// Each `@part` row is inside its prototype H2, beside the prose that owns it.
// Run from the production root: node src/review/model-part-audit.cjs
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const names = ["001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"];
const epsilon = 0.000001;
/** @typedef {{state:string,id:string,shape:string,x:[number,number],y:[number,number],z:[number,number],contact:string[]}} Part */

function sections() {
  /** @type {Map<string, string[]>} */
  const result = new Map();
  for (const name of names) {
    const lines = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8").split(/\r?\n/);
    let anchor;
    for (const line of lines) {
      const h2 = /^## .*\{#([^}]+)\}/.exec(line);
      if (h2) {
        anchor = h2[1];
        if (result.has(anchor)) throw Error(`duplicate H2 ${anchor}`);
        result.set(anchor, []);
      } else if (anchor) result.get(anchor)?.push(line);
    }
  }
  return result;
}

/** @param {string} source @param {string} label @returns {[number,number]} */
function interval(source, label) {
  const match = /^\s*([−-]?(?:\d+\.)?\d+)\.\.([−-]?(?:\d+\.)?\d+)\s*$/.exec(source);
  if (!match) throw Error(`${label}: expected min..max, got ${source}`);
  /** @type {[number,number]} */
  const bounds = [Number(match[1].replace("−", "-")), Number(match[2].replace("−", "-"))];
  if (!bounds.every(Number.isFinite) || bounds[1] - bounds[0] <= epsilon)
    throw Error(`${label}: empty or invalid ${source}`);
  return bounds;
}

/** @param {string[]} lines @param {string} anchor */
function parse(lines, anchor) {
  const rows = lines.filter((line) => /^\| @(envelope|part) \|/.test(line));
  /** @type {Map<string, Part>} */
  const envelopes = new Map();
  /** @type {Map<string, Part>} */
  const parts = new Map();
  /** @type {Map<string, string[]>} */
  const inventory = new Map();
  /** @type {Set<string>} */
  const miterJoints = new Set();
  for (const line of lines) {
    const list = /^@inventory\s+([^:]+):\s*(.+)$/.exec(line);
    if (list) {
      const state = list[1].trim();
      if (inventory.has(state)) throw Error(`${anchor}: duplicate inventory ${state}`);
      inventory.set(state, list[2].split(",").map((value) => value.trim()));
    }
    const joint = /^@joint\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*(miter45-xz)$/.exec(line);
    if (joint) miterJoints.add(`${joint[1].trim()}/${[joint[2].trim(), joint[3].trim()].sort((a, b) => a.localeCompare(b)).join("/")}`);
  }
  for (const line of rows) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 8) throw Error(`${anchor}: eight cells required in ${line}`);
    const [kind, state, id, shape, xs, ys, zs, contact] = cells;
    const entry = { state, id, shape, x: interval(xs, `${anchor}/${state}/${id}/x`),
      y: interval(ys, `${anchor}/${state}/${id}/y`), z: interval(zs, `${anchor}/${state}/${id}/z`),
      contact: contact === "-" ? [] : contact.split(",").map((value) => value.trim()) };
    const key = `${state}/${id}`;
    if (kind === "@envelope") {
      if (id !== "*" || shape !== "bounds" || envelopes.has(state))
        throw Error(`${anchor}: duplicate or invalid envelope ${key}`);
      envelopes.set(state, entry);
    } else {
      if (!["box", "cylinder", "curved", "hollow", "mitered-box"].includes(shape) || parts.has(key))
        throw Error(`${anchor}: duplicate or invalid part ${key}`);
      parts.set(key, entry);
    }
  }
  return { envelopes, parts, inventory, miterJoints };
}

/** @param {Part} a @param {Part} b */
function overlap(a, b) {
  return /** @type {const} */ (["x", "y", "z"]).map((axis) => Math.min(a[axis][1], b[axis][1]) - Math.max(a[axis][0], b[axis][0]));
}

/** @param {Part} a @param {Part} b */
function surfaceContact(a, b) {
  const separation = overlap(a, b);
  return separation.every((size) => size >= -epsilon) &&
    separation.filter((size) => Math.abs(size) <= epsilon).length === 1 &&
    separation.filter((size) => size > epsilon).length === 2;
}

/** @param {Map<string,string[]>} allSections */
function audit(allSections) {
  const errors = [];
  let examined = 0;
  let measuredPrototypes = 0;
  for (const [anchor, lines] of allSections) {
    const { envelopes, parts, inventory, miterJoints } = parse(lines, anchor);
    const provedMiterJoints = new Set();
    if (!envelopes.size) { errors.push(`${anchor}: no @envelope rows`); continue; }
    measuredPrototypes++;
    for (const [state, envelope] of envelopes) {
      const stateParts = [...parts.values()].filter((part) => part.state === state);
      if (!stateParts.length) errors.push(`${anchor}/${state}: no @part rows`);
      const byId = new Map(stateParts.map((part) => [part.id, part]));
      const names = inventory.get(state);
      if (!names) errors.push(`${anchor}/${state}: no @inventory row`);
      else {
        for (const name of names) if (!byId.has(name)) errors.push(`${anchor}/${state}: inventoried part ${name} absent`);
        for (const part of stateParts) if (!names.includes(part.id)) errors.push(`${anchor}/${state}: part ${part.id} missing from inventory`);
        if (new Set(names).size !== names.length) errors.push(`${anchor}/${state}: duplicate inventory name`);
      }
      for (const part of stateParts) {
        examined++;
        for (const axis of /** @type {const} */ (["x", "y", "z"]))
          if (part[axis][0] < envelope[axis][0] - epsilon || part[axis][1] > envelope[axis][1] + epsilon)
            errors.push(`${anchor}/${state}/${part.id}: ${axis} exits declared envelope`);
        if (!part.contact.length) errors.push(`${anchor}/${state}/${part.id}: contact path absent`);
        for (const target of part.contact) {
          if (target === "ground") {
            if (Math.abs(part.y[0]) > epsilon) errors.push(`${anchor}/${state}/${part.id}: misses ground`);
          } else if (target === "wall") {
            if (Math.abs(part.z[0]) > epsilon) errors.push(`${anchor}/${state}/${part.id}: misses wall datum`);
          } else {
            const adjacent = byId.get(target);
            if (!adjacent) errors.push(`${anchor}/${state}/${part.id}: contact target ${target} absent`);
            else if (!surfaceContact(part, adjacent))
              errors.push(`${anchor}/${state}/${part.id}: no face contact with ${target}`);
          }
        }
      }
      for (let i = 0; i < stateParts.length; i++) for (let j = i + 1; j < stateParts.length; j++) {
        const a = stateParts[i], b = stateParts[j], extent = overlap(a, b);
        if (extent.every((size) => size > epsilon)) {
          if (a.shape === "box" && b.shape === "box")
            errors.push(`${anchor}/${state}: ${a.id} intersects ${b.id} (${extent.join(" x ")})`);
          else {
            const key = `${state}/${[a.id, b.id].sort((left, right) => left.localeCompare(right)).join("/")}`;
            const miter = miterJoints.has(key) && a.shape === "mitered-box" && b.shape === "mitered-box" &&
              Math.abs(extent[0] - 0.009) <= epsilon && Math.abs(extent[1] - 0.018) <= epsilon &&
              Math.abs(extent[2] - 0.009) <= epsilon &&
              (a.x[1] - a.x[0] > 0.20) !== (b.x[1] - b.x[0] > 0.20) &&
              (a.z[1] - a.z[0] > 0.20) !== (b.z[1] - b.z[0] > 0.20);
            if (miter) provedMiterJoints.add(key);
            else errors.push(`${anchor}/${state}: ${a.id} / ${b.id} needs shape intersection proof (${a.shape}/${b.shape})`);
          }
        }
      }
      const reached = new Set(stateParts.filter((part) => part.contact.includes("ground") || part.contact.includes("wall")).map((part) => part.id));
      let changed = true;
      while (changed) {
        changed = false;
        for (const part of stateParts) if (!reached.has(part.id) && part.contact.some((target) => reached.has(target))) {
          reached.add(part.id); changed = true;
        }
      }
      for (const part of stateParts) if (!reached.has(part.id))
        errors.push(`${anchor}/${state}/${part.id}: disconnected from ground or wall`);
    }
    for (const part of parts.values()) if (!envelopes.has(part.state))
      errors.push(`${anchor}/${part.state}/${part.id}: undeclared state`);
    for (const state of inventory.keys()) if (!envelopes.has(state))
      errors.push(`${anchor}/${state}: inventory for undeclared state`);
    for (const key of miterJoints) if (!provedMiterJoints.has(key))
      errors.push(`${anchor}/${key}: miter proof has no qualifying joint`);
  }
  return { prototypes: allSections.size, measuredPrototypes, parts: examined, errors };
}

if (process.argv.includes("--fixture")) {
  const original = sections().get("dining-table");
  if (!original) throw Error("dining-table H2 absent");
  /** @param {string[]} lines */
  const fixture = (lines) => audit(new Map([["dining-table", lines]]));
  const baseline = fixture(original);
  if (baseline.errors.length || baseline.parts !== 5) throw Error(`dining-table baseline failed: ${baseline.errors}`);
  const mutations = [
    ["out of bounds", "-0.90..0.90 | 0.696..0.74", "-0.90..1.10 | 0.696..0.74", "exits declared envelope"],
    ["lifted leg", "-0.8325..-0.7875 | 0..0.696", "-0.8325..-0.7875 | 0.05..0.696", "misses ground"],
    ["missing part", "| @part | default | leg-0 | box | -0.8325..-0.7875 | 0..0.696 | -0.3925..-0.3475 | ground,top |", "", "contact target leg-0 absent"],
    ["overlap", "| @part | default | leg-0 | box | -0.8325..-0.7875 | 0..0.696 | -0.3925..-0.3475 | ground,top |",
      "| @part | default | leg-0 | box | -0.8325..-0.7875 | 0..0.696 | 0.3475..0.3925 | ground,top |", "intersects leg-1"],
    ["unreferenced leg removed", "| @part | default | leg-3 | box | 0.7875..0.8325 | 0..0.696 | 0.3475..0.3925 | ground,top |", "", "inventoried part leg-3 absent"]
  ];
  const results = mutations.map(([label, before, after, expected]) => {
    const source = original.join("\n");
    if (!source.includes(before)) throw Error(`${label}: mutation source absent`);
    const measured = fixture(source.replace(before, after).split("\n"));
    if (!measured.errors.some((error) => error.includes(expected)))
      throw Error(`${label}: mutation did not reach ${expected}: ${measured.errors}`);
    return { label, caught: true };
  });
  const stool = sections().get("island-stool");
  if (!stool) throw Error("island-stool H2 absent");
  const stoolBaseline = audit(new Map([["island-stool", stool]]));
  if (stoolBaseline.errors.length) throw Error(`island-stool baseline failed: ${stoolBaseline.errors}`);
  const movedMiter = stool.join("\n").replace("-0.1265..-0.1085 | leg-0,leg-2", "-0.1265..-0.1075 | leg-0,leg-2");
  if (movedMiter === stool.join("\n")) throw Error("island-stool miter mutation source absent");
  const miterErrors = audit(new Map([["island-stool", movedMiter.split("\n")]])).errors;
  if (!miterErrors.some((error) => error.includes("needs shape intersection proof")))
    throw Error(`miter mutation was not caught: ${miterErrors}`);
  results.push({ label: "miter overlap changed", caught: true });
  const bed = sections().get("fixed-bed");
  if (!bed) throw Error("fixed-bed H2 absent");
  const bedBaseline = audit(new Map([["fixed-bed", bed]]));
  if (bedBaseline.errors.length || bedBaseline.parts !== 27)
    throw Error(`fixed-bed baseline failed: ${bedBaseline.errors}`);
  const bedSource = bed.join("\n");
  const removedDeck = bedSource.replace("| @part | 1000 | support-deck | box | -0.515..0.515 | 0.26..0.28 | -1.03..1.03 | frame-side-left,frame-side-right,mattress |", "");
  if (removedDeck === bedSource || !audit(new Map([["fixed-bed", removedDeck.split("\n")]])).errors.some((error) => error.includes("inventoried part support-deck absent")))
    throw Error("fixed-bed support deck removal did not fail");
  results.push({ label: "support deck removed", caught: true });
  let measuredParts = 0;
  let mutationChecks = 0;
  for (const [anchor, lines] of sections()) {
    const { envelopes, parts } = parse(lines, anchor);
    if (!envelopes.size) continue;
    const ownBaseline = audit(new Map([[anchor, lines]]));
    if (ownBaseline.errors.length) throw Error(`${anchor}: fixture baseline failed: ${ownBaseline.errors}`);
    for (const part of parts.values()) {
      measuredParts++;
      const index = lines.findIndex((line) => line.startsWith(`| @part | ${part.state} | ${part.id} |`));
      if (index < 0) throw Error(`${anchor}/${part.state}/${part.id}: row absent`);
      const cells = lines[index].split("|").slice(1, -1).map((cell) => cell.trim());
      /** @param {string} mutated @param {string} expected */
      const check = (mutated, expected) => {
        const copy = lines.slice();
        copy[index] = mutated;
        const found = audit(new Map([[anchor, copy]])).errors;
        if (!found.some((error) => error.includes(expected)))
          throw Error(`${anchor}/${part.state}/${part.id}: mutation missed ${expected}: ${found}`);
        mutationChecks++;
      };
      const shifted = cells.slice(); shifted[4] = "100..100.01";
      check(`| ${shifted.join(" | ")} |`, "exits declared envelope");
      const lifted = cells.slice(); lifted[5] = "100..100.01";
      check(`| ${lifted.join(" | ")} |`, "exits declared envelope");
      check("", `inventoried part ${part.id} absent`);
      const isolated = cells.slice(); isolated[7] = "-";
      check(`| ${isolated.join(" | ")} |`, "contact path absent");
    }
  }
  console.log(JSON.stringify({ baselineParts: baseline.parts, measuredParts, mutationChecks, mutations: results }, null, 2));
} else {
  const result = audit(sections());
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}

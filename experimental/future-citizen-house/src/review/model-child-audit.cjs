// Read-only census of every compiled legacy fit-out child in both flex states.
// The correspondence decision is documented at docs/accounts/models/legacy-fitout.md.
// Run from the production root: node src/review/model-child-audit.cjs
const fs = require("node:fs");
const path = require("node:path");
const { inventory } = require("./model-inventory.cjs");
require("tsx/cjs/api").register();
const { buildHouse } = require("../house/build.ts");

/** @typedef {{ id: string, children: Set<string>, states: Set<"work" | "guest"> }} LegacyRoot */
/** @typedef {{ id: string, part?: string, retired?: string }} Correspondence */

const root = path.resolve(__dirname, "../..");
const modelInventory = inventory(root);
const account = fs.readFileSync(path.join(root, "docs/accounts/models/legacy-fitout.md"), "utf8");
const rootBlock = account.split("## Item root 대응")[1]?.split("## 직접 primitive와 방 lining")[0];
if (!rootBlock) throw Error("legacy root account is missing");
const accountRoots = rootBlock.split(/\r?\n/).flatMap((line) => {
  if (!line.startsWith("| ") || line.startsWith("| Source ") || line.startsWith("| ---")) return [];
  const cells = line.split("|").slice(1, -1).map((x) => x.trim());
  const label = cells[1].match(/`([^`]+)`/)?.[1];
  if (!label) throw Error(`root row has no ID: ${line}`);
  const expression = "^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/<[^>]+>/g, ".+") + "$";
  return [{ label, rx: new RegExp(expression), owner: cells[2] }];
});

// The account is an input to the check, not a prose echo of the route() code.
// Every explicitly retired child must be in its finite table, and every helper
// exported by the legacy fit-out source must have an account row.
const retiredBlock = account.split("| 명명 퇴역 child ID 또는 유한 전개 |")[1]?.split(/\r?\n\r?\n/)[0];
const helperBlock = account.split("| helper 또는 수제 child |")[1]?.split(/\r?\n\r?\n/)[0];
if (!retiredBlock || !helperBlock) throw Error("legacy child or helper table is missing");

/** @param {string} pattern @returns {string[]} */
function expandRetirement(pattern) {
  const variable = /<([xz])>/.exec(pattern);
  if (variable) return [-1, 1].flatMap((value) => expandRetirement(pattern.replace(variable[0], String(value))));
  const range = /(\d+)\.\.(\d+)$/.exec(pattern);
  if (range) return Array.from({ length: Number(range[2]) - Number(range[1]) + 1 }, (_, i) =>
    pattern.slice(0, range.index) + (Number(range[1]) + i));
  const alternatives = /(\d+)\/(\d+)$/.exec(pattern);
  if (alternatives) return [alternatives[1], alternatives[2]].map((value) => pattern.slice(0, alternatives.index) + value);
  return [pattern];
}

/** @type {Set<string>} */
const accountRetired = new Set();
/** @type {string[]} */
const accountErrors = [];
for (const line of retiredBlock.split(/\r?\n/).filter((value) => /^\| `/.test(value))) {
  const cells = line.split("|").slice(1, -1).map((value) => value.trim());
  const ids = [...cells[0].matchAll(/`([^`]+)`/g)].flatMap((match) => expandRetirement(match[1]));
  if (ids.length !== Number(cells[1])) accountErrors.push(`retirement row count ${cells[0]}: ${ids.length} != ${cells[1]}`);
  for (const id of ids) {
    if (accountRetired.has(id)) accountErrors.push(`${id}: duplicate retirement row`);
    accountRetired.add(id);
  }
}
const helperRows = new Set([...helperBlock.matchAll(/^\| `(\w+)\(\)` \|/gm)].map((match) => match[1]));
const interior = fs.readFileSync(path.join(root, "src/house/rooms/interior.ts"), "utf8");
const sourceHelpers = new Set([...interior.matchAll(/^export function (\w+)\(/gm)]
  .map((match) => match[1]).filter((name) => name !== "lining" && name !== "lights"));
for (const name of sourceHelpers) if (!helperRows.has(name)) accountErrors.push(`${name}(): no helper account row`);
for (const name of helperRows) if (!sourceHelpers.has(name)) accountErrors.push(`${name}(): account row has no helper export`);

/** @type {Map<string,string>} */
const modelH2 = new Map();
for (const filename of ["001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"]) {
  const lines = fs.readFileSync(path.join(root, "docs/models", `${filename}.md`), "utf8").split(/\r?\n/);
  let anchor = "";
  for (const line of lines) {
    const heading = /^## .*\{#([^}]+)\}/.exec(line);
    if (heading) { anchor = heading[1]; modelH2.set(anchor, ""); }
    else if (anchor) modelH2.set(anchor, modelH2.get(anchor) + "\n" + line);
  }
}
const specialAnchor = { "work-display": "work-equipment", "work-keyboard": "work-equipment", cabinet: "cabinet-and-shelf",
  "wall-worktop": "cooking-appliances", cooktop: "cooking-appliances", oven: "cooking-appliances",
  "laundry-washer": "laundry-appliances", "laundry-dryer": "laundry-appliances" };
const routedState = { "work-display": "display", "work-keyboard": "keyboard",
  "wall-worktop": "wall-worktop", cooktop: "cooktop", oven: "oven",
  "laundry-washer": "washer", "laundry-dryer": "dryer" };
/** @param {string} value */
function escapePattern(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
/** @param {string} body @param {string} part */
function hasPart(body, part) {
  const direct = new RegExp("`" + escapePattern(part) + "[/`]");
  if (direct.test(body)) return true;
  const namedSide = /^(.*)-(left|right|upper|lower|negative|positive)$/.exec(part);
  if (namedSide && new RegExp("`" + escapePattern(namedSide[1]) + "-(?:left/right|right/left|upper/lower|lower/upper|negative/positive)[/`]").test(body)) return true;
  const numbered = /^(.*)-(\d+)$/.exec(part);
  if (numbered && new RegExp("`" + escapePattern(numbered[1]) + "-(?:\\d+\\.\\.\\d+|\\d+\\.\\.n-1|j)[/`]").test(body)) return true;
  return false;
}
/** @param {string} address */
function addressExists(address) {
  const pieces = address.split("/");
  const anchor = /** @type {Record<string,string>} */ (specialAnchor)[pieces[0]] || pieces[0];
  const body = modelH2.get(anchor);
  if (!body) return false;
  const part = pieces[0] === "cabinet" && pieces[1] === "island-base" ? pieces[2] : pieces[1];
  const states = modelInventory.get(anchor);
  const state = /** @type {Record<string,string>} */ (routedState)[pieces[0]];
  const matchingStates = state ? [...(states || new Map())].filter(([key]) => key === state)
    : pieces[0] === "cabinet" && pieces[1] === "island-base"
      ? [...(states || new Map())].filter(([key]) => key.startsWith("island-base/"))
      : [...(states || new Map())];
  if (!part || !matchingStates.some(([, members]) => members.has(part)) || !hasPart(body, part)) return false;
  if (pieces.length <= (pieces[0] === "cabinet" && pieces[1] === "island-base" ? 3 : 2)) return true;
  const face = pieces.at(-1);
  return [...body.matchAll(/`([^`]+)`/g)].some((match) => match[1].startsWith(part + "/") && match[1].split("/").includes(face || ""));
}

function legacyRoots() {
  /** @type {Map<string, LegacyRoot>} */
  const byId = new Map();
  for (const flex of /** @type {const} */ (["work", "guest"])) {
    const elements = buildHouse({ privacy: "day", flex }).elements;
    const roots = elements.filter((e) => e.kind === "fit-out" && e.parent === "house-root");
    for (const item of roots) {
      const entry = byId.get(item.id) || { id: item.id, children: new Set(), states: new Set() };
      entry.states.add(flex);
      for (const child of elements.filter((e) => e.parent === item.id)) entry.children.add(child.id.slice(item.id.length + 1));
      byId.set(item.id, entry);
    }
  }
  return [...byId.values()];
}

/** @param {string} child */
function legIndex(child) {
  const match = /^leg-(-?1)-(-?1)$/.exec(child);
  if (!match) return null;
  return (Number(match[1]) === 1 ? 2 : 0) + (Number(match[2]) === 1 ? 1 : 0);
}

/** @param {string} reason @returns {{ retired: string, part?: undefined }} */
function retired(reason) { return { retired: reason }; }
/** @param {string} part @returns {{ part: string, retired?: undefined }} */
function mapped(part) { return { part }; }

/** @param {LegacyRoot} item @param {string} child @param {string} owner */
function route(item, child, owner) {
  const id = item.id;
  const leg = legIndex(child);
  const shelf = /^shelf-(\d+)$/.exec(child);
  const side = /^side-(-?1)$/.exec(child);
  const murphySide = /^side-(-?0\.63)$/.exec(child);
  const door = /^door-(-?1)$/.exec(child);
  const handle = /^handle-(-?1)$/.exec(child);
  const lastShelf = Math.max(-1, ...[...item.children].flatMap((x) => /^shelf-(\d+)$/.test(x) ? [Number(x.slice(6))] : []));
  const isDrawer = /cabinet\/(?:nightstand|vanity|media|kitchen-base)\//.test(owner);
  const cabinetId = owner.match(/cabinet\/([a-z-]+)\/(\d+)x\d+x\d+/);
  const leafLast = cabinetId ? Math.max(2, Math.ceil((Number(cabinetId[2]) / 1000 - 0.006) / 0.60)) - 1 : -1;

  if (id === "flex-murphy-frame") {
    if (child === "back") return mapped("murphy-bed/case-back");
    if (murphySide) return mapped(`murphy-bed/case-side-${murphySide[1].startsWith("-") ? "left" : "right"}`);
    if (child === "top") return mapped("murphy-bed/case-top");
    if (child === "closed-panel") return mapped("murphy-bed/closed-panel");
    if (child === "pull") return mapped("murphy-bed/pull");
  }
  if (id === "flex-guest-bed") {
    if (child === "base") return mapped("murphy-bed/bed-frame");
    if (leg !== null) return leg % 2 === 0 ? retired("murphy case and pivot replace rear support") : mapped(`murphy-bed/support-${child.startsWith("leg--1") ? "left" : "right"}`);
    if (child === "head") return retired("case-back supports the guest pillow");
    if (child === "mattress" || child === "duvet" || child === "pillow-0") return mapped(`murphy-bed/${child === "pillow-0" ? "pillow" : child}`);
  }
  if (id === "common-sofa") {
    if (child === "plinth") return mapped("living-sofa/frame");
    if (child === "back") return mapped("living-sofa/back-frame");
    if (/^cushion-[0-2]$/.test(child)) return mapped(`living-sofa/seat-${child.at(-1)}`);
    if (/^pillow-[0-2]$/.test(child)) return mapped(`living-sofa/${child}`);
    if (/^arm-(-?1)$/.test(child)) return mapped(`living-sofa/arm-${child === "arm--1" ? "left" : "right"}`);
  }
  if (id === "bath-shower") {
    /** @type {Record<string, string>} */
    const names = { tray: "tray", drain: "tray/drain-inner", "fixed-screen": "screen", "screen-rail": "screen-rail", riser: "riser", head: "head" };
    if (names[child]) return mapped(`shower/${names[child]}`);
  }
  if (id === "upper-laundry") {
    const match = /^(machine|drum|window|controls)-([01])$/.exec(child);
    if (match) return mapped(`${match[2] === "0" ? "laundry-washer" : "laundry-dryer"}/${({ machine: "body", drum: "drum-rim", window: "window/front", controls: "controls-panel" })[match[1]]}`);
  }
  if (owner.includes("refrigerator") && id === "kitchen-fridge-pantry") {
    if (child === "back") return mapped("refrigerator/body/back");
    if (side) return mapped(`refrigerator/body/side-${side[1] === "-1" ? "left" : "right"}`);
    if (shelf) return retired("sealed refrigerator replaces open pantry shelves");
    if (door) return mapped(`refrigerator/door-${door[1] === "-1" ? "lower" : "upper"}`);
    if (handle) return mapped(`refrigerator/handle-${handle[1] === "-1" ? "lower" : "upper"}`);
  }
  if (owner.includes("cabinet/") && (child === "back" || side || shelf || door || handle)) {
    if (id === "kitchen-island") {
      if (child === "back") return mapped("cabinet/island-base/dining-side");
      if (side) return mapped(`cabinet/island-base/end-${side[1] === "-1" ? "negative" : "positive"}`);
    } else {
      if (child === "back") return mapped("cabinet/back");
      if (side) return mapped(`cabinet/side-${side[1] === "-1" ? "left" : "right"}`);
    }
    if (shelf) {
      const i = Number(shelf[1]);
      if (i === 0) return mapped("cabinet/bottom");
      if (i === lastShelf) return mapped("cabinet/top");
      return isDrawer ? retired("drawer or appliance bay replaces old interior shelf") : mapped(`cabinet/shelf-${i}`);
    }
    if (door || handle) {
      const sign = (door || handle)?.[1];
      if (!sign) throw Error(`cabinet ${id} has neither door nor handle for ${child}`);
      const first = sign === "-1", what = door ? "door" : "handle";
      if (id === "kitchen-island") return mapped(`cabinet/service-${what}-${first ? 0 : 4}`);
      if (isDrawer) return mapped(`cabinet/${what === "door" ? "drawer" : "handle"}-${first ? 0 : id === "kitchen-wall-bank" ? 5 : 1}`);
      return mapped(`cabinet/${what}-${first ? 0 : leafLast}`);
    }
  }
  if (owner.includes("basin/") && ["rim", "bowl", "tap", "spout", "mirror"].includes(child)) {
    /** @type {Record<string, string>} */
    const renamed = { tap: "tap-body", spout: "tap-spout", mirror: "mirror-glass" };
    return mapped(`basin/${renamed[child] || child}`);
  }
  if (owner.includes("toilet") && ["pedestal", "bowl", "seat", "cistern", "flush"].includes(child)) return mapped(`toilet/${child}`);
  if (owner.includes("potted-plant") && ["pot", "stem"].includes(child)) return mapped(`potted-plant/${child}`);
  if (owner.includes("potted-plant") && /^leaf-[0-8]$/.test(child)) return mapped(`potted-plant/${child}`);
  if (owner.includes("fixed-bed/") && id !== "flex-guest-bed") {
    if (child === "base") return retired("solid bed base replaced by four open frame rails");
    if (leg !== null) return mapped(`fixed-bed/leg-${leg}`);
    if (["mattress", "duvet", "head"].includes(child)) return mapped(`fixed-bed/${child === "head" ? "headboard" : child}`);
    if (/^pillow-[01]$/.test(child)) return mapped(`fixed-bed/${child}`);
  }
  if (owner.includes("work-desk/") && id.endsWith("-desk")) {
    if (child === "top") return mapped("work-desk/top");
    if (leg !== null) {
      if (id === "flex-desk") return retired("drawer case and telescopic post replace four old table legs");
      if (leg % 2 === 0) return retired("wall back rail replaces rear table leg");
      return mapped(`work-desk/support-${child.startsWith("leg--1") ? "left" : "right"}`);
    }
    if (child === "screen") return mapped("work-display/screen");
    if (child === "screen-stand") return mapped("work-display/stand-shaft");
    if (child === "keyboard") return mapped("work-keyboard/keyboard-body");
  }
  if (owner.includes("desk-chair") || owner.includes("dining-chair")) {
    const desk = owner.includes("desk-chair"), prefix = desk ? "desk-chair" : "dining-chair";
    if (child === "seat") return mapped(`${prefix}/${desk ? "shell-seat" : "seat-frame"}`);
    if (child === "back") return mapped(`${prefix}/${desk ? "shell-back" : "back"}`);
    if (leg !== null) return mapped(`${prefix}/leg-${leg}`);
  }
  if (owner.includes("dining-table") || owner.includes("coffee-table") || owner.includes("island-stool")) {
    const prefix = owner.includes("dining-table") ? "dining-table" : owner.includes("coffee-table") ? "coffee-table" : "island-stool";
    if (child === "top" || child === "seat") return mapped(`${prefix}/${child}`);
    if (leg !== null) return mapped(`${prefix}/leg-${leg}`);
  }
  if (id === "kitchen-island") {
    /** @type {Record<string, string>} */
    const names = { counter: "counter", sink: "sink", "tap-upright": "tap-body", "tap-spout": "tap-spout" };
    if (names[child]) return mapped(`kitchen-island/${names[child]}`);
    if (child === "sink-basin") return retired("flat basin plate is replaced by recessed sink bowl");
  }
  if (id === "kitchen-wall-bank") {
    /** @type {Record<string, string>} */
    const names = { worktop: "wall-worktop/top", hob: "cooktop/body", oven: "oven/body", "oven-handle": "oven/handle" };
    if (names[child]) return mapped(names[child]);
    const ring = /^hob-ring-(-?0\.17)-(-?0\.12)$/.exec(child);
    if (ring) return mapped(`cooktop/zone-${(Number(ring[1]) > 0 ? 2 : 0) + (Number(ring[2]) > 0 ? 1 : 0)}`);
  }
  return null;
}

/** @param {Set<string>} expected @param {Correspondence[]} entries */
function checkCoverage(expected, entries) {
  const errors = [];
  const counts = new Map();
  for (const entry of entries) counts.set(entry.id, (counts.get(entry.id) || 0) + 1);
  for (const id of expected) {
    const count = counts.get(id) || 0;
    if (count !== 1) errors.push(`${id}: expected one correspondence, found ${count}`);
  }
  for (const id of counts.keys()) if (!expected.has(id)) errors.push(`${id}: correspondence has no compiled child`);
  return errors;
}

function census() {
  /** @type {Correspondence[]} */
  const entries = [];
  const errors = [...accountErrors];
  const roots = legacyRoots();
  const expected = new Set();
  const used = new Map();
  for (const item of roots) {
    const rows = accountRoots.filter((row) => row.rx.test(item.id));
    if (rows.length !== 1) { errors.push(`${item.id}: ${rows.length} root account rows`); continue; }
    for (const child of [...item.children].sort((a, b) => a.localeCompare(b))) {
      const result = route(item, child, rows[0].owner);
      const id = `${item.id}-${child}`;
      expected.add(id);
      if (!result) { errors.push(`${id}: no child correspondence`); continue; }
      if (result.part) {
        const instance = item.id === "flex-guest-bed" || item.id === "flex-murphy-frame" ? "flex-murphy" : item.id;
        const key = `${instance}/${result.part}`;
        if (used.has(key)) errors.push(`${id}: duplicate destination ${key}, first used by ${used.get(key)}`);
        used.set(key, id);
      }
      entries.push({ id, ...result });
    }
  }
  for (const row of accountRoots) if (!roots.some((item) => row.rx.test(item.id))) errors.push(`${row.label}: root account row has no compiled member`);
  errors.push(...checkCoverage(expected, entries));
  const routedRetired = new Set(entries.filter((entry) => entry.retired).map((entry) => entry.id));
  for (const id of routedRetired) if (!accountRetired.has(id)) errors.push(`${id}: retired without account row`);
  for (const id of accountRetired) if (!routedRetired.has(id)) errors.push(`${id}: account retirement has no retired child`);
  for (const entry of entries) if (entry.part && !addressExists(entry.part))
    errors.push(`${entry.id}: destination ${entry.part} has no model part/face address`);
  const bedRetirement = account.split("| `primary-bed-base`,")[1]?.split(/\r?\n/)[0] || "";
  const fixedBed = modelH2.get("fixed-bed") || "";
  for (const rail of ["frame-side-left/right", "frame-head/foot", "support-deck"]) {
    if (!bedRetirement.includes(rail) || !fixedBed.includes(rail))
      errors.push(`fixed-bed replacement rail ${rail} absent from account or model H2`);
  }
  return { roots: roots.length, children: expected.size, retired: entries.filter((e) => e.retired).length, entries, errors, expected };
}

const result = census();
const negativeErrors = checkCoverage(result.expected, result.entries.slice(1));
if (negativeErrors.length !== 1) result.errors.push("removed-child negative control did not fail");
for (const wrongState of ["cooktop/handle", "oven/zone-0", "work-display/key-0", "work-keyboard/screen"]) {
  if (addressExists(wrongState)) result.errors.push(`${wrongState}: cross-state address was accepted`);
}
const details = process.argv.includes("--details");
console.log(JSON.stringify({ roots: result.roots, children: result.children, retired: result.retired, errors: result.errors, negativeControlErrors: negativeErrors, ...(details ? { entries: result.entries } : {}) }, null, 2));
if (result.errors.length) process.exitCode = 1;

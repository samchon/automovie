#!/usr/bin/env node
/**
 * Compare complete #1952 scene dumps from before and after the v-136 repair.
 * The source-linked scene driver captures every part, room/reservation, environment
 * space/boundary/opening/connector, and observation. This gate rejects a deleted
 * element or any change outside that one reviewed repair surface. This frozen
 * comparison is not a standing design invariant and is deliberately excluded
 * from check:spaces. Run npm run regression:1952-repair only when replaying
 * that repair against its committed pre-repair fixture; do not regenerate the
 * fixture or widen the id list for a later design change.
 *
 * With no arguments the committed before scene is compared with a fresh build.
 * Two file arguments permit mutation probes against saved scene dumps.
 */
const fs = require("node:fs");
const path = require("node:path");

const [beforeArg, afterFile] = process.argv.slice(2);
if (beforeArg && !afterFile) throw new Error("usage: scene-regression.cjs [before.json after.json]");
const beforeFile = beforeArg ?? path.join(__dirname, "fixtures/1952-before-scene.json");
const before = JSON.parse(fs.readFileSync(beforeFile, "utf8"));
if (!afterFile) require(require.resolve("tsx/cjs"));
const after = afterFile
  ? JSON.parse(fs.readFileSync(afterFile, "utf8"))
  : require("./scene-snapshot.ts").sceneSnapshot();
if (before.threw || after.threw || before.obsThrew || after.obsThrew)
  throw new Error(`scene build failed: ${before.threw || after.threw || before.obsThrew || after.obsThrew}`);

const expected = {
  parts: [
    "roof-main-front", "roof-main-back", "roof-right-front", "roof-right-back",
    "roof-garage-front", "roof-garage-back",
  ],
  rooms: [
    "res:common-main-route-back", "res:common-garden-door-approach",
    "res:living-front-curtain", "res:living-left-curtain",
    "res:family-rear-curtain", "res:family-right-curtain",
    "res:bedroom-two-front-curtain", "res:bedroom-three-front-curtain",
    "zone:front-walk", "zone:side-walk",
  ],
  env: [
    "boundary:stair-left-upper/house-site|main-stair/0",
    "boundary:stair-bedroom-side-upper/main-stair|house-site/0",
    "boundary:stair-bedroom-front-upper/main-stair|house-site/0",
  ],
  observations: [
    "front-walk/center-x-minus", "front-walk/center-x-plus",
    "front-walk/center-z-minus", "front-walk/center-z-plus",
    "front-walk/corner-x-plus-z-minus", "front-walk/corner-x-plus-z-plus",
  ],
};

/** @param {unknown} value @returns {unknown} */
const normalized = (value) => {
  if (typeof value === "number") return Math.round(value * 1e6) / 1e6;
  if (typeof value === "string" && (value.startsWith("[") || value.startsWith("{"))) {
    try { return normalized(JSON.parse(value)); } catch { return value; }
  }
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalized(v)]));
  return value;
};

/** @param {string} label @param {Record<string, unknown>} oldMap @param {Record<string, unknown>} newMap @param {string[]} changed @param {string[]} [added] */
const compare = (label, oldMap, newMap, changed, added = []) => {
  const oldIds = Object.keys(oldMap);
  const newIds = Object.keys(newMap);
  const deleted = oldIds.filter((id) => !(id in newMap));
  const created = newIds.filter((id) => !(id in oldMap));
  const moved = oldIds.filter((id) => id in newMap && JSON.stringify(normalized(oldMap[id])) !== JSON.stringify(normalized(newMap[id])));
  /** @param {string[]} a @param {string[]} b */
  const sameSet = (a, b) => a.length === b.length && a.every((id) => b.includes(id));
  if (deleted.length || !sameSet(created, added) || !sameSet([...moved, ...created], changed))
    throw new Error(`${label}: deleted=${JSON.stringify(deleted)} added=${JSON.stringify(created)} changed=${JSON.stringify(moved)}; expected added=${JSON.stringify(added)} changed=${JSON.stringify(changed)}`);
  return { before: oldIds.length, after: newIds.length, changed: moved.length, added: created.length };
};

/** @param {{obsJson:{observations:Array<{id:string}>}}} scene */
const observations = (scene) => Object.fromEntries(scene.obsJson.observations.map((o) => [o.id, o]));
if (before.elements !== after.elements || before.obsJson.failures.length || after.obsJson.failures.length ||
    JSON.stringify(before.obsJson.references) !== JSON.stringify(after.obsJson.references))
  throw new Error("scene elements, observation failures, or observation references regressed");

const result = {
  elements: before.elements,
  parts: compare("parts", before.parts, after.parts, expected.parts),
  rooms: compare("rooms", before.rooms, after.rooms, expected.rooms, expected.rooms.filter((id) => id.startsWith("res:") && id !== "res:common-main-route-back")),
  environment: compare("environment", before.env, after.env, expected.env),
  elementRecords: compare("elementRecords", before.elementRecords, after.elementRecords, []),
  observations: compare("observations", observations(before), observations(after), expected.observations),
};
console.log(JSON.stringify(result));

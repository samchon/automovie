#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [beforeArg, afterFile] = process.argv.slice(2);
if (beforeArg && !afterFile) throw new Error(
  "usage: scene-regression.cjs [before.json after.json]",
);
const beforeFile = beforeArg ?? path.join(__dirname, "fixtures/1952-before-scene.json");
const before = JSON.parse(fs.readFileSync(beforeFile, "utf8"));
if (!afterFile) require(require.resolve("tsx/cjs"));
const after = afterFile
  ? JSON.parse(fs.readFileSync(afterFile, "utf8"))
  : require("./scene-snapshot.ts").sceneSnapshot();
if (before.threw || after.threw || before.obsThrew || after.obsThrew)
  throw new Error(
    `scene build failed: ${before.threw || after.threw || before.obsThrew || after.obsThrew}`,
  );

const expected = {
  parts: [
    "roof-main-front",
    "roof-main-back",
    "roof-right-front",
    "roof-right-back",
    "roof-garage-front",
    "roof-garage-back",
  ],
  rooms: [
    "res:common-main-route-back",
    "res:common-garden-door-approach",
    "res:living-front-curtain",
    "res:living-left-curtain",
    "res:family-rear-curtain",
    "res:family-right-curtain",
    "res:bedroom-two-front-curtain",
    "res:bedroom-three-front-curtain",
    "zone:front-walk",
    "zone:side-walk",
  ],
  env: [
    "boundary:stair-left-upper/house-site|main-stair/0",
    "boundary:stair-bedroom-side-upper/main-stair|house-site/0",
    "boundary:stair-bedroom-front-upper/main-stair|house-site/0",
  ],
  observations: [
    "front-walk/center-x-minus",
    "front-walk/center-x-plus",
    "front-walk/center-z-minus",
    "front-walk/center-z-plus",
    "front-walk/corner-x-plus-z-minus",
    "front-walk/corner-x-plus-z-plus",
  ],
};

const normalized = (value: unknown): unknown => {
  if (typeof value === "number") return Math.round(value * 1e6) / 1e6;
  if (typeof value === "string" && (value.startsWith("[") || value.startsWith("{"))) {
    try {
      return normalized(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, normalized(v)]),
  );
  return value;
};

const compare = (label: string, oldMap: Record<string, unknown>, newMap: Record<string, unknown>, changed: string[], added: string[] = []) => {
  const oldIds = Object.keys(oldMap);
  const newIds = Object.keys(newMap);
  const deleted = oldIds.filter((id) => !(id in newMap));
  const created = newIds.filter((id) => !(id in oldMap));
  const moved = oldIds.filter(
    (id) => id in newMap && JSON.stringify(normalized(oldMap[id])) !== JSON.stringify(normalized(newMap[id])),
  );
    const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));
  if (deleted.length || !sameSet(created, added) || !sameSet([...moved, ...created], changed))
    throw new Error(
      `${label}: deleted=${JSON.stringify(deleted)} added=${JSON.stringify(created)} changed=${JSON.stringify(moved)}; expected added=${JSON.stringify(added)} changed=${JSON.stringify(changed)}`,
    );
  return {
    before: oldIds.length,
    after: newIds.length,
    changed: moved.length,
    added: created.length,
  };
};

const observations = (scene: { obsJson:{ observations:Array<{ id:string }> } }) => Object.fromEntries(
  scene.obsJson.observations.map((o) => [o.id, o]),
);
if (before.elements !== after.elements || before.obsJson.failures.length || after.obsJson.failures.length ||
    JSON.stringify(before.obsJson.references) !== JSON.stringify(after.obsJson.references))
  throw new Error(
    "scene elements, observation failures, or observation references regressed",
  );

const result = {
  elements: before.elements,
  parts: compare("parts", before.parts, after.parts, expected.parts),
  rooms: compare(
    "rooms",
    before.rooms,
    after.rooms,
    expected.rooms,
    expected.rooms.filter(
      (id) => id.startsWith("res:") && id !== "res:common-main-route-back",
    ),
  ),
  environment: compare("environment", before.env, after.env, expected.env),
  elementRecords: compare(
    "elementRecords",
    before.elementRecords,
    after.elementRecords,
    [],
  ),
  observations: compare(
    "observations",
    observations(before),
    observations(after),
    expected.observations,
  ),
};
console.log(JSON.stringify(result));

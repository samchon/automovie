// Sample each compiled stair stringer's cylindrical volume against every
// nearby box, plus the holed ceiling and structural wall bodies. The ceiling
// uses the authored stair opening rather than its uninformative full AABB.
const assert = require("node:assert/strict");
const { builtEnvironmentElementBounds, Quaternion } = require(
  "@automovie/engine",
);
const { buildHouse } = require("../house/build.ts");
const { stairHole } = require("../house/plan.ts");
/** @typedef {NonNullable<ReturnType<typeof builtEnvironmentElementBounds>>} Bounds */
/** @typedef {typeof environment.elements[number]} Element */

const environment = buildHouse();
const models = new Map(environment.models.map((model) => [model.id, model]));
const stringers = environment.elements.filter((element) =>
  /^stair-[01]-stringer--?1$/.test(element.id),
);
assert.equal(stringers.length, 4, "both sides of both flights");
/** @param {Element} element */
const bounds = (element) => builtEnvironmentElementBounds(
  environment,
  element.id,
);
/** @param {Element} element */
const isBox = (element) => element.model !== null && models.get(element.model)?.parts.some((part) => part.geometry.type === "primitive" && part.geometry.shape.type === "box");
const obstacles = environment.elements.filter((element) =>
  isBox(element) || element.id === "ceiling-0" || /(?:wall|enclosure|junction).*body$/.test(element.id));
const obstacleBounds = obstacles.map((element) => ({
  element,
  box: bounds(element),
}));
/** @param {{ x: number; y: number; z: number }} point @param {Bounds} box */
const inside = (point, box) => point.x > box.min.x + 1e-6 && point.x < box.max.x - 1e-6
  && point.y > box.min.y + 1e-6 && point.y < box.max.y - 1e-6
  && point.z > box.min.z + 1e-6 && point.z < box.max.z - 1e-6;
/** @param {Bounds} a @param {Bounds} b */
const intersects = (a, b) => a.min.x < b.max.x && a.max.x > b.min.x
  && a.min.y < b.max.y && a.max.y > b.min.y && a.min.z < b.max.z && a.max.z > b.min.z;
let collisions = 0;
for (const stringer of stringers) {
  const transform = stringer.transform;
  if (process.argv.includes("--fixture") && stringer.id === "stair-1-stringer--1") transform.translation.x -= 0.1;
  const direction = Quaternion.rotateVector(transform.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const radius = transform.scale.x / 2;
  const length = transform.scale.y;
  const start = {
    x: transform.translation.x - direction.x * length / 2,
    y: transform.translation.y - direction.y * length / 2,
    z: transform.translation.z - direction.z * length / 2,
  };
  const end = {
    x: transform.translation.x + direction.x * length / 2,
    y: transform.translation.y + direction.y * length / 2,
    z: transform.translation.z + direction.z * length / 2,
  };
  const rodBox = bounds(stringer);
  assert.ok(rodBox, `${stringer.id}: no bounds`);
  const nearby = obstacleBounds
    .filter(({ box }) => box !== null && intersects(rodBox, box));
  if (!nearby.length) {
    console.log(`PASS ${stringer.id}: 0 obstacle samples (0 nearby bodies)`);
    continue;
  }
  const hits = new Map();
  for (let t = 0; t <= 1.0000001; t += 0.0025) for (const fraction of [
    0, 0.3, 0.6, 0.9, 0.999,
  ]) for (let k = 0; k < 36; k++) {
    const angle = k * Math.PI / 18;
    const side = radius * fraction * Math.cos(angle);
    const transverse = radius * fraction * Math.sin(angle);
    const point = {
      x: start.x + (end.x - start.x) * t + side,
      y: start.y + (end.y - start.y) * t + transverse * direction.z,
      z: start.z + (end.z - start.z) * t - transverse * direction.y,
    };
    for (const { element, box } of nearby) {
      if (!box) continue;
      if (!inside(point, box)) continue;
      if (element.id === "ceiling-0" && point.x > stairHole[0] && point.x < stairHole[1]
        && point.z > stairHole[2] && point.z < stairHole[3]) continue;
      hits.set(element.id, (hits.get(element.id) ?? 0) + 1);
    }
  }
  for (const [id, count] of hits) {
    collisions += count;
    console.error(`FAIL ${stringer.id} penetrates ${id}: ${count} samples`);
  }
  if (!hits.size) console.log(
    `PASS ${stringer.id}: 0 obstacle samples (${nearby.length} nearby bodies)`,
  );
}
if (process.argv.includes("--fixture")) {
  assert.ok(
    collisions > 0,
    "fixture must expose the former west-stringer collision",
  );
  console.log(`PASS collision fixture: ${collisions} penetrations detected`);
} else {
  assert.equal(
    collisions,
    0,
    "stringers penetrate compiled boxes, ceiling or wall bodies",
  );
}

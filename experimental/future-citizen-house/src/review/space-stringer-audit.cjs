// Sample each compiled stringer's cylindrical volume against every nearby
// element geometry and explicit population member. The ceiling uses the
// authored stair opening rather than its uninformative full AABB.
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
const fixtureIds = [];
if (process.argv.includes("--fixture-rod")) {
  const rod = environment.elements.find((element) =>
    element.id === "landing-front-post-0");
  assert.ok(rod, "fixture rod exists");
  rod.transform.translation = { ...stringers[0].transform.translation };
  fixtureIds.push(rod.id);
}
if (process.argv.includes("--fixture-sphere")) {
  const sphere = environment.elements.find((element) =>
    element.id === "hedge--1-0-0");
  assert.ok(sphere, "fixture sphere exists");
  sphere.transform.translation = { ...stringers[0].transform.translation };
  fixtureIds.push(sphere.id);
}
if (process.argv.includes("--fixture-population")) {
  const population = environment.populations?.find(({ set }) =>
    set.id === "entry-floor-boards");
  assert.ok(population && population.set.layout.kind === "explicit", "fixture population exists");
  const member = population.set.layout.transforms[0];
  member.translation = { ...stringers[0].transform.translation };
  fixtureIds.push(`population:${population.set.id}:${member.id}`);
}
/** @param {Element} element */
const bounds = (element) => builtEnvironmentElementBounds(
  environment,
  element.id,
);
/** @param {Element} element */
const obstacles = environment.elements.filter((element) =>
  element.model !== null && !stringers.includes(element));
/** @type {Array<{ id:string; element:Element|null; box:Bounds|null }>} */
const obstacleBounds = obstacles.map((element) => ({
  id: element.id,
  element,
  box: bounds(element),
}));
// Population layouts are explicit in this house. Resolve each member rather
// than testing its set-wide envelope, which is mostly empty space.
for (const { set, prototypeBounds } of environment.populations ?? []) {
  assert.equal(
    set.layout.kind,
    "explicit",
    `${set.id}: unhandled population layout`,
  );
  const heading = set.facingDeg * Math.PI / 180;
  const cosine = Math.cos(heading), sine = Math.sin(heading);
  for (const member of set.layout.transforms) {
    const corners = [prototypeBounds.min.x, prototypeBounds.max.x].flatMap((x) =>
      [prototypeBounds.min.y, prototypeBounds.max.y].flatMap((y) =>
        [prototypeBounds.min.z, prototypeBounds.max.z].map((z) => {
          const rotated = Quaternion.rotateVector(member.rotation, {
            x: x * member.scale.x, y: y * member.scale.y, z: z * member.scale.z,
          });
          const px = member.translation.x + rotated.x,
            pz = member.translation.z + rotated.z;
          return {
            x: set.anchor.x + px * cosine + pz * sine,
            y: set.anchor.y + member.translation.y + rotated.y,
            z: set.anchor.z - px * sine + pz * cosine,
          };
        }),
      ),
    );
    obstacleBounds.push({
      id: `population:${set.id}:${member.id}`,
      element: null,
      box: {
        min: {
          x: Math.min(...corners.map((p) => p.x)),
          y: Math.min(...corners.map((p) => p.y)),
          z: Math.min(...corners.map((p) => p.z)),
        },
        max: {
          x: Math.max(...corners.map((p) => p.x)),
          y: Math.max(...corners.map((p) => p.y)),
          z: Math.max(...corners.map((p) => p.z)),
        },
      },
    });
  }
}
/** @param {{ x: number; y: number; z: number }} point @param {Bounds} box */
const inside = (point, box) => point.x > box.min.x + 1e-6 && point.x < box.max.x - 1e-6
  && point.y > box.min.y + 1e-6 && point.y < box.max.y - 1e-6
  && point.z > box.min.z + 1e-6 && point.z < box.max.z - 1e-6;
/** Use the actual cylinder/sphere section after AABB rejection. Meshes retain
 * their conservative occupied bounds here; any mesh hit requires inspection.
 * @param {{ x: number; y: number; z: number }} point
 * @param {Element | null} element @param {Bounds} box */
const insideObstacle = (point, element, box) => {
  if (!inside(point, box)) return false;
  if (!element || element.model === null) return true;
  const model = models.get(element.model);
  if (!model) throw Error(`${element.id}: missing model`);
  const rotation = element.transform.rotation;
  const offset = Quaternion.rotateVector(
    { x: -rotation.x, y: -rotation.y, z: -rotation.z, w: rotation.w },
    {
      x: point.x - element.transform.translation.x,
      y: point.y - element.transform.translation.y,
      z: point.z - element.transform.translation.z,
    },
  );
  const local = {
    x: offset.x / element.transform.scale.x,
    y: offset.y / element.transform.scale.y,
    z: offset.z / element.transform.scale.z,
  };
  return model.parts.some((part) => {
    if (part.geometry.type !== "primitive" || part.transform !== null) return true;
    const shape = part.geometry.shape;
    if (shape.type === "cylinder") return Math.abs(local.y) < shape.height / 2 - 1e-6
      && Math.hypot(local.x, local.z) < shape.radius - 1e-6;
    if (shape.type === "sphere") return Math.hypot(local.x, local.y, local.z) < shape.radius - 1e-6;
    if (shape.type === "box") return Math.abs(local.x) < shape.width / 2 - 1e-6
      && Math.abs(local.y) < shape.height / 2 - 1e-6
      && Math.abs(local.z) < shape.depth / 2 - 1e-6;
    return true;
  });
};
/** @param {Bounds} a @param {Bounds} b */
const intersects = (a, b) => a.min.x < b.max.x && a.max.x > b.min.x
  && a.min.y < b.max.y && a.max.y > b.min.y && a.min.z < b.max.z && a.max.z > b.min.z;
let collisions = 0;
const collidedIds = new Set();
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
    for (const { id, element, box } of nearby) {
      if (!box) continue;
      if (!insideObstacle(point, element, box)) continue;
      if (id === "ceiling-0" && point.x > stairHole[0] && point.x < stairHole[1]
        && point.z > stairHole[2] && point.z < stairHole[3]) continue;
      hits.set(id, (hits.get(id) ?? 0) + 1);
    }
  }
  for (const [id, count] of hits) {
    collisions += count;
    collidedIds.add(id);
    console.error(`FAIL ${stringer.id} penetrates ${id}: ${count} samples`);
  }
  if (!hits.size) console.log(
    `PASS ${stringer.id}: 0 obstacle samples (${nearby.length} nearby bodies)`,
  );
}
if (process.argv.includes("--fixture") || fixtureIds.length) {
  assert.ok(
    collisions > 0,
    "fixture must expose the former west-stringer collision",
  );
  for (const id of fixtureIds)
    assert.ok(collidedIds.has(id), `${id}: obstacle fixture was not detected`);
  console.log(`PASS collision fixture: ${collisions} penetrations detected`);
} else {
  assert.equal(
    collisions,
    0,
    "stringers penetrate compiled elements or population members",
  );
}

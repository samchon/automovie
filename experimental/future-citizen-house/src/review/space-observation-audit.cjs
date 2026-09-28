// Exercise the current room-center observation against compiled obstacles.
// A filled fixture must retain failed questions rather than claim a view.
const assert = require("node:assert/strict");
const { builtEnvironmentElementBounds } = require("@automovie/engine");
const { buildHouse } = require("../house/build.ts");
const { observations } = require("../house/observations.ts");

const environment = buildHouse();
/** @param {import("@automovie/interface").IAutoMovieBuiltEnvironment} e */
const centers = (e) =>
  observations(e).filter(
    (station) => station.space === "entry" && station.role === "center",
  );
const current = centers(environment);
assert.equal(current.length, 4);
assert(current.every((station) => station.pose));
const currentPose = current[0].pose;
assert(currentPose);
const position = currentPose.position;
assert(
  current.every((station) => {
    assert(station.pose);
    return JSON.stringify(station.pose.position) === JSON.stringify(position);
  }),
);
assert.notDeepEqual(position, { x: 0, y: 1.6, z: -3.04 });
assert.match(current[0].reason, /compiled bound clearance/);
for (const element of environment.elements.filter(
  (element) =>
    element.space === "entry" && /^(stair-|landing-)/.test(element.id),
)) {
  const box = builtEnvironmentElementBounds(environment, element.id);
  if (!box) continue;
  assert(
    box.max.x <= position.x - 0.18 ||
      box.min.x >= position.x + 0.18 ||
      box.max.z <= position.z - 0.18 ||
      box.min.z >= position.z + 0.18,
    `${element.id} occupies the relocated standing center`,
  );
}

const unobstructed = structuredClone(environment);
unobstructed.elements = unobstructed.elements.filter(
  (element) => element.space !== "entry",
);
const unobstructedPose = centers(unobstructed)[0].pose;
assert(unobstructedPose);
assert.deepEqual(unobstructedPose.position, { x: 0, y: 1.6, z: -3.04 });

const filled = structuredClone(environment);
const bench = filled.elements.find(
  (element) => element.id === "entry-bench-cushion",
);
assert(bench);
filled.elements.push({
  ...bench,
  id: "entry-full-height-obstruction",
  transform: {
    ...bench.transform,
    translation: { x: 0, y: 1.45, z: -3.04 },
    scale: { x: 5.68, y: 2.9, z: 5.44 },
  },
});
const refused = centers(filled);
assert(refused.every((station) => station.pose === null));
assert(refused.every((station) => /retained as failed/.test(station.reason)));
console.log(
  "PASS entry center relocated from stair, preserved when clear, refused when filled",
);

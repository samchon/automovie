/** In-memory design relations, with independent arithmetic and negative twins. */
require(require.resolve("tsx/cjs"));
const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyStairLanding, verifyCurtainStrip, verifyHouseSpaceDesign } = require(
  "./space-design.ts",
);
const { verifyRoofInternalFaces } = require("./roof-overlap.ts");
const { block, slab } = require("../spaces/solids.ts");
const { seamRect } = require("../spaces/site/paving.ts");
const { buildHouse } = require("../spaces/house.ts");
const { buildHouseEnvironment } = require("../spaces/environment.ts");
const { deriveHouseObservations } = require("../spaces/observations.ts");

void test("stair approach, landing, and upper arrival follow one station", () => {
  const opening = {
    west: -1.8,
    turnX: -0.65,
    east: 1.87,
    back: -4.56,
    turnZ: -3.41,
  };
  const rise = 3.16 / 18;
  const route = [
    { x: -1.225, y: 0, z: -0.85 },
    { x: -1.225, y: 0, z: -1.45 },
    { x: -1.225, y: rise * 8, z: -3.41 },
    { x: -1.225, y: rise * 8, z: -3.985 },
    { x: -0.65, y: rise * 8, z: -3.985 },
    { x: 1.87, y: 3.16, z: -3.985 },
  ];
  assert.doesNotThrow(() => verifyStairLanding(route, opening, rise, 3));
  for (const index of [2, 3, 4, 5]) {
    const moved = route.map((point, at) =>
      at === index ? { ...point, y: point.y + 0.1 } : point,
    );
    assert.throws(
      () => verifyStairLanding(moved, opening, rise, 3),
      new RegExp(`station ${index}`),
    );
  }
  assert.throws(() => verifyStairLanding([], opening, rise, 3), /station 2/);
});

void test("curtain strip follows window span, floor, head, and inward depth", () => {
  const window = { from: 0.4, to: 1.4, top: 2.3 };
  /** @type {import("./space-design").Box} */
  const strip = { x: [0.3, 1.5], y: [0.1, 2.42], z: [-0.37, -0.25] };
  assert.doesNotThrow(() => verifyCurtainStrip("sample", strip, window, 0.1, "x", -0.25, -1));
  assert.throws(() => verifyCurtainStrip("sample", { ...strip, y: /** @type {[number, number]} */ ([0.1, 2.6]) }, window, 0.1, "x", -0.25, -1), /sample: curtain/);
  assert.throws(() => verifyCurtainStrip("sample", { ...strip, x: /** @type {[number, number]} */ ([0.2, 1.5]) }, window, 0.1, "x", -0.25, -1), /sample: curtain/);
  assert.throws(() => verifyCurtainStrip("sample", { ...strip, z: /** @type {[number, number]} */ ([-0.4, -0.25]) }, window, 0.1, "x", -0.25, -1), /sample: curtain/);
  assert.throws(() => verifyCurtainStrip("sample", undefined, window, 0.1, "x", -0.25, -1), /sample: curtain/);
  assert.doesNotThrow(() => verifyCurtainStrip("other", { x: [-5.5, -5.38], y: [3.16, 5.43], z: [-5.6, -4.1] }, { from: -5.5, to: -4.2, top: 5.31 }, 3.16, "z", -5.5, 1));
});

void test("a roof closure buried inside a touching roof is refused", () => {
  const left = { id: "left", mesh: block([0, 0, 0], [1, 1, 1]) };
  const right = { id: "right", mesh: block([1, 0, 0], [2, 1, 1]) };
  assert.throws(
    () => verifyRoofInternalFaces([left, right]),
    /internal roof closure faces/,
  );
  assert.doesNotThrow(() =>
    verifyRoofInternalFaces([
      left,
      { ...right, mesh: block([1.02, 0, 0], [2.02, 1, 1]) },
    ]),
  );
});

void test("flat paving retains every connector end station on both shared sides", () => {
  const ring = seamRect([1, 5], [0, 6], [[1, 3]], [[2, 4]]);
  const mesh = slab({ outline: ring, bottom: -0.12, top: 0 });
  /** @param {number} x */
  const edge = (x) => {
    const z = new Set();
    for (let i = 0; i < mesh.positions.length; i += 3)
      if (Math.abs(mesh.positions[i] - x) < 1e-6) z.add(Number(mesh.positions[i + 2].toFixed(3)));
    return [...z].sort((a, b) => a - b);
  };
  assert.deepEqual(edge(1), [0, 1, 1.5, 2, 2.5, 3, 6]);
  assert.deepEqual(edge(5), [0, 2, 2.5, 3, 3.5, 4, 6]);
  assert.deepEqual(seamRect([1, 5], [0, 6]), [{ x: 5, z: 0 }, { x: 5, z: 6 }, { x: 1, z: 6 }, { x: 1, z: 0 }]);
});

void test("every current window curtain and bathroom rail is checked", () => {
  const house = buildHouse();
  const environment = buildHouseEnvironment(house);
  assert.doesNotThrow(() => verifyHouseSpaceDesign(house, environment));
  assert.throws(
    () =>
      verifyHouseSpaceDesign(house, {
        ...environment,
        connectors: environment.connectors.filter(
          (connector) => connector.id !== "main-stair-connection",
        ),
      }),
    /main stair connector is absent/,
  );
  const primary = house.spaces.find((space) => space.id === "primary-bedroom");
  assert.ok(primary?.reservations);
  const curtain = primary.reservations.find(
    (reservation) => reservation.id === "primary-rear-curtain",
  );
  assert.ok(curtain?.y);
  const original = curtain.y;
  curtain.y = [original[0] + 0.1, original[1]];
  assert.throws(
    () => verifyHouseSpaceDesign(house, environment),
    /primary-rear-curtain/,
  );
  curtain.y = original;
  const originalKind = curtain.kind;
  curtain.kind = "use";
  assert.throws(
    () => verifyHouseSpaceDesign(house, environment),
    /curtain must reserve a fixture/,
  );
  curtain.kind = originalKind;
  const originalReservations = primary.reservations;
  primary.reservations = [...originalReservations, { ...curtain, id: "unbacked-curtain" }];
  assert.throws(
    () => verifyHouseSpaceDesign(house, environment),
    /no window export/,
  );
  primary.reservations = originalReservations;
  const tub = house.spaces.find((space) => space.id === "tub-bathroom");
  assert.ok(tub?.reservations);
  const rail = tub.reservations.find(
    (reservation) => reservation.id === "tub-bathroom-curtain-rail",
  );
  assert.ok(rail?.y);
  const railOriginal = rail.y;
  rail.y = [railOriginal[0] + 0.1, railOriginal[1]];
  assert.throws(
    () => verifyHouseSpaceDesign(house, environment),
    /bathroom curtain rail/,
  );
  rail.y = railOriginal;
  const railKind = rail.kind;
  rail.kind = "use";
  assert.throws(
    () => verifyHouseSpaceDesign(house, environment),
    /bathroom curtain rail/,
  );
  rail.kind = railKind;
});

void test("inward corner and threshold replacements retain their displacement reasons", () => {
  const house = buildHouse();
  const result = deriveHouseObservations(buildHouseEnvironment(house), house);
  const corners = result.observations.filter((o) =>
    o.pose?.reason?.startsWith("Boundary corner"),
  );
  const thresholds = result.observations.filter((o) =>
    o.pose?.reason?.startsWith("Boundary threshold"),
  );
  assert.ok(corners.length > 0);
  assert.ok(thresholds.length > 0);
  for (const observation of [...corners, ...thresholds]) {
    assert.ok(observation.pose?.reason);
    assert.match(observation.pose.reason, /\d+\.\d{3} m/);
  }
});

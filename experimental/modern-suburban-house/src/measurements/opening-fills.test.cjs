/** Exterior window fills derive from the same built wall voids as the scene. */
const assert = require("node:assert/strict");
const { test } = require("node:test");

const { OpeningWindowFills } = require("../instances/opening-fills.ts");
const { buildHouseEnvironment } = require("../spaces/environment.ts");
const { buildHouse } = require("../spaces/house.ts");

/** @param {number} actual @param {number} expected */
const near = (actual, expected) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-8,
    `${actual} differs from ${expected}`,
  );

void test("all twelve window fills use their actual void size and weather face", () => {
  const environment = buildHouseEnvironment(buildHouse());
  const result = new OpeningWindowFills().build(environment);
  assert.equal(result.prototypes.length, 12);
  assert.equal(result.instances.length, 12);
  const byId = new Map(result.instances.map((instance) => [instance.id.slice(5), instance]));
  for (const opening of environment.openings.filter((item) => item.kind === "window")) {
    const instance = byId.get(opening.id);
    const prototype = result.prototypes.find((item) => item.model.id === instance?.modelId);
    assert.ok(instance && prototype, opening.id);
    assert.equal(Object.keys(prototype.faceByPart).length, prototype.model.parts.length);
    const profile = opening.profile?.outline;
    assert.ok(profile);
    near(instance.transform.translation?.y ?? NaN, Math.min(...profile.map((point) => point.y)));
    assert.equal(prototype.model.name, opening.id);
  }
  /** @type {readonly (readonly [string, number, number, number])[]} */
  const positions = [
    ["living-front-window", -3.70, 0.70, 0],
    ["kitchen-rear-window", -3.90, 1.15, -10.70],
    ["living-left-window", -5.75, 0.75, -4.90],
    ["garage-right-window", 11.70, 1.40, -5.05],
  ];
  for (const [id, x, y, z] of positions) {
    const translation = byId.get(id)?.transform.translation;
    assert.ok(translation, id);
    near(translation.x, x);
    near(translation.y, y);
    near(translation.z, z);
  }
});

void test("a window assignment cannot silently disappear or duplicate", () => {
  const environment = buildHouseEnvironment(buildHouse());
  const dropped = structuredClone(environment);
  dropped.openings = dropped.openings.filter((item) => item.id !== "stair-front-window");
  assert.throws(
    () => new OpeningWindowFills().build(dropped),
    /population differs/,
  );
  const doubled = structuredClone(environment);
  const repeated = doubled.openings.find(
    (item) => item.id === "stair-front-window",
  );
  assert.ok(repeated);
  doubled.openings.push(repeated);
  assert.throws(
    () => new OpeningWindowFills().build(doubled),
    /population differs/,
  );
});

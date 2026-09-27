/** Every authored shallow storage footprint needs a real room-owned finish slab. */
require(require.resolve("tsx/cjs"));
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildHouse } = require("./house.ts");
const { GROUND_LAYERS, INTERSTOREY_FLOOR_FINISH } = require("./storeys.ts");

/** @param {import('@automovie/interface').IAutoMovieMesh['positions']} positions @param {number} offset */
const limits = (positions, offset) => {
  const values = [];
  for (let index = offset; index < positions.length; index += 3) values.push(positions[index]);
  return [Math.min(...values), Math.max(...values)];
};

/** @param {import('./house').IHouse} house */
const verifyStorageFloors = (house) => {
  assert.ok(house.storages.length > 0);
  for (const { room, storage } of house.storages) {
    const matches = house.parts.filter((part) => part.id === `${storage.id}-floor`);
    assert.equal(matches.length, 1, `${storage.id}: one floor slab`);
    const finish = matches[0];
    assert.equal(finish.role, "floor");
    assert.equal(finish.owner, room.owner);
    const depth = room.storey === "ground-storey" ? GROUND_LAYERS.finish : INTERSTOREY_FLOOR_FINISH;
    for (const [actual, expected] of [
      [limits(finish.mesh.positions, 0), storage.x],
      [limits(finish.mesh.positions, 1), [storage.y[0] - depth, storage.y[0]]],
      [limits(finish.mesh.positions, 2), storage.z],
    ]) {
      for (let edge = 0; edge < 2; edge++)
        assert.ok(Math.abs(actual[edge] - expected[edge]) < 1e-5, `${storage.id}: finish edge ${edge}`);
    }
  }
};

void test("every shallow storage receives its own complete floor finish at the parent room datum", () => {
  const house = buildHouse();
  assert.doesNotThrow(() => verifyStorageFloors(house));
  const missing = house.parts.filter((part) => part.id !== `${house.storages[0].storage.id}-floor`);
  assert.throws(() => verifyStorageFloors({ ...house, parts: missing }), /one floor slab/);
});

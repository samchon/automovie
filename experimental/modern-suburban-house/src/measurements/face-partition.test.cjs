/** A structural shell and its assigned finish retain one exact triangle population. */
require(require.resolve("tsx/cjs"));
const test = require("node:test");
const assert = require("node:assert/strict");
const { partitionPlaneFace } = require("../spaces/face-partition.ts");

void test("indexed face partition keeps positions and aligned attributes", () => {
  const mesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
    normals: [0, -1, 0, 0, -1, 0, 0, -1, 0, 1, 0, 0],
    uvs: [0, 0, 1, 0, 0, 1, 1, 1],
    colors: [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1],
    indices: [0, 1, 2, 0, 3, 1],
    skin: null,
  };
  const { face, body } = partitionPlaneFace(mesh, "y", 0);
  assert.deepEqual(face.positions, [0, 0, 0, 1, 0, 0, 0, 0, 1]);
  assert.deepEqual(body.positions, [0, 0, 0, 0, 1, 0, 1, 0, 0]);
  assert.deepEqual(face.normals, [0, -1, 0, 0, -1, 0, 0, -1, 0]);
  assert.deepEqual(body.uvs, [0, 0, 1, 1, 1, 0]);
  assert.deepEqual(face.colors, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  assert.equal(face.indices, null);
  assert.equal(body.indices, null);
  assert.equal(face.skin, null);
  assert.deepEqual(mesh.indices, [0, 1, 2, 0, 3, 1]);
});

void test("nonindexed face partition keeps absent optional attributes", () => {
  const mesh = {
    positions: [2, 0, 0, 2, 1, 0, 2, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: null,
    uvs: null,
    indices: null,
    skin: null,
  };
  const { face, body } = partitionPlaneFace(mesh, "x", 2);
  assert.equal(face.positions.length, 9);
  assert.equal(body.positions.length, 9);
  assert.equal(face.normals, null);
  assert.equal(face.uvs, null);
  assert.equal(face.colors, undefined);
});

void test("face partition refuses unsupported or incomplete input", () => {
  const mesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
    normals: null,
    uvs: null,
    indices: [0, 1, 2, 0, 3, 1],
    skin: null,
  };
  assert.throws(() => partitionPlaneFace({ ...mesh, skin: { joints: [], boneIndices: [], weights: [] } }, "y", 0), /skin data/);
  assert.throws(() => partitionPlaneFace({ ...mesh, indices: [0, 1] }, "y", 0), /complete triangles/);
  assert.throws(() => partitionPlaneFace({ ...mesh, indices: [0, 1, 9] }, "y", 0), /invalid vertex index/);
  assert.throws(() => partitionPlaneFace(mesh, "z", 9), /both face and body/);
  assert.throws(() => partitionPlaneFace({ ...mesh, positions: mesh.positions.slice(0, 9), indices: [0, 1, 2] }, "y", 0), /both face and body/);
});

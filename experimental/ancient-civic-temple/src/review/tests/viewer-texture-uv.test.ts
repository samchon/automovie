import assert from "node:assert/strict";
import test from "node:test";
import { uploadTemple } from "../../viewer/scene.mjs";
import type { ViewerPayload } from "../../viewer/payload";

const payload = (uvs?: number[]): ViewerPayload => ({
  environmentId: "test",
  models: [{ id: "test.model", name: "test", materials: [{
    id: "test.material", baseColor: { r: 1, g: 1, b: 1 }, roughness: 1, metallic: 0,
    opacity: 1, doubleSided: false, baseColorTexture: { asset: "test.png" },
  }], parts: [{ id: "shell", material: "test.material", mesh: {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2], ...(uvs ? { uvs } : {}),
  } }] }],
  placements: [{ node: "test", model: "test.model", position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } }],
} as unknown as ViewerPayload);

void test("a textured viewer part requires complete finite UV0", () => {
  assert.throws(() => uploadTemple(payload()), /UV0/);
  assert.throws(() => uploadTemple(payload([0, 0])), /UV0/);
  assert.throws(() => uploadTemple(payload([0, 0, 1, 0, Number.NaN, 1])), /UV0/);
  assert.equal(uploadTemple(payload([0, 0, 1, 0, 0, 1])).meshes.length, 1);
});

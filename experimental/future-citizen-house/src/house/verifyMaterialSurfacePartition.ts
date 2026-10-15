import { tessellateToMesh } from "@automovie/engine";
import assert from "node:assert/strict";
import { houseFinish } from "../materials/houseFinish";
import { houseTextureTile } from "../materials/houseTextureTile";
import { isHouseFinish } from "../materials/isHouseFinish";
import { metricMesh } from "../materials/metricMesh";
import { memberTexturePhase } from "../materials/memberTexturePhase";
import { woodGrainAxis } from "../materials/woodGrainAxis";
import { partitionSurfaceMesh } from "../materials/partitionSurfaceMesh";
import { mesh } from "./mesh";

/**
 * Face partitioning keeps every triangle, gives end grain exactly the two selected box faces, and
 * refuses missing normals or vertex colours; metric UVs stay finite, grain axes follow each
 * member's role and longest dimension, and end-grain finishes stay untextured.
 */
export function verifyMaterialSurfacePartition(): void {
  const box = tessellateToMesh({ type: "box", width: 1, height: 1, depth: 1 });
  const split = partitionSurfaceMesh(box, "oak-floor", { "z-": "wood-end/oak-floor", "z+": "wood-end/oak-floor" });
  assert.equal(split.reduce((sum, p) => sum + p.mesh.indices!.length, 0), box.indices!.length);
  assert.equal(split.find(p => p.finish === "wood-end/oak-floor")!.mesh.indices!.length, 12);
  assert.equal(partitionSurfaceMesh(box, "paint", {}).length, 1);
  assert.throws(() => partitionSurfaceMesh({ ...box, normals: null }, "paint", {}));
  assert.throws(() => partitionSurfaceMesh({ ...box, colors: [] }, "paint", {}));
  const noIndices = partitionSurfaceMesh({ ...mesh, indices: null, uvs: null }, "paint", {});
  assert.equal(noIndices.length, 1);
  const scale = { x: 2, y: .2, z: 1 };
  const uv = metricMesh(box, scale, "oak-stair", "stair-tread", { u: .36, v: 1.8 });
  assert.ok(uv.uvs!.every(Number.isFinite));
  assert.equal(woodGrainAxis("oak-floor", "floor", scale), "z");
  assert.equal(woodGrainAxis("oak-stair", "landing", scale), "z");
  assert.equal(woodGrainAxis("oak-joinery", "head", scale), "x");
  assert.equal(woodGrainAxis("oak-joinery", "top", { ...scale, z: 3 }), "z");
  assert.equal(woodGrainAxis("oak-joinery", "back", scale), "x");
  assert.equal(woodGrainAxis("oak-joinery", "back", { ...scale, y: 3 }), "y");
  assert.equal(woodGrainAxis("oak-joinery", "leaf", scale), "y");
  assert.equal(woodGrainAxis("oak-furniture", "leg", scale), "y");
  assert.equal(woodGrainAxis("oak-furniture", "top", { ...scale, z: 3 }), "z");
  assert.deepEqual(memberTexturePhase("test"), memberTexturePhase("test"));
  assert.ok(isHouseFinish("wood-end/oak-stair"));
  assert.equal(isHouseFinish("unknown"), false);
  assert.equal(houseFinish("wood-end/oak-floor").baseColorTexture, null);
  assert.equal(houseTextureTile("wood-end/oak-floor"), null);
}

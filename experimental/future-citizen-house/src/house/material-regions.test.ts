/** The independent area oracle for a unit cube is six square metres. A half
 * front face paints 0.5 and leaves 5.5; outside and opposed regions paint zero.
 * Clipping preserves geometric support and every remaining material surface. */
import assert from "node:assert/strict";
import { tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { partitionSurfaceRegions, type SurfaceRegion } from "../materials/surface-regions";

function area(mesh: IAutoMovieMesh): number {
  let value = 0;
  const indices = mesh.indices!;
  for (let i = 0; i < indices.length; i += 3) {
    const a = mesh.positions.slice(indices[i]! * 3, indices[i]! * 3 + 3), b = mesh.positions.slice(indices[i + 1]! * 3, indices[i + 1]! * 3 + 3), c = mesh.positions.slice(indices[i + 2]! * 3, indices[i + 2]! * 3 + 3);
    const u = b.map((v, k) => v - a[k]!), v = c.map((w, k) => w - a[k]!);
    value += Math.hypot(u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!) / 2;
  }
  return value;
}
export function verifyMaterialRegions(): void {
  const box = tessellateToMesh({ type: "box", width: 1, height: 1, depth: 1 });
  const region: SurfaceRegion = { finish: "paint", normal: "z+", min: [0, -.5, -.5], max: [.5, .5, .5] };
  const split = partitionSurfaceRegions(box, "stone", [region]);
  assert.ok(Math.abs(area(split.find(p => p.finish === "paint")!.mesh) - .5) < 1e-9);
  assert.ok(Math.abs(split.reduce((total, p) => total + area(p.mesh), 0) - 6) < 1e-9);
  assert.ok(split.every(p => p.mesh.positions.every(v => v >= -.5 && v <= .5)));
  assert.deepEqual(split, partitionSurfaceRegions(box, "stone", [region]));
  assert.equal(partitionSurfaceRegions(box, "stone", [{ ...region, min: [2, 2, 2], max: [3, 3, 3] }]).length, 1);
  assert.equal(partitionSurfaceRegions(box, "stone", []).length, 1);
  const full = partitionSurfaceRegions(box, "stone", [{ ...region, min: [-1, -1, -1], max: [1, 1, 1] }]);
  assert.ok(Math.abs(area(full.find(p => p.finish === "paint")!.mesh) - 1) < 1e-9);
  const noUv = { ...box, uvs: null };
  assert.ok(partitionSurfaceRegions(noUv, "stone", [region]).every(p => p.mesh.uvs === null));
  assert.throws(() => partitionSurfaceRegions({ ...box, normals: null }, "stone", [region]));
  assert.throws(() => partitionSurfaceRegions({ ...box, colors: [1, 1, 1] }, "stone", [region]));
  const triangle: IAutoMovieMesh = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], normals: [0, 0, 1, 0, 0, 1, 0, 0, 1], indices: null, uvs: null, skin: null };
  assert.ok(Math.abs(partitionSurfaceRegions(triangle, "stone", []).reduce((total, p) => total + area(p.mesh), 0) - .5) < 1e-9);
  assert.equal(partitionSurfaceRegions({ ...triangle, positions: [0, 0, 0, 0, 0, 0, 0, 0, 0] }, "stone", []).length, 0);
}

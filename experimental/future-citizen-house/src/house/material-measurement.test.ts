/** Hand-authored UV spans pin measurement coverage without inspecting source
 * text. A normalized 2-turn face is the negative twin of a 1-turn face; metre
 * tiles preserve native warnings and clamped axes retain their separate role. */
import assert from "node:assert/strict";
import { tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieMesh, IAutoMovieTextureReference } from "@automovie/interface";
import { materialFinish, metricBinding } from "../materials/001-binding-and-scale";
import { auditMaterialTextureScale } from "../materials/observation";
import { partitionSurfaceMesh } from "../materials/surface-parts";
import { metricMesh, woodGrainAxis, memberTexturePhase } from "../materials/metric-uv";
import { houseFinish, isHouseFinish, houseTextureTile } from "../materials/house-finishes";

const mesh: IAutoMovieMesh = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], normals: [0, 0, 1, 0, 0, 1, 0, 0, 1], uvs: [0, 0, 1, 0, 0, 1], indices: [0, 1, 2], skin: null };
function model(binding: IAutoMovieTextureReference | string | null, geometry = mesh): IAutoMovieModel {
  return { id: "test", name: "test", origin: "generated", skeleton: null, asset: null, body: null,
    materials: [{ ...materialFinish("test", "#808080", .5), baseColorTexture: binding }],
    parts: [{ id: "plane", name: "plane", material: "test", attachedBone: null, transform: null, geometry: { type: "mesh", mesh: geometry } }] };
}

export function verifyMaterialMeasurement(): void {
  for (const key of ["metallic","opacity","transmission","clearcoat","ior","thickness"] as const)
    for (const value of [-1,NaN,Infinity]) assert.throws(()=>materialFinish("invalid","#808080",.5,{[key]:value}));
  for (const key of ["metallic","opacity","transmission","clearcoat"] as const)
    assert.throws(()=>materialFinish("invalid","#808080",.5,{[key]:2}));
  for (const roughness of [-1,2,NaN]) assert.throws(()=>materialFinish("invalid","#808080",roughness));
  assert.equal(materialFinish("valid","#808080",0,{metallic:1,opacity:0,transmission:1,clearcoat:1,ior:1,thickness:0}).ior,1);
  for (const tile of [0,-1,NaN,Infinity]) assert.throws(()=>metricBinding("invalid",tile,1));
  const empty = auditMaterialTextureScale({ models: [] });
  assert.deepEqual([empty.models, empty.parts, empty.partsWithoutTexture, empty.axes.length], [0, 0, 0, 0]);
  const normalized: IAutoMovieTextureReference = { asset: "test", coordinateSource: "normalized", texCoord: 0, colorSpace: "srgb" };
  const good = auditMaterialTextureScale({ models: [model(normalized)] });
  assert.equal(good.validation.success, true);
  assert.deepEqual(good.axes.map(a => [a.axis, a.status, a.reason]), [["u", "checked", "normalized-span"], ["v", "checked", "normalized-span"]]);
  assert.equal(auditMaterialTextureScale({ models: [model(normalized, { ...mesh, uvs: [0, 0, 2, 0, 0, 1] })] }).validation.success, false);
  const repeated = metricBinding("test", 2, 2);
  const warning = auditMaterialTextureScale({ models: [model(repeated)] });
  assert.equal(warning.validation.success, true);
  assert.ok(warning.validation.success && warning.validation.warnings?.length === 2);
  const clamped = auditMaterialTextureScale({ models: [model({ ...repeated, sampler: { wrapS: "clamp", wrapT: "clamp", minFilter: "linear", magFilter: "linear" } })] });
  assert.deepEqual(clamped.axes.map(a => a.reason), ["clamp-fit", "clamp-fit"]);
  assert.equal(auditMaterialTextureScale({ models: [model(null)] }).partsWithoutTexture, 1);
  for (const [binding, geometry, reason] of [
    ["test", mesh, "string-binding"],
    [{ ...normalized, coordinateSource: undefined }, mesh, "missing-coordinate-source"],
    [{ ...normalized, coordinateSource: "source-uv" }, mesh, "source-uv"],
    [{ ...normalized, coordinateSource: "surface-metres" }, mesh, "invalid-or-missing-scale"],
    [normalized, { ...mesh, uvs: null }, "missing-uv"],
    [normalized, { ...mesh, uvs: [0, 0, 0, 0, 0, 0] }, "invalid-or-degenerate-uv"],
  ] as [IAutoMovieTextureReference | string, IAutoMovieMesh, string][]) {
    const result = auditMaterialTextureScale({ models: [model(binding, geometry)] });
    assert.ok(result.axes.every(a => a.reason === reason && a.status === "unverified"));
  }
  const primitive = model(normalized);
  primitive.parts[0]!.geometry = { type: "primitive", shape: { type: "box", width: 1, height: 1, depth: 1 } };
  assert.ok(auditMaterialTextureScale({ models: [primitive] }).axes.every(a => a.reason === "primitive"));
}

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

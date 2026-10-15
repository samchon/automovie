import type { IAutoMovieTextureReference, IAutoMovieModel, IAutoMovieMesh } from "@automovie/interface";
import { materialFinish } from "../materials/materialFinish";
import { metricBinding } from "../materials/metricBinding";
import { mesh } from "./mesh";
import assert from "node:assert/strict";
import { auditMaterialTextureScale } from "../materials/auditMaterialTextureScale";

function model(binding: IAutoMovieTextureReference | string | null, geometry = mesh): IAutoMovieModel {
  return {
    id: "test", name: "test", origin: "generated", skeleton: null, asset: null, body: null,
    materials: [{ ...materialFinish("test", "#808080", .5), baseColorTexture: binding }],
    parts: [{ id: "plane", name: "plane", material: "test", attachedBone: null, transform: null, geometry: { type: "mesh", mesh: geometry } }]
  };
}
export function verifyMaterialMeasurement(): void {
  for (const key of ["metallic", "opacity", "transmission", "clearcoat", "ior", "thickness"] as const)
    for (const value of [-1, NaN, Infinity]) assert.throws(() => materialFinish("invalid", "#808080", .5, { [key]: value }));
  for (const key of ["metallic", "opacity", "transmission", "clearcoat"] as const)
    assert.throws(() => materialFinish("invalid", "#808080", .5, { [key]: 2 }));
  for (const roughness of [-1, 2, NaN]) assert.throws(() => materialFinish("invalid", "#808080", roughness));
  assert.equal(materialFinish("valid", "#808080", 0, { metallic: 1, opacity: 0, transmission: 1, clearcoat: 1, ior: 1, thickness: 0 }).ior, 1);
  for (const tile of [0, -1, NaN, Infinity]) assert.throws(() => metricBinding("invalid", tile, 1));
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

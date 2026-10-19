import type { IAutoMovieModel } from "@automovie/interface";
import { Document, NodeIO, Primitive } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { exportModelToGLB } from "../../../../packages/render/src/node/exportModelToGLB";
import { createBicubicPlaneRecipe } from "../internal/createBicubicPlaneRecipe";
import { nclose } from "../internal/nclose";

/**
 * Export a polynomial unit square through the public model union and GLB writer.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads actual exported GLB positions and indices and measures their positive triangle area, exercising atlas dispatch in the existing static model exporter.
 * @evidence contracts/testing.md#independent-expectations The degree-elevated affine square independently occupies [0,1] metres in x and y with z=0 and area one. Bounds and signed area are computed from serialized attributes, not from the engine's reported counts.
 * @evidence contracts/testing.md#distinguishing-cases A valid atlas recipe has no mesh property, so the former primitive-versus-mesh branch cannot consume it. Existing export regressions retain primitive, indexed/unindexed mesh, normal and material cases. This case does not certify arbitrary curved fields or appearance.
 * @evidence contracts/testing.md#execution-ownership The discoverable async test owns one portable algebraic fixture and SDK byte round trip. It reads no assets and starts no process, viewer, browser or GPU. The SDK is also used by the writer; numeric square expectations remain independently stated.
 */
export async function test_geometry_bicubic_atlas_export(): Promise<void> {
  const model: IAutoMovieModel = {
    id: "polynomial-square",
    name: null,
    origin: "generated",
    body: null,
    skeleton: null,
    asset: null,
    materials: [],
    parts: [
      {
        id: "square",
        name: null,
        attachedBone: null,
        material: null,
        transform: null,
        geometry: createBicubicPlaneRecipe(),
      },
    ],
  };
  const document: Document = await new NodeIO().readBinary(
    await exportModelToGLB(model),
  );
  const primitive: Primitive | undefined = document
    .getRoot()
    .listMeshes()[0]
    ?.listPrimitives()[0];
  const positions: ArrayLike<number> | null =
    primitive?.getAttribute("POSITION")?.getArray() ?? null;
  const indices: ArrayLike<number> | null =
    primitive?.getIndices()?.getArray() ?? null;
  if (positions === null || indices === null || indices.length === 0)
    throw new Error("Polynomial square export has no indexed geometry");
  for (let i: number = 0; i < positions.length; i += 3)
    TestValidator.predicate(
      "export preserves metre bounds",
      positions[i]! >= 0 &&
        positions[i]! <= 1 &&
        positions[i + 1]! >= 0 &&
        positions[i + 1]! <= 1 &&
        nclose(positions[i + 2]!, 0),
    );
  let area: number = 0;
  for (let i: number = 0; i < indices.length; i += 3) {
    const a: number = indices[i]! * 3;
    const b: number = indices[i + 1]! * 3;
    const c: number = indices[i + 2]! * 3;
    const twiceArea: number =
      (positions[b]! - positions[a]!) *
        (positions[c + 1]! - positions[a + 1]!) -
      (positions[b + 1]! - positions[a + 1]!) * (positions[c]! - positions[a]!);
    TestValidator.predicate("export preserves positive winding", twiceArea > 0);
    area += twiceArea / 2;
  }
  TestValidator.predicate("export preserves unit area", nclose(area, 1, 1e-12));
}

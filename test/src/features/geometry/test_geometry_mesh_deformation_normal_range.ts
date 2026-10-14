import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshDeformationInfluence, createAutoMovieMeshDeformer } from "@automovie/engine";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

/**
 * Stretching an XY triangle along X never changes its +Z normal. The normal's
 * cofactor magnitude may exceed the range whose square fits Float64, while
 * the actual geometry and unit direction remain representable.
 *
 * Scenarios:
 * 1. Adjacent 1e150 and 1e155 X stretches both retain all three unit-Z normals.
 * 2. A normal-free input remains normal-free at the same extreme geometry.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes extreme X-stretch deformation, checking retained unit-Z normals, finite positions and absence of invented normals. It catches normalization that squares a finite cofactor into overflow while allowing representable geometry.
 * @evidence contracts/testing.md#independent-expectations Stretching an XY face along X leaves its normal direction +Z regardless of positive magnitude. The adjacent 1e150/1e155 stretches bracket squared-magnitude overflow while radius 1e160 keeps the existing inputs supported; exact retained normal components are numerical expectations, not rendered shading evidence.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both large stretches and the matching normal-present/normal-absent inputs. Malformed fields, local reflection, scale underflow and face orientation are owned by the other deformation tests; these two samples do not prove arbitrary extreme arithmetic.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry calls portable deformation source on its existing triangle records without a consumer install, native build, process, browser or GPU. It registers no extra tests or Human geometry cases.
 */
export function test_geometry_mesh_deformation_normal_range(): void {
  const mesh: {
    positions: number[];
    indices: number[];
    normals: number[];
    uvs: null;
    skin: null;
  } = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  };
  for (const stretch of [1e150, 1e155]) {
    const apply: (
      mesh: IAutoMovieMesh,
      influence?: readonly IAutoMovieMeshDeformationInfluence[],
    ) => IAutoMovieMesh = createAutoMovieMeshDeformer([
      {
        center: { x: 0, y: 0, z: 0 },
        radius: { x: 1e160, y: 1e160, z: 1e160 },
        displacement: { x: 0, y: 0, z: 0 },
        stretch: { x: stretch, y: 0, z: 0 },
      },
    ]);
    const result: IAutoMovieMesh = apply(mesh);
    TestValidator.predicate(
      "finite cofactor retains unit direction",
      equalGeometryTestValues(result.normals, mesh.normals),
    );
    TestValidator.predicate(
      "extreme geometry remains finite",
      result.positions.every(Number.isFinite),
    );
    TestValidator.equals(
      "missing normals are not invented",
      apply({ ...mesh, normals: null }).normals,
      null,
    );
  }
}

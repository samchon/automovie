import { createAutoMovieMeshDeformer } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationInfluence,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";

/**
 * Stretching an XY triangle along X never changes its +Z normal. The normal's
 * cofactor magnitude may exceed the range whose square fits Float64, while the
 * actual geometry and unit direction remain representable.
 *
 * Scenarios:
 *
 * 1. Adjacent 1e150 and 1e155 X stretches both retain all three unit-Z normals.
 * 2. A normal-free input remains normal-free at the same extreme geometry.
 */
export function test_unit_engine_geometry_geometry_mesh_deformation_normal_range(): void {
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
    TestValidator.equals(
      "missing normals are not invented",
      apply({ ...mesh, normals: null }).normals,
      null,
    );
  }
}

import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { isFiniteProceduralMesh } from "../internal/isFiniteProceduralMesh";

/**
 * The procedural observer distinguishes absent optional buffers from malformed
 * numeric components without inventing normals or topology for a bare mesh.
 *
 * Scenarios:
 * 1. An authored indexed triangle and its nonindexed/normal-free twin are finite.
 * 2. A nonfinite position, nonfinite normal or fractional explicit index each
 *    makes the observer refuse its numerical claim beside the supported twin.
 */
export const test_geometry_finite_mesh_oracle = (): void => {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2], uvs: null, skin: null,
  };
  TestValidator.equals("finite explicit attributes", isFiniteProceduralMesh(mesh), true);
  TestValidator.equals("absent optional attributes", isFiniteProceduralMesh({ ...mesh, normals: null, indices: null }), true);
  TestValidator.equals("nonfinite position", isFiniteProceduralMesh({ ...mesh, positions: [NaN, ...mesh.positions.slice(1)] }), false);
  TestValidator.equals("nonfinite normal", isFiniteProceduralMesh({ ...mesh, normals: [Infinity, ...mesh.normals!.slice(1)] }), false);
  TestValidator.equals("fractional topology component", isFiniteProceduralMesh({ ...mesh, indices: [0, 1, 1.5] }), false);
};

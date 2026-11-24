import { countAutoMovieMeshComponents } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `countAutoMovieMeshComponents` counts triangle connectivity by shared
 * indices, not by coincident positions.
 *
 * Scenarios:
 *
 * 1. Triangles (0,1,2) and (1,3,2) share indices: one component.
 * 2. Two triangles with disjoint indices and positions: two components.
 * 3. Two triangles at the same positions but with separate indices: two
 *    components.
 * 4. A fourth, unused vertex adds no component to one used triangle: one.
 * 5. No triangle: zero.
 */
export function test_unit_engine_geometry_mesh_components(): void {
  const count = (positions: number[], indices: number[]): number => {
    const mesh: IAutoMovieMesh = {
      positions,
      indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    return countAutoMovieMeshComponents(mesh);
  };
  TestValidator.equals(
    "shared",
    count([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], [0, 1, 2, 1, 3, 2]),
    1,
  );
  TestValidator.equals(
    "disjoint",
    count(
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 3, 0, 0, 4, 0, 0, 3, 1, 0],
      [0, 1, 2, 3, 4, 5],
    ),
    2,
  );
  TestValidator.equals(
    "coincident",
    count(
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 1, 2, 3, 4, 5],
    ),
    2,
  );
  TestValidator.equals(
    "unused vertex",
    count([0, 0, 0, 1, 0, 0, 0, 1, 0, 9, 9, 9], [0, 1, 2]),
    1,
  );
  TestValidator.equals("empty", count([], []), 0);
}

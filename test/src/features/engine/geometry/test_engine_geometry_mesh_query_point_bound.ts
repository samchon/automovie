import { AutoMovieEngineGeometry } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `boundMeshQueryPoint(node, point, cutoff?)` is the squared distance
 * from a point to a box, summed x, y, z, returning the partial sum as soon as
 * it strictly exceeds the cutoff.
 *
 * Fixture: the box [0, 1]^3.
 *
 * Scenarios:
 *
 * 1. (0.5, 0.5, 0.5) inside: 0; (3, 0.5, 0.5): 4; (2, 3, -1): 1 + 4 + 1 = 6.
 * 2. For (2, 3, -1): cutoff 0.5 stops after x at 1; cutoff 3 stops after y at 5;
 *    cutoffs 6 (equality continues) and 5.9 sum all three to 6.
 */
export function test_engine_geometry_mesh_query_point_bound(): void {
  const box = { low: [0, 0, 0], high: [1, 1, 1] };

  // 1.
  TestValidator.equals(
    "full",
    [
      AutoMovieEngineGeometry.boundMeshQueryPoint(box, [0.5, 0.5, 0.5]),
      AutoMovieEngineGeometry.boundMeshQueryPoint(box, [3, 0.5, 0.5]),
      AutoMovieEngineGeometry.boundMeshQueryPoint(box, [2, 3, -1]),
    ],
    [0, 4, 6],
  );

  // 2.
  TestValidator.equals(
    "cutoffs",
    [0.5, 3, 6, 5.9].map((cutoff: number): number =>
      AutoMovieEngineGeometry.boundMeshQueryPoint(box, [2, 3, -1], cutoff),
    ),
    [1, 5, 6, 6],
  );
}

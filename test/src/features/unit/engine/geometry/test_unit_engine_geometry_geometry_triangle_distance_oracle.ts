import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { closestTriangleDistanceSquaredOracle } from "../../../internal/closestTriangleDistanceSquaredOracle";
import { nclose } from "../../../internal/predicates";

/**
 * The independent exhaustive oracle covers all seven triangle Voronoi regions. Expected squared distances follow a right triangle with two-metre edges; they are hand-derived from its vertices, closed edges and interior plane.
 *
 * Scenarios:
 * 1. Vertex A/B/C each lies one metre away in both planar axes and height.
 * 2. AB/AC edge regions have two squared metres; BC has three.
 * 3. An interior point has only its one-metre height and an on-face point zero.
 */
export function test_unit_engine_geometry_geometry_triangle_distance_oracle(): void {
  const a: number[] = [0, 0, 0],
    b: number[] = [2, 0, 0],
    c: number[] = [0, 2, 0];
  const query: ReturnType<typeof createAutoMovieSignedMeshQuery> =
    createAutoMovieSignedMeshQuery(
      {
        positions: [...a, ...b, ...c],
        normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
        uvs: null,
        indices: [0, 1, 2],
        skin: null,
      },
      { boundary: "open" },
    );
  for (const [region, point, expected] of [
    ["A", [-1, -1, 1], 3],
    ["B", [3, -1, 1], 3],
    ["AB", [1, -1, 1], 2],
    ["C", [-1, 3, 1], 3],
    ["AC", [-1, 1, 1], 2],
    ["BC", [2, 2, 1], 3],
    ["face", [0.5, 0.5, 1], 1],
    ["surface", [0.5, 0.5, 0], 0],
  ] as const) {
    TestValidator.predicate(
      `${region} follows the authored Euclidean metric`,
      nclose(
        closestTriangleDistanceSquaredOracle(point, a, b, c),
        expected,
        1e-12,
      ),
    );
    const distance: number = query(point).distance;
    TestValidator.predicate(
      `${region} production query follows the authored Euclidean metric`,
      nclose(distance * distance, expected, 1e-12),
    );
  }
}

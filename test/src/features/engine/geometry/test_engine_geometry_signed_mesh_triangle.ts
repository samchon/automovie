import { AutoMovieEngineGeometry } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { closestTriangleDistanceSquaredOracle } from "../../internal/closestTriangleDistanceSquaredOracle";
import { nclose } from "../../internal/predicates";

/**
 * `createAutoMovieSignedMeshQuery` measures the distance to a triangle across
 * all seven Voronoi regions, checked against an exhaustive oracle.
 *
 * Triangle: A (0,0,0), B (2,0,0), C (0,2,0), an open surface.
 *
 * Scenarios:
 *
 * 1. Each vertex region (points (-1,-1,1), (3,-1,1), (-1,3,1)) is 3 squared metres
 *    away: one metre in each of two planar axes and in height.
 * 2. The edge regions AB (1,-1,1) and AC (-1,1,1) are 2 squared metres away; BC
 *    (2,2,1) is 3.
 * 3. A point above the face (0.5,0.5,1) is 1 and one on it (0.5,0.5,0) is 0. The
 *    query and the oracle agree on each.
 */
export function test_engine_geometry_signed_mesh_triangle(): void {
  const a: number[] = [0, 0, 0];
  const b: number[] = [2, 0, 0];
  const c: number[] = [0, 2, 0];
  const query = AutoMovieEngineGeometry.createSignedMeshQuery(
    {
      positions: [...a, ...b, ...c],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: null,
      indices: [0, 1, 2],
      skin: null,
    },
    { boundary: "open" },
  );
  const cases: [string, number[], number][] = [
    ["A", [-1, -1, 1], 3],
    ["B", [3, -1, 1], 3],
    ["AB", [1, -1, 1], 2],
    ["C", [-1, 3, 1], 3],
    ["AC", [-1, 1, 1], 2],
    ["BC", [2, 2, 1], 3],
    ["face", [0.5, 0.5, 1], 1],
    ["surface", [0.5, 0.5, 0], 0],
  ];
  for (const [region, point, expected] of cases) {
    TestValidator.predicate(
      `${region} oracle`,
      nclose(
        closestTriangleDistanceSquaredOracle(point, a, b, c),
        expected,
        1e-12,
      ),
    );
    const distance: number = query(point).distance;
    TestValidator.predicate(
      `${region} query`,
      nclose(distance * distance, expected, 1e-12),
    );
  }
}

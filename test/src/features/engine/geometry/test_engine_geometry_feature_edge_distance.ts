import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMeasureFeatureEdges,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { surfaceTriangleOf } from "../../internal/surfaceTriangleOf";
import { throwsError } from "../../internal/throwsError";

/**
 * `measureFeatureEdges` signs each sharp edge convex or concave, and
 * `featureEdgeDistance` measures a surface point to the nearest of
 * each sign, capped at the reach.
 *
 * Fixture: the L profile (0,0), (2,0), (2,1), (1,1), (1,2), (0,2) extruded 1 m
 * along z, wound outward, every side and cap split into unit squares meeting
 * vertex to vertex; reach 0.05 m.
 *
 * Scenarios:
 *
 * 1. 22 feature edges: one concave, the vertical crease at x = 1, y = 1; 21
 *    convex (5 outer vertical corners and 16 unit cap rim edges).
 * 2. On the inner face x = 1, 0.01 m from the crease, the concave distance is
 *    0.01 within 1e-9.
 * 3. On the outer face x = 2, 0.02 m below the top rim, the convex distance is
 *    0.02 and the concave one is capped at the reach.
 * 4. A triangle index past the mesh throws.
 */
export function test_engine_geometry_feature_edge_distance(): void {
  const profile: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 2],
    [0, 2],
    [0, 1],
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  const quad = (...corners: number[][]): void => {
    const base: number = positions.length / 3;
    positions.push(...corners.flat());
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  profile.forEach(([x0, y0]: [number, number], i: number): void => {
    const [x1, y1]: [number, number] = profile[(i + 1) % profile.length]!;
    quad([x0, y0, 0], [x1, y1, 0], [x1, y1, 1], [x0, y0, 1]);
  });
  for (const [x, y] of [
    [0, 0],
    [1, 0],
    [0, 1],
  ] satisfies [number, number][]) {
    quad([x, y, 1], [x + 1, y, 1], [x + 1, y + 1, 1], [x, y + 1, 1]);
    quad([x, y, 0], [x, y + 1, 0], [x + 1, y + 1, 0], [x + 1, y, 0]);
  }
  const measured: IAutoMovieMeasureFeatureEdges.IResult = AutoMovieEngineGeometry.measureFeatureEdges({
    positions,
    indices,
    reach: 0.05,
  });
  const at = (point: IAutoMovieVector3) =>
    AutoMovieEngineGeometry.featureEdgeDistance({
      edges: measured,
      triangle: surfaceTriangleOf(positions, indices, point),
      point,
    });

  // 1.
  const concave: IAutoMovieMeasureFeatureEdges.IEdge[] = measured.edges.filter(
    (e: IAutoMovieMeasureFeatureEdges.IEdge): boolean => !e.convex,
  );
  TestValidator.equals("edge count", [measured.edges.length, concave.length], [22, 1]);
  TestValidator.predicate(
    "crease at (1, 1)",
    [concave[0]!.a, concave[0]!.b].every((p: IAutoMovieVector3): boolean => p.x === 1 && p.y === 1),
  );

  // 2.
  TestValidator.predicate("inner face", Math.abs(at({ x: 1, y: 1.01, z: 0.5 }).concave - 0.01) <= 1e-9);

  // 3.
  const outer = at({ x: 2, y: 0.5, z: 0.98 });
  TestValidator.predicate("outer face", Math.abs(outer.convex - 0.02) <= 1e-9 && outer.concave === 0.05);

  // 4.
  TestValidator.predicate(
    "triangle past the mesh",
    throwsError((): unknown =>
      AutoMovieEngineGeometry.featureEdgeDistance({ edges: measured, triangle: indices.length, point: { x: 0, y: 0, z: 0 } }),
    ),
  );
}

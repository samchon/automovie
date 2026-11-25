import { triangulateRegion } from "@automovie/engine";
import type { IAutoMovieProfilePoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `triangulateRegion(outer, holes, label)` lays a planar region out canonically
 * and ear-clips it, naming the region `label` in diagnostics.
 *
 * Scenarios:
 *
 * 1. A clockwise unit square: points reversed to (1,0), (1,1), (0,1), (0,0),
 *    source indices [3, 2, 1, 0], area 1, triangles [3, 0, 1, 1, 2, 3].
 * 2. A two-point ring labelled "wall" is refused as "wall outer ring needs at
 *    least three points".
 */
export function test_engine_geometry_triangulate_region(): void {
  const ring = (...xy: number[]): IAutoMovieProfilePoint[] =>
    Array.from({ length: xy.length / 2 }, (_: unknown, i: number) => ({
      x: xy[2 * i]!,
      y: xy[2 * i + 1]!,
    }));

  // 1.
  TestValidator.equals(
    "square",
    triangulateRegion(ring(0, 0, 0, 1, 1, 1, 1, 0), [], "square"),
    {
      points: ring(1, 0, 1, 1, 0, 1, 0, 0),
      sourceIndices: [3, 2, 1, 0],
      rings: [{ start: 0, count: 4 }],
      area: 1,
      triangles: [3, 0, 1, 1, 2, 3],
    },
  );

  // 2.
  TestValidator.predicate(
    "label",
    throwsError(
      (): unknown => triangulateRegion(ring(0, 0, 1, 0), [], "wall"),
      "wall outer ring needs at least three points",
    ),
  );
}

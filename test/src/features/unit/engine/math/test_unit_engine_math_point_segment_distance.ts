import { pointSegmentDistance } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `pointSegmentDistance` is the distance from a point to a closed segment.
 *
 * Scenarios:
 *
 * 1. A point above the middle of a segment on the x axis is 1 away.
 * 2. A point past an endpoint measures to that endpoint: (3, 0, 0) is 2 from the
 *    segment (-1..1).
 * 3. Coincident endpoints give the point distance: (0, 3, 4) is 5.
 */
export function test_unit_engine_math_point_segment_distance(): void {
  const a: IAutoMovieVector3 = { x: -1, y: 0, z: 0 };
  const b: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const near = (
    x: number,
    y: number,
    z: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): number => pointSegmentDistance({ x, y, z }, from, to);
  TestValidator.predicate("interior", nclose(near(0, 1, 0, a, b), 1, 1e-12));
  TestValidator.predicate("past end", nclose(near(3, 0, 0, a, b), 2, 1e-12));
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  TestValidator.predicate(
    "degenerate",
    nclose(near(0, 3, 4, origin, origin), 5, 1e-12),
  );
}

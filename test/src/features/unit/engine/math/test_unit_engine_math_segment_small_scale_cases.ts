import {
  closestPointOnSegmentXZ,
  closestPointsBetweenSegments,
  pointSegmentDistance,
  segmentSegmentDistance,
} from "@automovie/engine";
import {
  type IAutoMovieClosestSegmentPoints,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../../internal/predicates";

/**
 * Orthogonal ten-micrometre segments have a one-micrometre interior gap. A
 * dimensionless parallel threshold must not replace that closest pair.
 *
 * Scenarios:
 *
 * 1. Both public consumers return the independently known interior gap.
 * 2. Witnesses lie at the two segment midpoints, not at their endpoints.
 * 3. A 1e-10 metre segment retains its interior point distance and XZ projection.
 */
export function test_unit_engine_math_segment_small_scale_cases(): void {
  const a: IAutoMovieVector3 = { x: -5e-6, y: 0, z: 0 };
  const b: IAutoMovieVector3 = { x: 5e-6, y: 0, z: 0 };
  const c: IAutoMovieVector3 = { x: 0, y: -5e-6, z: 1e-6 };
  const d: IAutoMovieVector3 = { x: 0, y: 5e-6, z: 1e-6 };
  const pair: IAutoMovieClosestSegmentPoints = closestPointsBetweenSegments(
    a,
    b,
    c,
    d,
  );
  TestValidator.predicate(
    `independent one-micrometre gap: ${JSON.stringify(pair)}`,
    nclose(pair.distance, 1e-6, 1e-15) &&
      nclose(segmentSegmentDistance(a, b, c, d), 1e-6, 1e-15),
  );
  TestValidator.predicate(
    "interior midpoint witnesses",
    vclose(pair.pointA, { x: 0, y: 0, z: 0 }, 1e-15) &&
      vclose(pair.pointB, { x: 0, y: 0, z: 1e-6 }, 1e-15),
  );
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const end: IAutoMovieVector3 = { x: 1e-10, y: 0, z: 0 };
  const midpoint: IAutoMovieVector3 = { x: 5e-11, y: 0, z: 0 };
  TestValidator.predicate(
    "a tiny real segment retains its interior point distance",
    nclose(pointSegmentDistance(midpoint, start, end), 0, 1e-25),
  );
  TestValidator.predicate(
    "horizontal projection retains tiny real segment interiors",
    vclose(closestPointOnSegmentXZ(midpoint, start, end), midpoint, 1e-25),
  );
}

import {
  closestPointOnSegmentXZ,
  closestPointsBetweenSegments,
  pointSegmentDistance,
  segmentSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieClosestSegmentPoints,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../internal/predicates";

/**
 * The closest-pair helpers keep micrometre-scale geometry: a dimensionless
 * parallel threshold must not replace an interior closest pair.
 *
 * Segments: A from (-5e-6, 0, 0) to (5e-6, 0, 0) and C from (0, -5e-6, 1e-6) to
 * (0, 5e-6, 1e-6), orthogonal ten-micrometre segments one micrometre apart.
 *
 * Scenarios:
 *
 * 1. `closestPointsBetweenSegments` and `segmentSegmentDistance` give the gap
 *    1e-6, with witnesses at the two midpoints (0, 0, 0) and (0, 0, 1e-6).
 * 2. On a 1e-10 metre segment, the midpoint is 0 from it by `pointSegmentDistance`
 *    and is its own XZ projection by `closestPointOnSegmentXZ`.
 */
export function test_engine_math_segment_small_scale(): void {
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
  TestValidator.predicate("pair gap", nclose(pair.distance, 1e-6, 1e-15));
  TestValidator.predicate(
    "distance gap",
    nclose(segmentSegmentDistance(a, b, c, d), 1e-6, 1e-15),
  );
  TestValidator.predicate(
    "witnesses",
    vclose(pair.pointA, { x: 0, y: 0, z: 0 }, 1e-15) &&
      vclose(pair.pointB, { x: 0, y: 0, z: 1e-6 }, 1e-15),
  );
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const end: IAutoMovieVector3 = { x: 1e-10, y: 0, z: 0 };
  const middle: IAutoMovieVector3 = { x: 5e-11, y: 0, z: 0 };
  TestValidator.predicate(
    "tiny segment interior",
    nclose(pointSegmentDistance(middle, start, end), 0, 1e-25),
  );
  TestValidator.predicate(
    "tiny segment projection",
    vclose(closestPointOnSegmentXZ(middle, start, end), middle, 1e-25),
  );
}

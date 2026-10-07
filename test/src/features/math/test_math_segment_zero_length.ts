import {
  pointSegmentDistance,
  segmentSegmentDistance,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * An exact collapsed segment is a point and must retain finite point-to-point
 * and point-to-segment distances. A NaN separation would silently evade a
 * collision check, so each independently known distance is checked as finite.
 *
 * Scenarios:
 *
 * 1. Point to a zero-length segment: the exact point-to-endpoint distance
 *    (`(3,4,0)` to the collapsed segment at the origin is `5`), degrading to
 *    the correct point-to-point measure rather than `NaN`.
 * 2. A zero-length segment overlapping a real segment has minimum zero:
 *    the case a capsule whose centerline collapses
 *    to a point must still flag when another capsule passes through it.
 * 3. A zero-length segment clear of a real segment: a finite, exact gap.
 */
export const test_math_segment_zero_length = (): void => {
  const origin = { x: 0, y: 0, z: 0 };

  TestValidator.predicate(
    "point to collapsed segment is the point-to-point distance",
    nclose(pointSegmentDistance({ x: 3, y: 4, z: 0 }, origin, origin), 5),
  );

  // A collapsed segment sitting on the x-axis segment [(-1,0,0),(1,0,0)]:
  // the true minimum distance is 0 because the point lies on the segment.
  TestValidator.predicate(
    "collapsed segment overlapping a real segment measures zero",
    nclose(
      segmentSegmentDistance(
        origin,
        origin,
        { x: -1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ),
      0,
    ),
  );

  // The same collapsed segment lifted 2m above the x-axis segment: an exact,
  // finite gap of 2 rather than NaN.
  TestValidator.predicate(
    "collapsed segment clear of a real segment measures the exact gap",
    nclose(
      segmentSegmentDistance(
        { x: 0, y: 2, z: 0 },
        { x: 0, y: 2, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ),
      2,
    ),
  );
};

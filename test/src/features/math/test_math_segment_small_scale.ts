import {
  closestPointsBetweenSegments,
  segmentSegmentDistance,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Orthogonal ten-micrometre segments have a one-micrometre interior gap.
 * A dimensionless parallel threshold must not replace that closest pair.
 *
 * Scenarios:
 * 1. Both public consumers return the independently known interior gap.
 * 2. Witnesses lie at the two segment midpoints, not at their endpoints.
 */
export const test_math_segment_small_scale = (): void => {
  const a = { x: -5e-6, y: 0, z: 0 };
  const b = { x: 5e-6, y: 0, z: 0 };
  const c = { x: 0, y: -5e-6, z: 1e-6 };
  const d = { x: 0, y: 5e-6, z: 1e-6 };
  const pair = closestPointsBetweenSegments(a, b, c, d);
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
};

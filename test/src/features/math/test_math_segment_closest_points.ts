import { closestPointsBetweenSegments } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Bounded segment witnesses describe the same separation used by scalar
 * distance checks. Facing endpoints and exact contact have independent
 * known witnesses, including zero distance where a normal needs a fallback.
 *
 * Scenarios:
 *
 * 1. Two colinear, separated segments: the closest pair is the facing endpoints
 *    and the distance is the gap.
 * 2. A segment endpoint lying on the other segment: the pair coincides and the
 *    distance is zero (the case a contact normal must fall back from).
 *
 * @evidence contracts/testing.md#behavioral-verification Queries actual closest segment witnesses and checks the separated endpoints, unit gap and zero-distance coincident witnesses. An unbounded-line result or wrong endpoint separation fails these assertions.
 * @evidence contracts/testing.md#independent-expectations The collinear segments [0,1] and [2,3] on X have facing witnesses X=1 and X=2, one unit apart; the perpendicular segments share the origin and therefore have zero separation. Coincidence alone does not locate the touching witness independently within the segments.
 * @evidence contracts/testing.md#distinguishing-cases Keeps a positive collinear gap and exact shared-endpoint contact. Interior skew minima, tiny spans, rank degeneracies, malformed arithmetic and nonunique tie selection belong to the separate segment entries.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit owns both cases and invokes portable closest-segment source, without installing a consumer, compiling a native artifact, launching a host or dynamically registering tests.
 */
export function test_math_segment_closest_points(): void {
  const gap: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  );
  TestValidator.predicate("colinear gap distance", nclose(gap.distance, 1));
  TestValidator.predicate(
    "closest point on first segment",
    vclose(gap.pointA, { x: 1, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "closest point on second segment",
    vclose(gap.pointB, { x: 2, y: 0, z: 0 }),
  );

  const touching: ReturnType<typeof closestPointsBetweenSegments> = closestPointsBetweenSegments(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
  );
  TestValidator.predicate(
    "touching distance zero",
    nclose(touching.distance, 0),
  );
  TestValidator.predicate(
    "touching points coincide",
    vclose(touching.pointA, touching.pointB),
  );
}

import { measureHumanNeckReach } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The neck's reach is where the running neck share first falls below half.
 *
 * Vertices are taken in order of distance from the collar; `isNeck` marks the
 * ones the neck or head bone dominates.
 *
 * Scenarios:
 * 1. Distances 0..6 with the neck on the first three: the running share is 1,
 *    1, 1, 3/4, 3/5, 3/6 (exactly half, not below) and 3/7 at distance 6, so
 *    the reach is 6.
 * 2. The input order does not matter, only the distances: the same vertices
 *    listed backwards give the same reach.
 * 3. A vertex the collar cannot reach (Infinity) is ignored: adding one leaves
 *    the reach unchanged.
 * 4. A skin the neck carries throughout has its greatest finite distance as
 *    reach.
 * 5. A skin with no reachable vertex refuses.
 */
export const test_human_neck_reach = (): void => {
  const distance = Float64Array.from([0, 1, 2, 3, 4, 5, 6]);
  const neck = (vertex: number): boolean => vertex < 3;
  TestValidator.predicate(
    "the reach is where the share first drops below half",
    nclose(measureHumanNeckReach(distance, neck), 6, 1e-12),
  );
  const reversed = Float64Array.from([6, 5, 4, 3, 2, 1, 0]);
  TestValidator.predicate(
    "the order of the vertices does not matter",
    nclose(measureHumanNeckReach(reversed, (v) => v > 3), 6, 1e-12),
  );
  TestValidator.predicate(
    "an unreachable vertex is ignored",
    nclose(
      measureHumanNeckReach(Float64Array.from([...distance, Infinity]), neck),
      6,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "a skin the neck carries throughout reaches as far as it goes",
    nclose(measureHumanNeckReach(Float64Array.from([0, 2, 9]), () => true), 9, 1e-12),
  );
  TestValidator.predicate(
    "nothing reachable refuses",
    throwsError(
      () =>
        measureHumanNeckReach(Float64Array.from([Infinity]), () => true),
      "reachable",
    ),
  );
};

import { measureHumanHeadReach } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The head's reach is the distance holding 95 percent of its weight.
 *
 * Vertices are taken in order of distance, and only those within the limit
 * count.
 *
 * Scenarios:
 * 1. Twenty vertices at distances 0..19 with head weight 1 on the first ten
 *    and none after: 95 percent of ten is 9.5, first reached by the tenth
 *    vertex (weight sum 10), at distance 9.
 * 2. A limit of 5 keeps only the first five vertices (0..4), whose whole 5 is
 *    reached at the fifth, distance 4; 95 percent of 5 is 4.75, reached at
 *    the fifth.
 * 3. A vertex the collar cannot reach (Infinity) is not counted.
 * 4. With no head weight inside the limit the function refuses.
 */
export const test_human_head_reach = (): void => {
  const distance = Float64Array.from({ length: 20 }, (_, k) => k);
  const head = (vertex: number): number => (vertex < 10 ? 1 : 0);
  TestValidator.predicate(
    "the reach holds 95 percent of the head's weight",
    nclose(measureHumanHeadReach(distance, head, 100), 9, 1e-12),
  );
  TestValidator.predicate(
    "the limit keeps far weight out",
    nclose(measureHumanHeadReach(distance, head, 5), 4, 1e-12),
  );
  TestValidator.predicate(
    "an unreachable vertex is not counted",
    nclose(
      measureHumanHeadReach(
        Float64Array.from([...distance, Infinity]),
        head,
        100,
      ),
      9,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "no head weight refuses",
    throwsError(
      () => measureHumanHeadReach(distance, () => 0, 100),
      "no head weight",
    ),
  );
};

import { TestValidator } from "@nestia/e2e";

import { ansurPercentile } from "../../../scripts/body-ansur/ansurPercentile";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The percentile interpolates the sorted sample at position p(n-1).
 *
 * Scenarios:
 * 1. For 1,2,3,4,5 the median is 3 and p=0.9 lies 0.6 of the way from 4 to 5
 *    (position 3.6), whatever the input order, and the input is not mutated.
 * 2. The endpoints p=0 and p=1 return the minimum and maximum, and a single
 *    value answers every probability.
 * 3. An empty sample, a probability outside [0, 1] (both sides, and NaN) and a
 *    non-finite value are refused.
 */
export const test_human_body_ansur_percentile = (): void => {
  const sample = [5, 1, 4, 2, 3];
  TestValidator.predicate("median", nclose(ansurPercentile(sample, 0.5), 3));
  TestValidator.predicate("p90", nclose(ansurPercentile(sample, 0.9), 4.6));
  TestValidator.equals("input kept", sample, [5, 1, 4, 2, 3]);
  TestValidator.equals("minimum", ansurPercentile(sample, 0), 1);
  TestValidator.equals("maximum", ansurPercentile(sample, 1), 5);
  TestValidator.equals("single value", ansurPercentile([7], 0.3), 7);
  for (const task of [
    () => ansurPercentile([], 0.5),
    () => ansurPercentile([1], -0.1),
    () => ansurPercentile([1], 1.1),
    () => ansurPercentile([1], Number.NaN),
    () => ansurPercentile([1, Number.NaN], 0.5),
  ])
    TestValidator.predicate("refused", throwsError(task));
};

import { TestValidator } from "@nestia/e2e";

import { pickAnsurStrata } from "../../../scripts/body-ansur/pickAnsurStrata";
import { throwsError } from "../internal/predicates";

/**
 * Strata spread evenly over the 1st to 99th percentile of the ordering key.
 *
 * Scenarios:
 * 1. Of 101 rows keyed 0..100 (shuffled), three strata take ranks of p=0.01,
 *    0.5 and 0.99, which are 1, 50 and 99, so the extremes 0 and 100 are
 *    skipped.
 * 2. One stratum takes the median; equal keys keep file order.
 * 3. A row without the key is skipped; no keyed row, a zero count and a
 *    fractional count are refused.
 */
export const test_human_body_ansur_strata = (): void => {
  const rows = Array.from({ length: 101 }, (_, i) => ({ k: (i * 37) % 101 }));
  TestValidator.equals(
    "three strata",
    pickAnsurStrata(rows, (row) => row.k, 3).map((row) => row.k),
    [1, 50, 99],
  );
  const ties = [{ k: 1, id: 0 }, { k: 1, id: 1 }, { k: 1, id: 2 }];
  TestValidator.equals(
    "median keeps file order among ties",
    pickAnsurStrata(ties, (row) => row.k, 1).map((row) => row.id),
    [1],
  );
  const partial: Record<string, number>[] = [{ a: 1 }, { b: 2 }, { a: 3 }];
  TestValidator.equals(
    "rows without the key are skipped",
    pickAnsurStrata(partial, (row) => row.a ?? Number.NaN, 2),
    [{ a: 1 }, { a: 3 }],
  );
  for (const task of [
    () => pickAnsurStrata(partial, () => Number.NaN, 1),
    () => pickAnsurStrata(rows, (row) => row.k, 0),
    () => pickAnsurStrata(rows, (row) => row.k, 1.5),
  ])
    TestValidator.predicate("refused", throwsError(task));
};

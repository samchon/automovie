import type { IAutoMovieRecoveryUntiltedEstimate } from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `copyRecoveryUntiltedEstimate` charges 64 work units per selected row and one
 * more, then copies an estimate whose rows are ordered, past row 0, and carry
 * nonnegative multipliers.
 *
 * Scenarios, over width 2 and 4 rows:
 *
 * 1. No estimate charges 64 and copies nothing.
 * 2. Rows [1, 3] with multipliers [0.5, 0] charge 192 and copy equal but new.
 * 3. Rows out of order, a negative multiplier and a changed width are refused.
 */
export function test_recovery_internal_copy_untilted_estimate(): void {
  const charged: number[] = [];
  const charge: (work: number) => void = (work: number): void => {
    charged.push(work);
  };
  TestValidator.equals(
    "no estimate",
    AutoMovieRecoveryCameraMap.copyUntiltedEstimate(null, 2, 4, charge),
    null,
  );
  const estimate: IAutoMovieRecoveryUntiltedEstimate = {
    width: 2,
    rowCount: 4,
    selected: [1, 3],
    multipliers: [0.5, 0],
  };
  const copy: IAutoMovieRecoveryUntiltedEstimate | null =
    AutoMovieRecoveryCameraMap.copyUntiltedEstimate(estimate, 2, 4, charge);
  TestValidator.predicate(
    "an equal new copy",
    JSON.stringify(copy) === JSON.stringify(estimate) &&
      copy?.selected !== estimate.selected,
  );
  TestValidator.equals("the charges", charged, [64, 192]);
  for (const [name, wrong, width] of [
    ["out of order", { ...estimate, selected: [3, 1] }, 2],
    ["a negative multiplier", { ...estimate, multipliers: [0.5, -1] }, 2],
    ["a changed width", estimate, 3],
  ] as const)
    TestValidator.error(name, (): unknown =>
      AutoMovieRecoveryCameraMap.copyUntiltedEstimate(wrong, width, 4, (): void => {}),
    );
}

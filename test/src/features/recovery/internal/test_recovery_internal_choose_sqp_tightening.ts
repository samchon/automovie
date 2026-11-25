import type { IAutoMovieSimplexAtom } from "@automovie/interface";
import { chooseRecoverySqpTightening } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `chooseRecoverySqpTightening` prices strict inward margin against the mixed
 * direction's descent: the value is the least of mixedNorm^2.5 and sqrt(sqpNorm)
 * times the descent over the multiplier price.
 *
 * Scenarios:
 *
 * 1. Objective -x, mixed direction (1/2), selected row 3x with multiplier 2 and
 *    sqpNorm 1/4: descent 1/2, price 6, cap (1/2 * 1/2) / 6 = 1/24, below the
 *    ceiling (1/2)^2.5, so the value is 1/24 by the objective cap.
 * 2. A zero multiplier prices nothing, so the value is the ceiling.
 * 3. An sqpNorm outside (0, 1) is refused.
 */
export function test_recovery_internal_choose_sqp_tightening(): void {
  const rows: IAutoMovieSimplexAtom[] = [
    { indices: [0], values: [-1], offset: 0 },
    { indices: [0], values: [3], offset: 1 },
  ];
  const ceiling: number = 0.5 ** 2.5;
  const capped = chooseRecoverySqpTightening(rows, [1], [2], [0.5], 0.25, 0.5);
  TestValidator.equals("the reason", capped.reason, "objective-cap");
  TestValidator.predicate(
    "the capped value",
    capped.value !== null && nclose(capped.value, 1 / 24, 1e-15),
  );
  TestValidator.predicate("the price", capped.multiplierPrice === 6);
  TestValidator.predicate(
    "the ceiling",
    capped.ceiling !== null && nclose(capped.ceiling, ceiling, 1e-15),
  );
  const free = chooseRecoverySqpTightening(rows, [1], [0], [0.5], 0.25, 0.5);
  TestValidator.equals("a free margin", free.reason, "zero-multiplier-price");
  TestValidator.predicate(
    "the ceiling is the value",
    free.value !== null && nclose(free.value, ceiling, 1e-15),
  );
  TestValidator.error("an sqpNorm of one", (): unknown =>
    chooseRecoverySqpTightening(rows, [1], [2], [0.5], 1, 0.5),
  );
}

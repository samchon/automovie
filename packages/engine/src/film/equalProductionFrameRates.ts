import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Whether two production frame rates are the same rate, compared by their
 * reduced integer identity, so `30`, `30/1` and `60/2` are equal while `30`
 * and `30000/1001` are not.
 *
 * Throws, through {@link canonicalProductionFrameRate}, when either rate is not
 * a positive safe integer or a pair of positive safe-integer terms.
 *
 * @evidence contracts/common.md#principled-implementation Reduced fractions are unique, so equality of reduced numerators and denominators is equality of the rational rates, with no floating-point division or tolerance.
 * @evidence contracts/common.md#clear-and-simple-design A predicate over the shared canonicalizer, read by the render planners, the delivery profile check and production validation, so every rate comparison follows one identity rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No near-equal rates are treated as equal; 29.97 against 30000/1001 is refused by the canonicalizer rather than approximated.
 * @evidence contracts/common.md#meaningful-documentation States what equality means with equal and unequal examples and the throwing case it inherits.
 * @evidence contracts/performance.md#efficient-algorithms Two canonicalizations, each logarithmic in its smaller term, and two integer comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure comparison of two values that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the two reduced records are dropped on return.
 */
export function equalProductionFrameRates (
  left: number | IAutoMovieProductionFrameRate,
  right: number | IAutoMovieProductionFrameRate,
): boolean {
  const canonicalLeft: IAutoMovieProductionFrameRate =
    canonicalProductionFrameRate(left);
  const canonicalRight: IAutoMovieProductionFrameRate =
    canonicalProductionFrameRate(right);
  return (
    canonicalLeft.numerator === canonicalRight.numerator &&
    canonicalLeft.denominator === canonicalRight.denominator
  );
}

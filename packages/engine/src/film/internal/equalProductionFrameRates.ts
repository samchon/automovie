import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Whether two production frame rates are the same rate, compared by their
 * reduced integer identity, so `30`, `30/1` and `60/2` are equal while `30` and
 * `30000/1001` are not.
 *
 * Throws, through {@link canonicalProductionFrameRate}, when either rate is not
 * a positive safe integer or a pair of positive safe-integer terms.
 */
export function equalProductionFrameRates(
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

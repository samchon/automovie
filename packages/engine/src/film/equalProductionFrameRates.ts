import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/** Compare two frame rates by reduced integer identity. */
export const equalProductionFrameRates = (
  left: number | IAutoMovieProductionFrameRate,
  right: number | IAutoMovieProductionFrameRate,
): boolean => {
  const canonicalLeft = canonicalProductionFrameRate(left);
  const canonicalRight = canonicalProductionFrameRate(right);
  return (
    canonicalLeft.numerator === canonicalRight.numerator &&
    canonicalLeft.denominator === canonicalRight.denominator
  );
};

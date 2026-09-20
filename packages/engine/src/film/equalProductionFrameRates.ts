import type { IAutoMovieProductionFrameRate } from "@automovie/interface";
import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Compare two frame rates by reduced integer identity.
 *
 * @evidence requirements/delivery-and-accessibility/frame-rate-timebase-and-timecode.md#delivery-stream-synchronization Prevents approximately equal display rates from joining distinct media clocks.
 * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-timecode-sync Implements fieldwise rational clock equality at the delivery join.
 */
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

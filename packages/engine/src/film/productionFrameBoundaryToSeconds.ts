import type { IAutoMovieProductionFrameRate } from "@automovie/interface";
import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Map one nonnegative film-frame boundary to deterministic seconds.
 *
 * @evidence requirements/effects-and-simulation/clock-seek-and-determinism.md#effects-film-time-mapping Maps every film-owned effect from the builder clock rather than a tier-local output index.
 * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#effect-film-time-step-boundary Centralizes the single exact-rational frame-to-effect-clock conversion.
 */
export const productionFrameBoundaryToSeconds = (props: {
  frame: number;
  frameRate: IAutoMovieProductionFrameRate;
}): number => {
  if (Number.isSafeInteger(props.frame) === false || props.frame < 0)
    throw new Error(
      `Production frame boundary ${props.frame} must be a nonnegative safe integer.`,
    );
  const rate = canonicalProductionFrameRate(props.frameRate);
  return (props.frame * rate.denominator) / rate.numerator;
};

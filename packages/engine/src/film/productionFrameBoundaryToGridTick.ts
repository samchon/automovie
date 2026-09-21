import type { IAutoMovieProductionFrameRate } from "@automovie/interface";
import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Map one nonnegative film-frame boundary onto a destination integer clock.
 *
 * The conversion uses integer arithmetic exactly once. Nearest sends a
 * nonnegative half tick upward, and floor or ceiling remain explicit choices.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-mixed-timebases Maps every destination clock from the same exact film-frame boundary.
 * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#effect-film-time-step-boundary Implements an explicit integer division policy at the shared boundary.
 */
export const productionFrameBoundaryToGridTick = (props: {
  frame: number;
  frameRate: IAutoMovieProductionFrameRate;
  ticksPerSecond: number;
  rounding: "nearest" | "floor" | "ceiling";
}): number => {
  if (Number.isSafeInteger(props.frame) === false || props.frame < 0)
    throw new Error(
      `Production frame boundary ${props.frame} must be a nonnegative safe integer.`,
    );
  if (
    Number.isSafeInteger(props.ticksPerSecond) === false ||
    props.ticksPerSecond <= 0
  )
    throw new Error(
      `Destination clock ${props.ticksPerSecond} must be a positive safe integer.`,
    );
  const rate = canonicalProductionFrameRate(props.frameRate);
  const numerator =
    BigInt(props.frame) *
    BigInt(rate.denominator) *
    BigInt(props.ticksPerSecond);
  const denominator = BigInt(rate.numerator);
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  const tick =
    props.rounding === "floor"
      ? quotient
      : props.rounding === "ceiling"
        ? quotient + (remainder === 0n ? 0n : 1n)
        : quotient + (remainder * 2n >= denominator ? 1n : 0n);
  if (tick > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error(
      `Production frame boundary ${props.frame} exceeds the safe ${props.ticksPerSecond}-tick destination clock.`,
    );
  return Number(tick);
};

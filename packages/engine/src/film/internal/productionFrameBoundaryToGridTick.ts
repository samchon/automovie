import type {
  IAutoMovieProductionFrameBoundaryToGridTick,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";
import { roundProductionGridTick } from "../roundProductionGridTick";

/**
 * Map one non-negative film-frame boundary onto a destination integer clock,
 * such as audio samples or WebVTT milliseconds.
 *
 * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds, so its tick
 * on a `ticksPerSecond` clock is `f·d·ticksPerSecond / n`, rounded once.
 * `nearest` sends an exact half tick upward, and `floor` and `ceiling` are the
 * caller's explicit choices. A frame that is not a non-negative safe integer, a
 * clock rate that is not a positive safe integer, an invalid frame rate, and a
 * tick beyond `Number.MAX_SAFE_INTEGER` each throw an `Error`.
 *
 * @param props.frame Film-frame boundary index, a non-negative safe integer.
 * @param props.frameRate The film's frame rate as an exact ratio.
 * @param props.ticksPerSecond Destination clock rate, a positive safe integer.
 * @param props.rounding How a boundary between two ticks is resolved.
 * @returns The boundary's tick on the destination clock.
 */
export function productionFrameBoundaryToGridTick(
  props: IAutoMovieProductionFrameBoundaryToGridTick.IProps,
): number {
  if (props.frame < 0)
    throw new Error(
      `Production frame boundary ${props.frame} must be a nonnegative safe integer.`,
    );
  if (props.ticksPerSecond <= 0)
    throw new Error(
      `Destination clock ${props.ticksPerSecond} must be a positive safe integer.`,
    );
  const rate: IAutoMovieProductionFrameRate = canonicalProductionFrameRate(
    props.frameRate,
  );
  const numerator: bigint =
    BigInt(props.frame) *
    BigInt(rate.denominator) *
    BigInt(props.ticksPerSecond);
  const denominator: bigint = BigInt(rate.numerator);
  const tick: bigint =
    props.rounding === "floor"
      ? numerator / denominator
      : props.rounding === "ceiling"
        ? (numerator + denominator - 1n) / denominator
        : roundProductionGridTick(numerator, denominator);
  if (tick > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error(
      `Production frame boundary ${props.frame} exceeds the safe ${props.ticksPerSecond}-tick destination clock.`,
    );
  return Number(tick);
}

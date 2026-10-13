import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

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
 *
 * @evidence contracts/common.md#principled-implementation Exact rational arithmetic in `BigInt`: the numerator `f·d·ticksPerSecond` is formed without rounding, one integer division and remainder decide the tick, and the remainder alone picks the rounding, so the answer is exact for every input whose result is a safe integer and identical on every machine.
 * @evidence contracts/common.md#clear-and-simple-design One boundary map shared by production sound rendering, delivery validation and the interval form behind WebVTT captions, so audio, captions and validation place a frame boundary on the same tick.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clock or frame rate is special-cased and no float product is used; out-of-range inputs and results throw instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation States the formula, what each rounding mode does with a half tick, each thrown condition, and each parameter's unit and domain.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: a few `BigInt` multiplications on values bounded by the safe-integer range, plus the frame-rate reduction's Euclidean algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One boundary per call with no shared state; the interval form calls it twice per interval because each end is a separate boundary.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates a few `BigInt` temporaries and retains nothing.
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
  const rate: IAutoMovieProductionFrameRate = canonicalProductionFrameRate(
    props.frameRate,
  );
  const numerator: bigint =
    BigInt(props.frame) *
    BigInt(rate.denominator) *
    BigInt(props.ticksPerSecond);
  const denominator: bigint = BigInt(rate.numerator);
  const quotient: bigint = numerator / denominator;
  const remainder: bigint = numerator % denominator;
  const tick: bigint =
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

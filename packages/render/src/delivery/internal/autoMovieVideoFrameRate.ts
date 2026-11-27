import type { IAutoMoviePlanVideoEncodingResult } from "@automovie/interface";

/*
 * Select the rational presentation rate FFmpeg uses for a numeric frame rate:
 * the exact clock a drawn video is encoded on and its sound is placed on.
 *
 * The decimal spelling passed by legacy callers round-trips to that same
 * binary64 value. FFmpeg first scales it to a power-of-two denominator, then
 * uses bounded continued fractions. Preserve its finite positive fallback when
 * an exceptionally low or high rate would otherwise give zero or infinity.
 * Parameter fps: The commissioned frame rate, frames per second.
 * Returns: The rate's numerator and denominator.
 * When the rate exceeds FFmpeg's range or has no positive
 * representation.
 */
export function autoMovieVideoFrameRate(
  fps: number,
): IAutoMoviePlanVideoEncodingResult["frameRate"] {
  if (fps > Number(MAXIMUM_AVRATIONAL_TERM) + 3)
    throw new Error("A video's frame rate exceeds FFmpeg's range");
  const exponent: number = Math.max(0, Math.floor(Math.log2(fps)));
  const scale: number = 2 ** (61 - exponent);
  const numerator: bigint = BigInt(Math.floor(fps * scale + 0.5));
  const denominator: bigint = BigInt(scale);
  let rate: IAutoMoviePlanVideoEncodingResult["frameRate"] = boundedRate(
    numerator,
    denominator,
    MAXIMUM_VIDEO_RATE_TERM,
  );
  if (rate[0] === 0 || rate[1] === 0)
    rate = boundedRate(numerator, denominator, MAXIMUM_AVRATIONAL_TERM);
  if (rate[0] === 0 || rate[1] === 0)
    throw new Error(
      "A video's frame rate has no positive FFmpeg representation",
    );
  return rate;
}

/*
 * The term bound FFmpeg's `av_parse_video_rate` passes to its rational
 * approximation: the largest numerator or denominator a parsed rate keeps.
 */
const MAXIMUM_VIDEO_RATE_TERM: bigint = 1_001_000n;

/*
 * The largest AVRational term, `INT_MAX`, with which FFmpeg's `av_d2q` retries
 * when the first bound reduces a rate's numerator or denominator to zero.
 */
const MAXIMUM_AVRATIONAL_TERM: bigint = 2_147_483_647n;

/*
 * Finds the nearest rational under simultaneous numerator and denominator
 * bounds.
 */
function boundedRate(
  numerator: bigint,
  denominator: bigint,
  limit: bigint,
): IAutoMoviePlanVideoEncodingResult["frameRate"] {
  let previousNumerator: bigint = 0n;
  let previousDenominator: bigint = 1n;
  let currentNumerator: bigint = 1n;
  let currentDenominator: bigint = 0n;
  while (denominator !== 0n) {
    const quotient: bigint = numerator / denominator;
    const nextNumerator: bigint =
      quotient * currentNumerator + previousNumerator;
    const nextDenominator: bigint =
      quotient * currentDenominator + previousDenominator;
    if (nextNumerator > limit || nextDenominator > limit) {
      let size: bigint =
        currentNumerator === 0n
          ? quotient
          : (limit - previousNumerator) / currentNumerator;
      if (currentDenominator !== 0n) {
        const sizeByDenominator: bigint =
          (limit - previousDenominator) / currentDenominator;
        if (sizeByDenominator < size) size = sizeByDenominator;
      }
      if (
        denominator * (2n * size * currentDenominator + previousDenominator) >
        numerator * currentDenominator
      ) {
        currentNumerator = size * currentNumerator + previousNumerator;
        currentDenominator = size * currentDenominator + previousDenominator;
      }
      break;
    }
    previousNumerator = currentNumerator;
    previousDenominator = currentDenominator;
    currentNumerator = nextNumerator;
    currentDenominator = nextDenominator;
    [numerator, denominator] = [denominator, numerator % denominator];
  }
  return [Number(currentNumerator), Number(currentDenominator)];
}

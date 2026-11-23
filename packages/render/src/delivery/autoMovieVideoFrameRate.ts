import type { IAutoMoviePlanVideoEncodingResult } from "@automovie/interface";

/** Bounds used by FFmpeg's video-rate parser and its AVRational fallback. */
const MAXIMUM_VIDEO_RATE_TERM = 1_001_000n;
const MAXIMUM_AVRATIONAL_TERM = 2_147_483_647n;

/**
 * Select the rational presentation rate FFmpeg uses for a numeric frame rate:
 * the exact clock a drawn video is encoded on and its sound is placed on.
 *
 * The decimal spelling passed by legacy callers round-trips to that same
 * binary64 value. FFmpeg first scales it to a power-of-two denominator, then
 * uses bounded continued fractions. Preserve its finite positive fallback when
 * an exceptionally low or high rate would otherwise give zero or infinity.
 *
 * @param fps The commissioned frame rate, frames per second.
 * @returns The rate's numerator and denominator.
 * @throws {Error} When the rate exceeds FFmpeg's range or has no positive
 *   representation.
 */
export function autoMovieVideoFrameRate(
  fps: number,
): IAutoMoviePlanVideoEncodingResult["frameRate"] {
  if (fps > Number(MAXIMUM_AVRATIONAL_TERM) + 3)
    throw new Error("A video's frame rate exceeds FFmpeg's range");
  const exponent = Math.max(0, Math.floor(Math.log2(fps)));
  const scale = 2 ** (61 - exponent);
  const numerator = BigInt(Math.floor(fps * scale + 0.5));
  const denominator = BigInt(scale);
  let rate = boundedRate(numerator, denominator, MAXIMUM_VIDEO_RATE_TERM);
  if (rate[0] === 0 || rate[1] === 0)
    rate = boundedRate(numerator, denominator, MAXIMUM_AVRATIONAL_TERM);
  if (rate[0] === 0 || rate[1] === 0)
    throw new Error(
      "A video's frame rate has no positive FFmpeg representation",
    );
  return rate;
}

/**
 * Finds the nearest rational under simultaneous numerator and denominator
 * bounds.
 */
function boundedRate(
  numerator: bigint,
  denominator: bigint,
  limit: bigint,
): IAutoMoviePlanVideoEncodingResult["frameRate"] {
  let previousNumerator = 0n;
  let previousDenominator = 1n;
  let currentNumerator = 1n;
  let currentDenominator = 0n;
  while (denominator !== 0n) {
    const quotient = numerator / denominator;
    const nextNumerator = quotient * currentNumerator + previousNumerator;
    const nextDenominator = quotient * currentDenominator + previousDenominator;
    if (nextNumerator > limit || nextDenominator > limit) {
      let size =
        currentNumerator === 0n
          ? quotient
          : (limit - previousNumerator) / currentNumerator;
      if (currentDenominator !== 0n) {
        const sizeByDenominator =
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

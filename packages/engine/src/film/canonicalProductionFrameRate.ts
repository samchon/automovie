import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

/**
 * Reduce one positive production frame rate to its exact integer identity.
 *
 * Integer legacy rates remain lossless `n/1` inputs. Fractional rates require
 * an explicit numerator and denominator because a decimal display value does
 * not identify the rate that produced it.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Preserves the authored frame clock as a reduced rational identity instead of a binary-float approximation.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Implements the canonical rational timeline used by every destination clock.
 */
export const canonicalProductionFrameRate = (
  input: number | IAutoMovieProductionFrameRate,
): IAutoMovieProductionFrameRate => {
  if (typeof input === "number") {
    if (Number.isSafeInteger(input) === false || input <= 0)
      throw new Error(
        `A scalar production frame rate must be a positive safe integer, but was ${input}. Supply an exact numerator and denominator for a fractional rate.`,
      );
    return { numerator: input, denominator: 1 };
  }
  if (
    Number.isSafeInteger(input.numerator) === false ||
    input.numerator <= 0 ||
    Number.isSafeInteger(input.denominator) === false ||
    input.denominator <= 0
  )
    throw new Error(
      `Production frame rate ${input.numerator}/${input.denominator} must use positive safe-integer terms.`,
    );
  const divisor = greatestCommonDivisor(input.numerator, input.denominator);
  return {
    numerator: input.numerator / divisor,
    denominator: input.denominator / divisor,
  };
};

const greatestCommonDivisor = (left: number, right: number): number => {
  let a = left;
  let b = right;
  while (b !== 0) [a, b] = [b, a % b];
  return a;
};

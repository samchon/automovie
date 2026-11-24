import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

/**
 * Reduce one positive production frame rate, in frames per second, to its exact
 * integer identity: a numerator and denominator with no common factor.
 *
 * A scalar is accepted only as a positive safe integer and read as `n/1`. A
 * fractional rate must be stated as a numerator and denominator, because a
 * decimal such as 29.97 does not identify the rate that produced it
 * (30000/1001). Throws when a scalar is not a positive safe integer or a term
 * is not a positive safe integer; the message names the rejected value.
 */
export function canonicalProductionFrameRate(
  input: number | IAutoMovieProductionFrameRate,
): IAutoMovieProductionFrameRate {
  if (typeof input === "number") {
    if (input <= 0)
      throw new Error(
        `A scalar production frame rate must be a positive safe integer, but was ${input}. Supply an exact numerator and denominator for a fractional rate.`,
      );
    return { numerator: input, denominator: 1 };
  }
  if (input.numerator <= 0 || input.denominator <= 0)
    throw new Error(
      `Production frame rate ${input.numerator}/${input.denominator} must use positive safe-integer terms.`,
    );
  const divisor: number = greatestCommonDivisor(
    input.numerator,
    input.denominator,
  );
  return {
    numerator: input.numerator / divisor,
    denominator: input.denominator / divisor,
  };
}

/** Euclid's greatest common divisor of two positive integers. */
function greatestCommonDivisor(left: number, right: number): number {
  let a: number = left;
  let b: number = right;
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

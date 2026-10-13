import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

/**
 * Reduce one positive production frame rate, in frames per second, to its
 * exact integer identity: a numerator and denominator with no common factor.
 *
 * A scalar is accepted only as a positive safe integer and read as `n/1`.
 * A fractional rate must be stated as a numerator and denominator, because a
 * decimal such as 29.97 does not identify the rate that produced it
 * (30000/1001). Throws when a scalar is not a positive safe integer or a term
 * is not a positive safe integer; the message names the rejected value.
 *
 * @evidence contracts/common.md#principled-implementation Divides both terms by their greatest common divisor from Euclid's algorithm, which yields the unique reduced fraction; safe-integer terms keep every remainder and quotient exact in IEEE doubles.
 * @evidence contracts/common.md#clear-and-simple-design The single canonicalizer every frame-rate comparison and boundary conversion reads, including `equalProductionFrameRates`, the frame-boundary converters and the render tier planner, so reduced identity has one definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recognizes no named rate such as NTSC; a decimal scalar is refused instead of guessed into a fraction.
 * @evidence contracts/common.md#meaningful-documentation States the unit, the two accepted input forms, why fractions need explicit terms with the NTSC example, the reduced output, and both throwing cases.
 * @evidence contracts/performance.md#efficient-algorithms Logarithmic in the smaller term, the step count of Euclid's algorithm, with constant space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure reduction of one value that coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned two-term record.
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
  const divisor: number = greatestCommonDivisor(
    input.numerator,
    input.denominator,
  );
  return {
    numerator: input.numerator / divisor,
    denominator: input.denominator / divisor,
  };
};

/** Euclid's greatest common divisor of two positive integers. */
const greatestCommonDivisor = (left: number, right: number): number => {
  let a: number = left;
  let b: number = right;
  while (b !== 0) [a, b] = [b, a % b];
  return a;
};

/**
 * Exact rational production frame rate in frames per second; canonical consumers reduce the fraction by its greatest common divisor.
 *
 * @evidence contracts/development/design.md#principled-representation Positive safe-integer numerator and denominator identify the exact rational clock; canonicalProductionFrameRate uses Euclid reduction so equivalent fractions share identity without guessing a rate from a decimal scalar.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two integer terms preserve fractional rate identity independently from the convenient numeric fps projection used by frame sampling.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No named-rate lookup or tolerance converts 29.97 into 30000/1001; fractional clocks require explicit terms and scalar fps must match their quotient.
 * @evidence contracts/development/common.md#meaningful-documentation Defines frames-per-second units, positive safe-integer terms and canonical reduction semantics.
 */
export interface IAutoMovieProductionFrameRate {
  /** Positive safe-integer frame-rate numerator. */
  numerator: number;

  /** Positive safe-integer frame-rate denominator. */
  denominator: number;
}

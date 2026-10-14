/**
 * Exact rational production frame rate in frames per second; canonical consumers reduce the fraction by its greatest common divisor.
 *
 * @evidence contracts/common.md#principled-implementation Positive safe-integer numerator and denominator identify the exact rational clock; canonicalProductionFrameRate uses Euclid reduction so equivalent fractions share identity without guessing a rate from a decimal scalar.
 * @evidence contracts/common.md#clear-and-simple-design Two integer terms preserve fractional rate identity independently from the convenient numeric fps projection used by frame sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No named-rate lookup or tolerance converts 29.97 into 30000/1001; fractional clocks require explicit terms and scalar fps must match their quotient.
 * @evidence contracts/common.md#meaningful-documentation Defines frames-per-second units, positive safe-integer terms and canonical reduction semantics.
 * @author Samchon
 */
export interface IAutoMovieProductionFrameRate {
  /** Positive safe-integer frame-rate numerator. */
  numerator: number;

  /** Positive safe-integer frame-rate denominator. */
  denominator: number;
}

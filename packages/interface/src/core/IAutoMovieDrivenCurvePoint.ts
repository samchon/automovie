/**
 * One control point in a driven-key curve: when the source channel reads
 * `source`, the driven driver writes `output`. Both coordinates must be finite.
 *
 * @evidence contracts/common.md#principled-implementation An exact sample of the piecewise-linear mapping; `evaluateDrivenCurve` interpolates between neighbouring points, so each point fixes the function's value at its own source.
 * @evidence contracts/common.md#clear-and-simple-design Two named numbers instead of a tuple, so authored JSON says which coordinate is the input and which is the output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no per-point flags or tangents, and a non-finite coordinate throws with its point index rather than being clamped or skipped.
 * @evidence contracts/common.md#meaningful-documentation Documents what each coordinate means, the finiteness rule, and the strict ordering against the previous point.
 * @author Samchon
 */
export interface IAutoMovieDrivenCurvePoint {
  /**
   * Source channel value at which `output` applies; strictly greater than the
   * previous point's.
   */
  source: number;

  /** Output scalar written by the driven driver at that source value. */
  output: number;
}

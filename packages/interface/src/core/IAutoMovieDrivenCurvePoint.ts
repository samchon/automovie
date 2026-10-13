/**
 * One control point in a driven-key curve: when the source channel reads
 * `source`, the driven driver writes `output`. Both coordinates must be finite.
 *
 * @evidence contracts/common.md#principled-implementation `evaluateDrivenCurve` checks each point is an object with finite `source` and `output` and that sources strictly increase, then uses adjacent points as the ends of one linear segment.
 * @evidence contracts/common.md#clear-and-simple-design A named pair instead of a two-element tuple, so an author cannot swap input and output by position.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A point equal to or below its predecessor's source throws rather than being reordered or merged with it.
 * @evidence contracts/common.md#meaningful-documentation States the mapping each point expresses, the finiteness rule, and the strict ordering against the previous point.
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

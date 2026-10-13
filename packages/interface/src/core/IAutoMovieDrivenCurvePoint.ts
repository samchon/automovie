/**
 * One control point in a driven-key curve: when the source channel reads
 * `source`, the driven driver writes `output`. Both coordinates must be finite.
 *
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

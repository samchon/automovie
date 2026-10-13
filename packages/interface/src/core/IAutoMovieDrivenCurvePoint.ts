/**
 * One control point in a driven-key curve.
 *
 * @author Samchon
 */
export interface IAutoMovieDrivenCurvePoint {
  /** Source channel value. */
  source: number;

  /** Output scalar written by the driven driver. */
  output: number;
}

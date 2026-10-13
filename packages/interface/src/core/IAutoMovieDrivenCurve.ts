import { IAutoMovieDrivenCurvePoint } from "./IAutoMovieDrivenCurvePoint";

/**
 * A nonlinear driven-key map from source scalar to output scalar.
 *
 * Points are sorted by `source`. The engine interpolates linearly between
 * adjacent points and holds the first/last output outside the authored range.
 * `evaluateDrivenCurve` throws unless there is at least one point, every
 * coordinate is finite, and `source` strictly increases. When the driver's
 * source channel was not sampled this frame, the curve answers its first
 * point's output.
 *
 * @author Samchon
 */
export interface IAutoMovieDrivenCurve {
  /** Control points ordered by strictly increasing source value. */
  points: IAutoMovieDrivenCurvePoint[];
}

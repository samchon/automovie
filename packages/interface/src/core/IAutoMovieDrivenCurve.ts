import type { IAutoMovieDrivenCurvePoint } from "./IAutoMovieDrivenCurvePoint";

/**
 * A nonlinear driven-key map from source scalar to output scalar.
 *
 * Points are sorted by `source`. The engine interpolates linearly between
 * adjacent points and holds the first or last output outside the authored
 * range. `evaluateDrivenCurve` throws unless there is at least one point, every
 * coordinate is finite, and `source` strictly increases. When the driver's
 * source channel was not sampled this frame, the curve answers its first
 * point's output.
 */
export interface IAutoMovieDrivenCurve {
  /** At least one control point, ordered by strictly increasing source. */
  points: IAutoMovieDrivenCurvePoint[];
}

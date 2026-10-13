import { IAutoMovieDrivenCurvePoint } from "./IAutoMovieDrivenCurvePoint";

/**
 * A nonlinear driven-key map from source scalar to output scalar.
 *
 * Points are sorted by `source`. The engine interpolates linearly between
 * adjacent points and holds the first/last output outside the authored range.
 *
 * @author Samchon
 */
export interface IAutoMovieDrivenCurve {
  /** Control points ordered by increasing source value. */
  points: IAutoMovieDrivenCurvePoint[];
}

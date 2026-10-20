import { IAutoMovieDrivenCurvePoint } from "./IAutoMovieDrivenCurvePoint";

/**
 * A nonlinear driven-key map from source scalar to output scalar.
 *
 * Points are sorted by `source`. The engine interpolates linearly between
 * adjacent points and holds the first or last output outside the authored
 * range. `evaluateDrivenCurve` throws unless there is at least one point, every
 * coordinate is finite, and `source` strictly increases. When the driver's
 * source channel was not sampled this frame, the curve answers its first
 * point's output.
 *
 * @evidence contracts/common.md#principled-implementation `evaluateDrivenCurve` validates the points, returns the first output at or below the first source, scans for the first point whose source reaches the query and lerps from its predecessor, and returns the last output past the end, a piecewise-linear map with constant extension.
 * @evidence contracts/common.md#clear-and-simple-design The curve is one ordered point list wrapped in an object, so a driven driver chooses between the linear remap and the curve by the presence of one field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsorted, duplicate or non-finite points throw rather than being sorted or dropped, and an unsampled source reads the curve's own first point instead of borrowing the linear driver's `inRange`.
 * @evidence contracts/common.md#meaningful-documentation States the interpolation, the behaviour outside the authored range, every validation the evaluator throws on, and the answer for an unsampled source.
 */
export interface IAutoMovieDrivenCurve {
  /** At least one control point, ordered by strictly increasing source. */
  points: IAutoMovieDrivenCurvePoint[];
}

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
 * @evidence contracts/common.md#principled-implementation Piecewise-linear interpolation with constant extrapolation: `evaluateDrivenCurve` finds the first point whose source is at least the input and interpolates from its predecessor, which is sound because it validates the strictly increasing order first.
 * @evidence contracts/common.md#clear-and-simple-design A single `points` array is the whole curve; there is no tangent or easing field because the evaluator implements only linear segments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal or decreasing source values throw instead of being sorted or deduplicated, and the unsampled-source case uses the first point by a documented rule rather than a magic default.
 * @evidence contracts/common.md#meaningful-documentation States the ordering, finiteness and non-empty requirements, the interpolation and hold rules, and the unsampled-source answer.
 * @author Samchon
 */
export interface IAutoMovieDrivenCurve {
  /** Control points ordered by strictly increasing source value. */
  points: IAutoMovieDrivenCurvePoint[];
}

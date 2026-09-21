import { IAutoMovieDrivenCurvePoint } from "./IAutoMovieDrivenCurvePoint";

/**
 * A nonlinear driven-key map from source scalar to output scalar.
 *
 * Points are sorted by `source`. The engine interpolates linearly between
 * adjacent points and holds the first/last output outside the authored range.
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieDrivenCurve` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieDrivenCurve` for the performance motion clip keytime interpolation system contract.
 * @author Samchon
 */
export interface IAutoMovieDrivenCurve {
  /**
   * Control points ordered by increasing source value.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `points` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `points` for the performance motion clip keytime interpolation system contract.
   */
  points: IAutoMovieDrivenCurvePoint[];
}

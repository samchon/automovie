import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";
import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * Named closed transverse cubic section and complete derivative controls per
 * longitudinal millimetre.
 *
 * Full derivative controls retain the section's chart and physical denominator.
 * The world longitudinal direction is authored independently of these
 * controls.
 */
export interface IAutoMovieCurveBoundary64 {
  /**
   * Stable nonblank identity, equal to the section's name and to its declared
   * context edge.
   */
  id: string;

  /**
   * Closed cubic transverse chart in its owner frame, with phase widths summing
   * to one turn.
   */
  section: IAutoMovieCubicBezierCurve64;

  /**
   * One finite XYZ cubic first-variation coefficient field per section span,
   * per longitudinal millimetre.
   */
  fullJ: readonly AutoMovieCubicBezierControls3[];

  /** Fixed millimetre denominator for the stored longitudinal first variation. */
  longitudinalUnit: "mm";

  /**
   * Caller-supplied world unit axis along increasing longitudinal distance.
   * Boundary admission checks all three components are finite.
   */
  longitudinalAxis: Readonly<AutoMovieVector3Tuple>;
}

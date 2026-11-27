import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";
import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * A named closed cubic transverse section over one turn and its complete
 * control-wise first variation per longitudinal millimetre. The supplied
 * longitudinal axis declares the world measurement direction.
 */
export interface IAutoMovieCurveBoundary64 {
  /**
   * Stable declared boundary or node identity, not a selector for a body
   * catalogue.
   */
  id: string;

  /**
   * Transverse section in its owning chart, consumed with its complete
   * longitudinal first variation.
   */
  section: IAutoMovieCubicBezierCurve64;

  /**
   * One finite four-control cubic derivative span per section span, not a
   * direction hint.
   */
  fullJ: readonly AutoMovieCubicBezierControls3[];

  /** Physical denominator of fullJ; this boundary uses longitudinal millimetres. */
  longitudinalUnit: "mm";

  /**
   * Caller-supplied world unit axis of longitudinal measurement; boundary
   * admission checks finite components, not unit length.
   */
  longitudinalAxis: Readonly<AutoMovieVector3Tuple>;
}

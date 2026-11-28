import type { IAutoMovieAnalyticOvalCurve64 } from "./IAutoMovieAnalyticOvalCurve64";
import type { IAutoMovieBernsteinCurve64 } from "./IAutoMovieBernsteinCurve64";
import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * Millimetre curve selected by its type tag. Cubic and Bernstein variants carry
 * ordered spans with phase widths. An analytic oval carries its centre, axes
 * and semiaxes and uses one turn. Runtime admission rejects unsupported tags.
 */
export type IAutoMovieCurvePrimitive64 =
  | IAutoMovieCubicBezierCurve64
  | IAutoMovieAnalyticOvalCurve64
  | IAutoMovieBernsteinCurve64;

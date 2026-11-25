import type { IAutoMovieAnalyticOvalCurve64 } from "./IAutoMovieAnalyticOvalCurve64";
import type { IAutoMovieBernsteinCurve64 } from "./IAutoMovieBernsteinCurve64";
import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * Closed discriminated union of the three supported position representations;
 * an unsupported tag must be rejected by runtime admission.
 */
export type IAutoMovieCurvePrimitive64 =
  | IAutoMovieCubicBezierCurve64
  | IAutoMovieAnalyticOvalCurve64
  | IAutoMovieBernsteinCurve64;

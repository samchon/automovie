import type { IAutoMovieAnalyticOvalCurve64 } from "./IAutoMovieAnalyticOvalCurve64";
import type { IAutoMovieBernsteinCurve64 } from "./IAutoMovieBernsteinCurve64";
import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * Closed discriminated union of the three supported position representations; an unsupported tag must be rejected by runtime admission.
 *
 * @evidence contracts/development/design.md#principled-representation The type tag selects cubic, analytic ellipse or general Bernstein semantics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One union is the shared input of primitive admission and evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No unknown representation is accepted through a generic coefficient fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Names exactly which representations the public evaluator consumes.
 */
export type IAutoMovieCurvePrimitive64 =
  | IAutoMovieCubicBezierCurve64
  | IAutoMovieAnalyticOvalCurve64
  | IAutoMovieBernsteinCurve64;

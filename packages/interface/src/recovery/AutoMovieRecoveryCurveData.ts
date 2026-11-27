import type { IAutoMovieCubicBezierCurve64 } from "../geometry/IAutoMovieCubicBezierCurve64";
import type {
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoveryHermiteCurve,
} from "..";

/**
 * A saved data tree with every cubic occurrence expressed in the selected
 * basis. Arrays, tuples, optional fields and unrelated metadata retain their
 * structure.
 */
export type AutoMovieRecoveryCurveData<
  T,
  Format extends AutoMovieRecoveryCurveFormat,
> = T extends IAutoMovieCubicBezierCurve64 | IAutoMovieRecoveryHermiteCurve
  ? {
      [Key in keyof Omit<T, "type" | "spans">]: AutoMovieRecoveryCurveData<
        T[Key],
        Format
      >;
    } & (Format extends "hermite"
      ? IAutoMovieRecoveryHermiteCurve
      : IAutoMovieCubicBezierCurve64)
  : T extends object
    ? { [Key in keyof T]: AutoMovieRecoveryCurveData<T[Key], Format> }
    : T;

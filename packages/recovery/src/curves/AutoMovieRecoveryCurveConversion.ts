import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryCurveBundle,
  IAutoMovieRecoveryHermiteCurve,
} from "@automovie/interface";

import {
  convertAutoMovieRecoveryCurve as convertCurveOperation,
} from "./internal/convertAutoMovieRecoveryCurve";
import {
  convertAutoMovieRecoveryCurves as convertBundleOperation,
} from "./internal/convertAutoMovieRecoveryCurves";

/** Convert saved recovery cubics between coefficient bases. */
export namespace AutoMovieRecoveryCurveConversion {
  /** Convert one saved cubic to Bernstein control coefficients. */
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: "bezier",
  ): IAutoMovieCubicBezierCurve64;
  /** Convert one saved cubic to Hermite endpoint and derivative coefficients. */
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: "hermite",
  ): IAutoMovieRecoveryHermiteCurve;
  /** Convert one saved cubic to the selected coefficient basis. */
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: AutoMovieRecoveryCurveFormat,
  ): IAutoMovieRecoveryCurveBundle.Curve;
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: AutoMovieRecoveryCurveFormat,
  ): IAutoMovieRecoveryCurveBundle.Curve {
    return convertCurveOperation(curve, format);
  }

  /**
   * Convert every declared cubic in a saved record. The returned record is an
   * independent copy, with bound surface controls reissued from curve authority.
   */
  export function convertBundle<
    T extends IAutoMovieRecoveryCurveBundle,
    Format extends AutoMovieRecoveryCurveFormat,
  >(input: T, format: Format): AutoMovieRecoveryCurveData<T, Format> {
    return convertBundleOperation(input, format);
  }
}

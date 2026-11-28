import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryCurveBundle,
  IAutoMovieRecoveryHermiteCurve,
} from "@automovie/interface";

import { convertRecoveryCurve as convertCurveOperation } from "./internal/convertRecoveryCurve";
import { convertRecoveryCurves as convertBundleOperation } from "./internal/convertRecoveryCurves";
import { rebindRecoveryCurveAuthorities as rebindRecoveryCurveAuthoritiesImplementation } from "./internal/rebindRecoveryCurveAuthorities";

/** Converts saved cubics and their coefficient publications between bases. */
export namespace AutoMovieRecoveryCurveConversion {
  /**
   * Returns a fresh Bernstein cubic with the saved physical and phase units.
   * Hermite derivatives become handles scaled by one third of the original span
   * width. Invalid or unrepresentable phases throw.
   */
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: "bezier",
  ): IAutoMovieCubicBezierCurve64;
  /**
   * Returns a fresh Hermite cubic with the saved physical and phase units.
   * Bernstein endpoint handle differences are multiplied by three and divided
   * by the original span width. Invalid or unrepresentable phases throw.
   */
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: "hermite",
  ): IAutoMovieRecoveryHermiteCurve;
  /**
   * Converts one saved cubic to the requested basis. Names, closure and phase
   * widths are preserved. The algebra uses binary64 arithmetic, so rounding can
   * affect a round trip. Invalid or unrepresentable phases throw.
   */
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
   * Copies a saved Recovery record and converts each declared cubic to the
   * requested basis.
   *
   * The conversion covers fit curves, closed loops, open report arcs and
   * override curves. Rebound surface controls use the converted saved
   * authority. The returned record owns its arrays and metadata. An invalid
   * phase or inconsistent binding throws.
   */
  export function convertBundle<
    T extends IAutoMovieRecoveryCurveBundle,
    Format extends AutoMovieRecoveryCurveFormat,
  >(input: T, format: Format): AutoMovieRecoveryCurveData<T, Format> {
    return convertBundleOperation(input, format);
  }
  /**
   * Rewrites bound surface controls in a converted publication from its saved
   * curves.
   *
   * Supply the saved original and its converted copy. Each original control
   * must match the authority for its named curve and span. Shared control IDs
   * must resolve to identical values. Converted geometry receives a fresh
   * control list. Ambiguous curve names, invalid addresses or mismatches
   * throw.
   */
  export function rebindRecoveryCurveAuthorities(
    original: IAutoMovieRecoveryCurveBundle,
    converted: IAutoMovieRecoveryCurveBundle,
  ): void {
    rebindRecoveryCurveAuthoritiesImplementation(original, converted);
  }
}

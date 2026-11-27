import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryCurveBundle,
  IAutoMovieRecoveryHermiteCurve,
} from "@automovie/interface";

import { rebindRecoveryCurveAuthorities as rebindRecoveryCurveAuthoritiesImplementation } from "./internal/rebindRecoveryCurveAuthorities";

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
  /**
   * Reissue explicitly bound surface controls from the converted curve authority.
   * The generic converter calls this after copying the record. Original bindings
   * must match exactly before a new basis can supply a control. A Hermite
   * publication owns the Bernstein coefficients obtained from its saved
   * endpoints, derivatives and original phase widths; finite round trips can
   * differ from a previous Bernstein publication. Shared control IDs must agree
   * exactly. The converted geometry receives a fresh control list, so the
   * original record never sees the write.
   *
   * A record is a publication when it carries tensor families or analytic domains
   * together with its curves: a loft and reports, or curve overrides alone (a
   * standalone extension, whose unchanged external curves stay the original
   * bundle's authority).
   *
   * @param original The record as saved.
   * @param converted Its converted copy, whose bound controls are rewritten.
   * @throws {Error} When names are not unique, a binding names no saved curve or
   *   span, a binding's cardinality differs from its curve, or an original
   *   control disagrees with its curve authority.
   */
  export function rebindRecoveryCurveAuthorities(
    original: IAutoMovieRecoveryCurveBundle,
    converted: IAutoMovieRecoveryCurveBundle,
  ): void {
    rebindRecoveryCurveAuthoritiesImplementation(original, converted);
  }

}

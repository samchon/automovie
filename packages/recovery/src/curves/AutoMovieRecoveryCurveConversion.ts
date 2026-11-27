import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryCurveBundle,
  IAutoMovieRecoveryHermiteCurve,
} from "@automovie/interface";

import { rebindRecoveryCurveAuthorities as rebindRecoveryCurveAuthoritiesImplementation } from "./internal/rebindRecoveryCurveAuthorities";

import {
  convertRecoveryCurve as convertCurveOperation,
} from "./internal/convertRecoveryCurve";
import {
  convertRecoveryCurves as convertBundleOperation,
} from "./internal/convertRecoveryCurves";

/** Convert saved recovery cubics between coefficient bases. */
export namespace AutoMovieRecoveryCurveConversion {
  /**
   * Express one saved cubic in the selected coefficient basis. Endpoint
   * derivatives are 3(B1-B0)/h and 3(B3-B2)/h; the inverse handles multiply by
   * h/3, with h the span's original phase width. This is an algebraic basis
   * change in real arithmetic with binary64 rounding, not a fit or a bitwise
   * round trip. Names, closure, units and phase widths are kept, and the spans of
   * the requested basis are fresh records.
   *
   * @param curve The saved cubic, in either basis.
   * @param format The basis to express it in.
   * @returns The curve in that basis.
   * @throws {Error} When the cubic has no span or not one positive phase width
   *   per span.
   */
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: "bezier",
  ): IAutoMovieCubicBezierCurve64;
  /**
   * Express one saved cubic in the selected coefficient basis. Endpoint
   * derivatives are 3(B1-B0)/h and 3(B3-B2)/h; the inverse handles multiply by
   * h/3, with h the span's original phase width. This is an algebraic basis
   * change in real arithmetic with binary64 rounding, not a fit or a bitwise
   * round trip. Names, closure, units and phase widths are kept, and the spans of
   * the requested basis are fresh records.
   *
   * @param curve The saved cubic, in either basis.
   * @param format The basis to express it in.
   * @returns The curve in that basis.
   * @throws {Error} When the cubic has no span or not one positive phase width
   *   per span.
   */
  export function convertCurve(
    curve: IAutoMovieRecoveryCurveBundle.Curve,
    format: "hermite",
  ): IAutoMovieRecoveryHermiteCurve;
  /**
   * Express one saved cubic in the selected coefficient basis. Endpoint
   * derivatives are 3(B1-B0)/h and 3(B3-B2)/h; the inverse handles multiply by
   * h/3, with h the span's original phase width. This is an algebraic basis
   * change in real arithmetic with binary64 rounding, not a fit or a bitwise
   * round trip. Names, closure, units and phase widths are kept, and the spans of
   * the requested basis are fresh records.
   *
   * @param curve The saved cubic, in either basis.
   * @param format The basis to express it in.
   * @returns The curve in that basis.
   * @throws {Error} When the cubic has no span or not one positive phase width
   *   per span.
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
   * Copy a saved recovery record into the selected cubic coefficient basis. Every
   * cubic at the record's declared curve places is converted by
   * `convertRecoveryCurve`: a fit's or override's curve, each closed
   * loop of its loft or sections, each open arc of its reports, and each curve
   * override. Original phase widths, directions, names and metadata survive
   * unchanged, and the returned record is a copy that shares nothing with the
   * input. Surface nets keep their own representation; their controls bound to a
   * converted curve are reissued from it (`rebindRecoveryCurveAuthorities`).
   *
   * @param input The saved record.
   * @param format The basis to express its cubics in.
   * @returns The record with every cubic in that basis.
   * @throws {Error} When a cubic lacks one positive phase width per span, or a
   *   bound surface control disagrees with its curve authority.
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

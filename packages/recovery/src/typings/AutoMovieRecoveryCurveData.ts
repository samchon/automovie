import type { IAutoMovieCurve64 } from "@automovie/engine";

import type { IAutoMovieRecoveryHermiteCurve } from "../structures/curve/IAutoMovieRecoveryHermiteCurve";
import type { AutoMovieRecoveryCurveFormat } from "./AutoMovieRecoveryCurveFormat";

/**
 * A saved data tree with every cubic occurrence expressed in the selected basis.
 * Arrays, tuples, optional fields and unrelated metadata retain their structure.
 *
 * @evidence contracts/development/design.md#principled-representation A structural map substitutes only complete cubic curve records, leaving polynomial degree and unrelated data unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One recursive type covers sections, open arcs, guides and coefficient publications without a parallel artifact schema.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Higher-degree and rational curves are not typed as cubic Hermite.
 * @evidence contracts/development/common.md#meaningful-documentation States structure preservation and the scope of basis substitution.
 */
export type AutoMovieRecoveryCurveData<
  T,
  Format extends AutoMovieRecoveryCurveFormat,
> = T extends IAutoMovieCurve64.Cubic | IAutoMovieRecoveryHermiteCurve
  ? {
      [Key in keyof Omit<T, "type" | "spans">]: AutoMovieRecoveryCurveData<
        T[Key],
        Format
      >;
    } & (Format extends "hermite"
      ? IAutoMovieRecoveryHermiteCurve
      : IAutoMovieCurve64.Cubic)
  : T extends object
    ? { [Key in keyof T]: AutoMovieRecoveryCurveData<T[Key], Format> }
    : T;

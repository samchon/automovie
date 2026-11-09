import type { IAutoMovieCurve64 } from "@automovie/engine";

import type { IAutoMovieRecoveryCurveFit } from "../curve/IAutoMovieRecoveryCurveFit";

/**
 * Fitted closed-loop diagnostics, open arcs and isolated contacts at one physical section.
 *
 * @evidence contracts/development/design.md#principled-representation Each report retains its slicing coordinate and separates closed-loop diagnostics from open fitted arcs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Closed-loop coefficients belong to the enclosing loft; only their fit diagnostics are repeated here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Open arcs and isolated contacts remain observations rather than silently closed surface boundaries.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 */
export interface IAutoMovieRecoverySectionReport {
  /** Section coordinate along the admitted physical slicing axis, millimetres. */
  coordinateMm: number;

  /** Closed-loop fit diagnostics in the same order as the section's loft loops. */
  fits: Omit<IAutoMovieRecoveryCurveFit, "curve">[];

  /** Open fitted arcs, including their millimetre coefficients and fit diagnostics. */
  open: IAutoMovieRecoveryCurveFit[];

  /** Isolated contact positions in the admitted millimetre frame. */
  isolatedContactsMm: IAutoMovieCurve64.Vector[];

  /** Unresolved section observations and numerical failures. */
  diagnostics: string[];
}

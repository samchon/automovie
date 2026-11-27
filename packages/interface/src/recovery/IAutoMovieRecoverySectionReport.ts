import type { AutoMovieVector3Tuple, IAutoMoviePolylineFit } from "..";

/**
 * Fitted closed-loop diagnostics, open arcs and isolated contacts at one
 * physical section.
 */
export interface IAutoMovieRecoverySectionReport {
  /** Section coordinate along the admitted physical slicing axis, millimetres. */
  coordinateMm: number;

  /** Closed-loop fit diagnostics in the same order as the section's loft loops. */
  fits: Omit<IAutoMoviePolylineFit, "curve">[];

  /**
   * Open fitted arcs, including their millimetre coefficients and fit
   * diagnostics.
   */
  open: IAutoMoviePolylineFit[];

  /** Isolated contact positions in the admitted millimetre frame. */
  isolatedContactsMm: Readonly<AutoMovieVector3Tuple>[];

  /** Unresolved section observations and numerical failures. */
  diagnostics: string[];
}

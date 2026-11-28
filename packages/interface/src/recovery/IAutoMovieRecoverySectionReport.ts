import type { AutoMovieVector3Tuple, IAutoMoviePolylineFit } from "..";

/** Observed curve fit and contact evidence at one physical section station. */
export interface IAutoMovieRecoverySectionReport {
  /** Signed physical station along the registered axis, in millimetres. */
  coordinateMm: number;

  /**
   * Closed-loop fit metadata in published loop order. Cubic coefficients live
   * in the corresponding section loops.
   */
  fits: Omit<IAutoMoviePolylineFit, "curve">[];

  /**
   * Complete open-contour fit records, including their saved cubic
   * coefficients.
   */
  open: IAutoMoviePolylineFit[];

  /**
   * Registered points whose source plane contact did not support a fitted
   * curve.
   */
  isolatedContactsMm: Readonly<AutoMovieVector3Tuple>[];

  /**
   * Station findings for unrepresented contacts, failed fits and unmet fitting
   * targets.
   */
  diagnostics: string[];
}

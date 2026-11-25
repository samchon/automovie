import type { IAutoMovieRecoveryOpenContinuationInterval } from "../../index";

/**
 * Source-free open-curve incidence accompanying one original saved section
 * publication.
 */
export interface IAutoMovieRecoveryOpenContinuation {
  /**
   * Strict boundary regularity classification used independently of saved
   * station density.
   */
  criticalPolicy: "boundary-regular-path-v1";

  /** Adjacent saved-section pairs addressing reports[section].open. */
  intervals: IAutoMovieRecoveryOpenContinuationInterval[];

  /**
   * Material tangent sign relative to each saved open curve, or null when
   * unqualified.
   */
  orientations: (1 | -1 | null)[][];

  /** Nonblocking orientation warnings and unresolved observation messages. */
  diagnostics: string[];

  /**
   * Requested physical sampling spacing, millimetres; not a surface or normal
   * error bound.
   */
  resolutionMm: number;

  /** Explicit vertex budget per maximal open run. */
  maxVerticesPerRun: number;
}

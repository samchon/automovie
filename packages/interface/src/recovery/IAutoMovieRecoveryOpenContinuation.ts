import type { IAutoMovieRecoveryOpenContinuationInterval } from "..";

/**
 * Source-backed adjacency evidence and orientation for previously saved open
 * coefficients.
 */
export interface IAutoMovieRecoveryOpenContinuation {
  /**
   * Versioned physical-boundary critical-point policy used for this
   * observation.
   */
  criticalPolicy: "boundary-regular-path-v1";

  /** Ordered adjacency records for every consecutive pair of saved sections. */
  intervals: IAutoMovieRecoveryOpenContinuationInterval[];

  /**
   * Rows of saved open-arc material orientation. Each entry is signed or null
   * when unresolved.
   */
  orientations: (1 | -1 | null)[][];

  /** Source material and unresolved-group observations for the collection. */
  diagnostics: string[];

  /**
   * Physical tessellation resolution for eligible reconstructed open runs, in
   * millimetres.
   */
  resolutionMm: number;

  /** Safe upper limit on the generated vertices of one ordinary open run. */
  maxVerticesPerRun: number;
}

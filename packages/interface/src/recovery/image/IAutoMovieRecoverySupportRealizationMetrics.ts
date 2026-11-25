import type { IAutoMovieRecoverySupportGeneration } from "../../index";

/**
 * Convex-support generation counts with a face chord bound and numerical event
 * qualification.
 */
export interface IAutoMovieRecoverySupportRealizationMetrics extends IAutoMovieRecoverySupportGeneration {
  /** Numerical face chord bound, metres. */
  faceChordBoundMeters: number;

  /** Scope of the binary64 event calculation, without certification. */
  eventQualification: "binary64-numerical-not-certified";
}

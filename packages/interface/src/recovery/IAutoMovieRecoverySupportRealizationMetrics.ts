import type { IAutoMovieRecoverySupportGeneration } from "..";

/**
 * Convex-support realization metrics with the ruled-face interpolation
 * tolerance and scope of the event calculation. These extend the counts and
 * boundary defect already recorded for generation.
 */
export interface IAutoMovieRecoverySupportRealizationMetrics extends IAutoMovieRecoverySupportGeneration {
  /**
   * Requested metre bound used to plan ruled-face interpolation within the
   * numerical event partition. Event isolation, boundary roundoff and source
   * fitting have separate error scopes.
   */
  faceChordBoundMeters: number;

  /**
   * Qualification that event isolation and active-plane incidence are binary64
   * numerical computations without a certificate.
   */
  eventQualification: "binary64-numerical-not-certified";
}

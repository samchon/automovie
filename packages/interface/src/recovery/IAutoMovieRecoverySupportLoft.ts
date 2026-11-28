import type { IAutoMovieConvexSupportLoft } from "../model/IAutoMovieConvexSupportLoft";
import type { IAutoMovieRecoveryDimensionScales } from "./IAutoMovieRecoveryDimensionScales";
import type { IAutoMovieRecoverySupportLoftCoverage } from "./IAutoMovieRecoverySupportLoftCoverage";

/**
 * Open convex-support lateral recipe with fixed horizontal half-plane
 * directions and longitudinal cubic offsets. Compilation applies independent X
 * and Z scales about the frame origin and Y about the first saved station.
 */
export interface IAutoMovieRecoverySupportLoft {
  /** Select the finite-view convex-support representation for sections. */
  family: "finite-view-convex-support";

  /** Recovered object identifier used in the generated model. */
  objectId: string;

  /** Supplied metric frame in which the coefficients were fitted. */
  frame: string;

  /**
   * Fixed oriented planes and unedited longitudinal span intervals and offsets
   * in metres.
   */
  loft: IAutoMovieConvexSupportLoft;

  /**
   * Width, depth, and height factors, each in [0.25, 4]. Width and depth scale
   * about the X/Z origin, and height about the first saved Y endpoint.
   */
  dimensions: IAutoMovieRecoveryDimensionScales;

  /**
   * Required declaration of inferred convex sections and unresolved physical
   * regions.
   */
  coverage: IAutoMovieRecoverySupportLoftCoverage;
}

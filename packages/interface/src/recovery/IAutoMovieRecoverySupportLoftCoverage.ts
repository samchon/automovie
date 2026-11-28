/**
 * Coverage metadata required for finite-view convex-support generation.
 * Observed silhouettes constrain the approximation over the shared row domain,
 * while physical coverage retains its unresolved regions.
 */
export interface IAutoMovieRecoverySupportLoftCoverage {
  /** The lateral surface is inferred from a finite set of convex supports. */
  lateralSurface: "inferred-finite-view-convex-support";

  /** The generated lateral surface omits both end caps. */
  endCaps: "unobserved";

  /** Interior geometry is unobserved. */
  interior: "unobserved";

  /** The available convex supports leave hidden concavities unobserved. */
  hiddenConcavities: "unobserved";

  /** Camera calibration was supplied to observation and fitting. */
  cameras: "supplied";

  /**
   * The recipe carries no certificate that the physical object stays inside the
   * inferred hull.
   */
  enclosure: "not-certified";
}

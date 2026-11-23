/**
 * Physical coverage limits of a finite-view convex-support reconstruction. The
 * generated convex sections neither prove physical convexity nor certify
 * enclosure.
 */
export interface IAutoMovieRecoverySupportLoftCoverage {
  /** Lateral shape is inferred from finite-view convex supports. */
  lateralSurface: "inferred-finite-view-convex-support";

  /** End caps were not observed. */
  endCaps: "unobserved";

  /** Interior geometry was not observed. */
  interior: "unobserved";

  /** Hidden concavities are outside the finite convex-support hypothesis. */
  hiddenConcavities: "unobserved";

  /** Camera calibration was supplied, not recovered. */
  cameras: "supplied";

  /** Pixel and fitting uncertainty prevent a certified outer-enclosure claim. */
  enclosure: "not-certified";
}

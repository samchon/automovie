/**
 * Physical coverage limits of an aligned-ellipse image reconstruction. A
 * successful fit remains conditional inference rather than a measurement of
 * unseen skin.
 */
export interface IAutoMovieRecoveryImageLoftCoverage {
  /** Lateral shape is inferred under the aligned elliptical-section hypothesis. */
  lateralSurface: "inferred-under-aligned-ellipse-prior";

  /** End caps were not observed and are not completed by this recipe. */
  endCaps: "unobserved";

  /** Interior geometry was not observed. */
  interior: "unobserved";

  /** Camera calibration was supplied, not recovered. */
  cameras: "supplied";
}

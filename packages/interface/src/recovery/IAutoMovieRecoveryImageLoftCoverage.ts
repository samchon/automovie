/**
 * Physical coverage limits of an aligned-ellipse image reconstruction.
 * A successful fit remains conditional inference rather than a measurement of unseen skin.
 *
 * @evidence contracts/common.md#principled-implementation Literal coverage labels distinguish the inferred lateral surface from unobserved ends/interior and supplied cameras.
 * @evidence contracts/common.md#clear-and-simple-design This named record preserves the ellipse recipe's existing coverage fields independently of coefficients and edit scales.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No completed cap, measured hidden interior or recovered-camera assertion is admitted.
 * @evidence contracts/common.md#meaningful-documentation Identifies the ellipse prior, unobserved domains and supplied calibration responsibility.
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

/**
 * Physical coverage limits of a finite-view convex-support reconstruction.
 * The generated convex sections neither prove physical convexity nor certify enclosure.
 *
 * @evidence contracts/common.md#principled-implementation Explicit inference, unobserved-domain and enclosure labels retain finite-view uncertainty alongside the supplied-camera premise.
 * @evidence contracts/common.md#clear-and-simple-design One named coverage record preserves the support recipe's existing claims without coupling it to fit evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Convex approximation does not claim recovered hidden concavities, measured caps/interior or certified outer enclosure.
 * @evidence contracts/common.md#meaningful-documentation States inferred lateral coverage, unseen regions, supplied calibration and lack of enclosure certification.
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

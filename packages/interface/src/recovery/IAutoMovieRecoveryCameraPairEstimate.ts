import type {
  IAutoMovieRecoveryCameraConsensus,
  IAutoMovieRecoveryCameraFeaturePopulation,
  IAutoMovieRecoveryCameraMatch,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraRelativePose,
  IAutoMovieRecoveryCameraSource,
} from "..";

/**
 * Automatic image correspondences and conditional calibrated relative pose. A
 * successful computation may still refuse a camera. Accepted pose is in the
 * first-camera unit-baseline gauge, with unknown physical scale and no
 * recovered surface, unseen-region completion, covariance or
 * correspondence-truth claim.
 */
export interface IAutoMovieRecoveryCameraPairEstimate {
  /** Versioned automatic relative-camera observation artifact. */
  schema: "automovie-recovery-camera-pair-estimate-v1";

  /** Fixed scene identity asserted by the acquisition caller. */
  objectId: string;

  /**
   * Keeps analytic measurements, real photographs and inconsistent controls
   * separate.
   */
  cohort: IAutoMovieRecoveryCameraPairInput["cohort"];

  /**
   * Conditional camera qualification; refused evidence still records completed
   * observations.
   */
  status: "accepted-relative-pose" | "refused";

  /**
   * Every observed failed qualification, empty only for conditional camera
   * acceptance.
   */
  refusalReasons: string[];

  /**
   * Complete operating point used for this artifact, copied without mutable
   * pixel buffers.
   */
  policy: IAutoMovieRecoveryCameraPairInput["policy"];

  /**
   * Complete declared work limits; actual counters below distinguish work from
   * a limit.
   */
  budget: IAutoMovieRecoveryCameraPairInput["budget"];

  /**
   * Source identities and caller assertions; resident operation does not verify
   * original-file SHA or lens history.
   */
  sources: IAutoMovieRecoveryCameraSource[];

  /** Actual populations for each automatic image observation, in source order. */
  features: IAutoMovieRecoveryCameraFeaturePopulation[];

  /**
   * Tentative unique mutual appearance matches; epipolar support does not prove
   * material identity.
   */
  matches: IAutoMovieRecoveryCameraMatch[];

  /**
   * Null when fewer than eight tentative correspondences permit any epipolar
   * proposal.
   */
  consensus: IAutoMovieRecoveryCameraConsensus | null;

  /**
   * Present only after every qualification passes; this transform is camera
   * evidence, not saved surface geometry.
   */
  pose: IAutoMovieRecoveryCameraRelativePose | null;
}

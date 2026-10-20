import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraConsensus } from "./structures/image/IAutoMovieRecoveryCameraConsensus";
import type { IAutoMovieRecoveryCameraFeaturePopulation } from "./structures/image/IAutoMovieRecoveryCameraFeaturePopulation";
import type { IAutoMovieRecoveryCameraMatch } from "./structures/image/IAutoMovieRecoveryCameraMatch";
import type { IAutoMovieRecoveryCameraRelativePose } from "./structures/image/IAutoMovieRecoveryCameraRelativePose";
import type { IAutoMovieRecoveryCameraSource } from "./structures/image/IAutoMovieRecoveryCameraSource";

/**
 * Automatic image correspondences and conditional calibrated relative pose.
 * A successful computation may still refuse a camera. Accepted pose is in the
 * first-camera unit-baseline gauge, with unknown physical scale and no recovered
 * surface, unseen-region completion, covariance or correspondence-truth claim.
 *
 * @evidence contracts/common.md#principled-implementation Fixed source identities, actual interest-point matches, calibrated pixel residuals, four-branch depth/parallax and competing planar support distinguish measured evidence from a conditional pose. The pose is absent after any qualification refusal, and sampling targets describe only their ideal all-inlier model.
 * @evidence contracts/common.md#clear-and-simple-design One JSON-compatible observation record separates completion of computation, explicit camera refusal, retained image evidence and the accepted relative transform; RGB buffers and descriptors remain transient computation data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truth pose, reference mesh, metric depth, unobserved geometry or refused candidate transform is labelled as an accepted camera. Undefined scalar diagnostics remain null rather than invented zero error.
 * @evidence contracts/common.md#meaningful-documentation Gives source/assertion ownership, original pixel charts, unit gauge, null meanings, conditional sampling and the distinction between camera evidence and an editable surface asset.
 * @evidence contracts/performance.md#efficient-algorithms The structural result adds no fitting work; producing functions document image, descriptor, proposal and optimizer costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Source calibration, complete policy and budgets accompany the same measured evidence so consumers do not infer a different fitting identity; the type defines no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns O(matches) plain records and fixed-size matrices/counters. No RGB, descriptor pyramid, process, callback, source file handle or external reference is retained.
 */
export interface IAutoMovieRecoveryCameraPairEstimate {
  /** Versioned automatic relative-camera observation artifact. */
  schema: "automovie-recovery-camera-pair-estimate-v1";

  /** Fixed scene identity asserted by the acquisition caller. */
  objectId: string;

  /** Keeps analytic measurements, real photographs and inconsistent controls separate. */
  cohort: IAutoMovieRecoveryCameraPairInput["cohort"];

  /** Conditional camera qualification; refused evidence still records completed observations. */
  status: "accepted-relative-pose" | "refused";

  /** Every observed failed qualification, empty only for conditional camera acceptance. */
  refusalReasons: string[];

  /** Complete operating point used for this artifact, copied without mutable pixel buffers. */
  policy: IAutoMovieRecoveryCameraPairInput["policy"];

  /** Complete declared work limits; actual counters below distinguish work from a limit. */
  budget: IAutoMovieRecoveryCameraPairInput["budget"];

  /** Source identities and caller assertions; resident operation does not verify original-file SHA or lens history. */
  sources: IAutoMovieRecoveryCameraSource[];

  /** Actual populations for each automatic image observation, in source order. */
  features: IAutoMovieRecoveryCameraFeaturePopulation[];

  /** Tentative unique mutual appearance matches; epipolar support does not prove material identity. */
  matches: IAutoMovieRecoveryCameraMatch[];

  /** Null when fewer than eight tentative correspondences permit any epipolar proposal. */
  consensus: IAutoMovieRecoveryCameraConsensus | null;

  /** Present only after every qualification passes; this transform is camera evidence, not saved surface geometry. */
  pose: IAutoMovieRecoveryCameraRelativePose | null;
}

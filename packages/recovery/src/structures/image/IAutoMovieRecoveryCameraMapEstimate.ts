import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraPairEstimate } from "./IAutoMovieRecoveryCameraPairEstimate";
import type { IAutoMovieRecoveryCameraSource } from "./IAutoMovieRecoveryCameraSource";
import type { IAutoMovieRecoveryMapJointFit } from "./IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapLandmark } from "./IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "./IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryMapResection } from "./IAutoMovieRecoveryMapResection";

/**
 * Conditional three-camera map and sparse fitting evidence in one seed gauge.
 * Only seed-supported landmarks are triangulated in this version; other linked
 * tracks remain explicitly untriangulated. A completed operation is partial with
 * respect to an editable surface, metric scale and unobserved scene geometry.
 *
 * @evidence contracts/common.md#principled-implementation Qualified pair initialization, nonconflicting automatic tracks, pointwise geometry, existing-map resection and gauge-fixed joint reprojection provide separate measured stages. Only the fully qualified triad exposes the third pose; a seed-only result retains its original two-view evidence.
 * @evidence contracts/common.md#clear-and-simple-design One JSON record distinguishes computation completion, stage refusal, sparse-map acceptance and unobserved shape, with named numerical and observation records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No intermediate refused camera, metric baseline, material-truth label, covariance, invisible completion or original/intermediate mesh becomes an accepted surface.
 * @evidence contracts/common.md#meaningful-documentation Members state source ordering, seven gauge constraints, null semantics, linked-versus-triangulated populations, fixed-population refinement and three-view support limits.
 * @evidence contracts/performance.md#efficient-algorithms This record performs no fitting; producers own bounded image, matching, proposal and sparse linear work.
 * @evidence contracts/performance.md#reuse-equivalent-work Complete seed/map policies and budgets accompany source identities so consumers preserve the exact recorded operating point; no effectful result cache is defined.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns bounded plain sources, seed matches and sparse landmarks. No RGB, descriptors, callbacks, process or file handle enters the result.
 */
export interface IAutoMovieRecoveryCameraMapEstimate {
  /** Versioned three-view map evidence artifact. */
  schema: "automovie-recovery-camera-map-estimate-v1";

  /** Caller-asserted scene identity. */
  objectId: string;

  /** Distinguishes analytic, photographic and inconsistent-control populations. */
  cohort: IAutoMovieRecoveryCameraMapInput["cohort"];

  /** Independent map qualification; seed-only does not expose a final third pose. */
  status: "accepted-sparse-map" | "seed-only" | "refused";

  /** Every available failed map qualification. */
  refusalReasons: string[];

  /** Source order fixes seed views zero/one and resection view two. */
  sources: IAutoMovieRecoveryCameraSource[];

  /** Unchanged pair evidence, including the seed policy/budget and tentative pixel matches. */
  seed: IAutoMovieRecoveryCameraPairEstimate;

  /** Complete separate Euclidean reprojection and point policy. */
  policy: IAutoMovieRecoveryCameraMapInput["policy"];

  /** Complete aggregate/new numerical work ceilings. */
  budget: IAutoMovieRecoveryCameraMapInput["budget"];

  /** First-camera coordinates; one fixed first pose and one fixed seed translation norm remove seven similarity freedoms. */
  gauge: "first-camera-unit-seed-baseline";

  /** Physical length is unobserved even when all three cameras qualify. */
  metricScale: "unknown";

  /** Three source-order poses. All are null after seed refusal; only the first two are present for seed-only evidence. */
  poses: (IAutoMovieRecoveryMapPose | null)[];

  /** Seed-supported finite fitting points and their retained measurements; no source mesh or editable surface is contained here. */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Once-observed feature counts in source order. */
  featureCounts: number[];

  /** Actual oriented descriptor pairs compared over six forward/reverse matching calls. */
  descriptorComparisons: number;

  /** Bidirectional appearance index-pairs before transitive linking. */
  intersectionMatches: number;

  /** Linked (view, feature) nodes, excluding isolated features. */
  linkedObservations: number;

  /** All linked components before duplicate-view or point filtering. */
  linkedTracks: number;

  /** Components containing distinct feature indices in one image; withheld, not labelled as false material matches. */
  conflictingTracks: number;

  /** Nonconflicting tracks without a direct accepted epipolar seed pair; not triangulated in this version. */
  untriangulatedTracks: number;

  /** Seed-supported components refusing finite point, pointwise depth, acute ray angle or pixel reprojection. */
  refusedSeedPoints: number;

  /** Seed-supported pairs without a resolved finite DLT point. */
  unresolvedSeedPoints: number;

  /** Resolved seed points nonpositive in either seed image; gate counts can overlap. */
  nonpositiveSeedPoints: number;

  /** Resolved seed points below the acute viewing-ray angle requirement. */
  lowParallaxSeedPoints: number;

  /** Resolved seed points exceeding the per-observation Euclidean pixel limit. */
  reprojectionRefusedSeedPoints: number;

  /** Null before a seed-supported third-view resection can be attempted. */
  resection: IAutoMovieRecoveryMapResection | null;

  /** Null before joint refinement; a nonconverged report does not expose a final triad. */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /** Maximum final retained-observation reprojection distance in pixels; null before completed joint qualification. */
  maximumReprojectionErrorPx: number | null;

  /** Minimum final seed point's acute viewing-ray angle in degrees; null before completed joint qualification. */
  minimumPointParallaxDegrees: number | null;
}

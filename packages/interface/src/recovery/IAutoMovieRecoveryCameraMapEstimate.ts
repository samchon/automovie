import type {
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraSource,
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryMapResection,
} from "..";

/**
 * Completed three-view camera-map evidence in the first-camera unit-baseline
 * gauge. Check the inner `status` to distinguish a qualified triad, a retained
 * seed, and failed seed qualification. A completed resident operation transfers
 * this evidence with outer `partial` status.
 */
export interface IAutoMovieRecoveryCameraMapEstimate {
  /** Schema of the completed three-view camera-map evidence. */
  schema: "automovie-recovery-camera-map-estimate-v1";

  /** Caller-asserted scene identity copied from input. */
  objectId: string;

  /** Input acquisition cohort, retained alongside map measurements. */
  cohort: IAutoMovieRecoveryCameraMapInput["cohort"];

  /**
   * Internal geometric qualification. `seed-only` retains the two seed poses;
   * `refused` means the seed did not qualify.
   */
  status: "accepted-sparse-map" | "seed-only" | "refused";

  /** Failed map qualifications reached during the attempted stages. */
  refusalReasons: string[];

  /**
   * Three source records in input order, with the first two identifying the
   * seed.
   */
  sources: IAutoMovieRecoveryCameraSource[];

  /**
   * Two-view estimate and its qualification, including its original policy,
   * limits, and tentative pixel matches.
   */
  seed: IAutoMovieRecoveryCameraPairEstimate;

  /** Admitted map thresholds for point geometry and Euclidean reprojection. */
  policy: IAutoMovieRecoveryCameraMapInput["policy"];

  /** Admitted map ceilings for aggregate observation and numerical work. */
  budget: IAutoMovieRecoveryCameraMapInput["budget"];

  /**
   * Coordinates in the first camera chart, with that pose fixed and the seed
   * baseline length held at one.
   */
  gauge: "first-camera-unit-seed-baseline";

  /** Physical scale remains unknown for the complete triad as well as the seed. */
  metricScale: "unknown";

  /**
   * Three source-order poses. Refused seed evidence has three nulls; seed-only
   * evidence keeps the first two poses.
   */
  poses: (IAutoMovieRecoveryMapPose | null)[];

  /** Retained seed-supported fitting points and observations in the map gauge. */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Feature counts from the set observation, in source order. */
  featureCounts: number[];

  /**
   * Measured directed descriptor comparisons across all forward and reverse
   * pair calls.
   */
  descriptorComparisons: number;

  /** Bidirectional appearance matches before transitive track linking. */
  intersectionMatches: number;

  /** Linked view-feature nodes, excluding isolated features. */
  linkedObservations: number;

  /** Linked components before duplicate-view conflict and seed-point filtering. */
  linkedTracks: number;

  /**
   * Withheld components containing two or more distinct feature indices in the
   * same view.
   */
  conflictingTracks: number;

  /**
   * Nonconflicting tracks with no qualified seed observation pair, including
   * all of them when seed qualification fails.
   */
  untriangulatedTracks: number;

  /**
   * Seed-supported tracks rejected by at least one point geometry or
   * reprojection gate, counted once per track.
   */
  refusedSeedPoints: number;

  /**
   * Seed-supported tracks for which linear triangulation produces no resolved
   * finite point.
   */
  unresolvedSeedPoints: number;

  /**
   * Resolved seed points with nonpositive depth in either seed camera. This
   * count can overlap other resolved-point refusal counts.
   */
  nonpositiveSeedPoints: number;

  /** Resolved seed points with acute viewing-ray angle below the policy limit. */
  lowParallaxSeedPoints: number;

  /**
   * Resolved seed points exceeding the Euclidean pixel limit in either seed
   * view.
   */
  reprojectionRefusedSeedPoints: number;

  /**
   * Third-view resection report once enough eligible seed-supported target
   * observations allow an attempt.
   */
  resection: IAutoMovieRecoveryMapResection | null;

  /**
   * Joint fit report if numerical refinement returns one, including reports
   * from nonconverged fits.
   */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /**
   * Computed candidate's largest finite retained pixel reprojection distance,
   * or null before joint evaluation or after nonpositive final depth.
   */
  maximumReprojectionErrorPx: number | null;

  /**
   * Computed candidate's minimum acute seed-viewing-ray angle in degrees, or
   * null until available.
   */
  minimumPointParallaxDegrees: number | null;
}

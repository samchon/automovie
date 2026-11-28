import type {
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryCameraSource,
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneAttempt,
  IAutoMovieRecoverySceneLandmark,
  IAutoMovieRecoverySceneRegistration,
  IAutoMovieRecoverySceneWork,
} from "..";

/**
 * Completed sparse-scene evidence with the last qualified checkpoint and the
 * attempt/work records that led to it. Read `status` for component
 * qualification and `stopReason` for completeness. Coordinates use the
 * first-camera unit-seed-baseline gauge.
 */
export interface IAutoMovieRecoveryCameraSceneEstimate {
  /** Schema of the completed scene estimate. */
  schema: "automovie-recovery-camera-scene-estimate-v1";

  /** Input identity of the asserted rigid scene. */
  objectId: string;

  /** Input acquisition cohort carried into the scene evidence. */
  cohort: IAutoMovieRecoveryCameraSceneInput["cohort"];

  /**
   * Qualification of the accepted component. `seed-only` has exactly the seed
   * views. `accepted-sparse-component` has additional registered views.
   */
  status: "accepted-sparse-component" | "seed-only" | "refused";

  /** Reason the seed or incremental registration ended. */
  stopReason:
    | "all-registered"
    | "no-qualified-growth"
    | "budget-exhausted"
    | "seed-refused";

  /** Available global termination reasons for the seed or extension process. */
  refusalReasons: string[];

  /** Detached metadata for all supplied sources, in input order. */
  sources: IAutoMovieRecoveryCameraSource[];

  /**
   * Two-view qualification using direct reciprocal seed matches retained after
   * global conflict filtering.
   */
  seed: IAutoMovieRecoveryCameraPairEstimate;

  /** Admitted scene thresholds for point geometry, resection and joint fitting. */
  policy: IAutoMovieRecoveryCameraSceneInput["policy"];

  /**
   * Original admitted limits for the scene, including per-fit and cumulative
   * work.
   */
  budget: IAutoMovieRecoveryCameraSceneInput["budget"];

  /**
   * First camera fixed at identity rotation and zero translation. The seed
   * translation norm is fixed at one.
   */
  gauge: "first-camera-unit-seed-baseline";

  /** Physical length remains unknown in the unit-baseline gauge. */
  metricScale: "unknown";

  /**
   * Accepted world-to-camera poses in source order, with null for each
   * unregistered view.
   */
  poses: (IAutoMovieRecoveryMapPose | null)[];

  /** Source indices with a pose in the latest qualified checkpoint. */
  registeredViews: number[];

  /** Remaining source indices without a qualified pose. */
  unregisteredViews: number[];

  /**
   * Per-source state and necessary existing-map support at the final revision,
   * with linkage to the latest attempt.
   */
  registration: IAutoMovieRecoverySceneRegistration[];

  /**
   * Accepted growth revision. Zero is used before extension, including a
   * qualified seed with no later accepted view.
   */
  revision: number;

  /**
   * Accepted sparse points with their source measurements and strongest
   * observed supporting pair.
   */
  landmarks: IAutoMovieRecoverySceneLandmark[];

  /** Numbers of retained features in input source order. */
  featureCounts: number[];

  /** Total directed descriptor comparisons performed by the observation step. */
  descriptorComparisons: number;

  /** Count of reciprocal appearance links before transitive grouping. */
  intersectionMatches: number;

  /**
   * Number of globally linked components before conflicting tracks are
   * withheld.
   */
  linkedTracks: number;

  /**
   * Components containing distinct features from the same source view, withheld
   * from geometry.
   */
  conflictingTracks: number;

  /**
   * Nonconflicting linked tracks absent from the current checkpoint's landmark
   * set.
   */
  untriangulatedTracks: number;

  /**
   * Recorded candidate transactions, including work that did not produce an
   * accepted camera.
   */
  attempts: IAutoMovieRecoverySceneAttempt[];

  /**
   * Cumulative scene work across seed-component construction and subsequent
   * camera transactions.
   */
  work: IAutoMovieRecoverySceneWork;

  /**
   * Report from the latest accepted common-population joint fit, or null before
   * a checkpoint qualifies.
   */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /**
   * Last completed joint report retained from a refused seed checkpoint. Its
   * own population is authoritative. A later refusal can retain an already
   * converged report. The field may be absent in older artifacts, before a
   * report is retained, or after seed acceptance.
   */
  refusedSeedJoint?: IAutoMovieRecoveryMapJointFit;

  /**
   * Largest accepted retained-observation Euclidean distance in pixels, or null
   * without a checkpoint.
   */
  maximumReprojectionErrorPx: number | null;

  /**
   * Minimum across accepted points of their strongest observed acute
   * supporting-ray angle in degrees, or null without a checkpoint.
   */
  minimumPointParallaxDegrees: number | null;
}

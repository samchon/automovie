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
} from "../../index";

/**
 * Last fully qualified sparse component and its complete extension ledger. An
 * accepted component may leave images unregistered; full requested coverage is
 * stated separately. Physical scale and an editable surface remain unknown.
 */
export interface IAutoMovieRecoveryCameraSceneEstimate {
  /** Versioned variable-view sparse-scene evidence. */
  schema: "automovie-recovery-camera-scene-estimate-v1";

  /** Caller-asserted rigid scene identity. */
  objectId: string;

  /** Analytic, photographic or inconsistent-control cohort. */
  cohort: IAutoMovieRecoveryCameraSceneInput["cohort"];

  /** A qualified component is not necessarily all requested images. */
  status: "accepted-sparse-component" | "seed-only" | "refused";

  /** Explicit reason the bounded extension process ended. */
  stopReason:
    | "all-registered"
    | "no-qualified-growth"
    | "budget-exhausted"
    | "seed-refused";

  /** Global termination qualifications; candidate failures remain in attempts. */
  refusalReasons: string[];

  /** All supplied source metadata in fixed input order. */
  sources: IAutoMovieRecoveryCameraSource[];

  /** Seed estimated from only globally admitted direct seed links. */
  seed: IAutoMovieRecoveryCameraPairEstimate;

  /** Complete shared geometric thresholds. */
  policy: IAutoMovieRecoveryCameraSceneInput["policy"];

  /** Complete fit and repeated-work ceilings. */
  budget: IAutoMovieRecoveryCameraSceneInput["budget"];

  /** First pose fixed at I/0 and one seed baseline norm fixed to one. */
  gauge: "first-camera-unit-seed-baseline";

  /** No physical length anchor was observed. */
  metricScale: "unknown";

  /**
   * Final accepted source-order poses; unregistered/refused candidates are
   * null.
   */
  poses: (IAutoMovieRecoveryMapPose | null)[];

  /** Source indices retained by the last qualified checkpoint. */
  registeredViews: number[];

  /** Every remaining requested source index, including insufficient support. */
  unregisteredViews: number[];

  /**
   * Per-source coverage, current necessary support and most recent attempt
   * linkage.
   */
  registration: IAutoMovieRecoverySceneRegistration[];

  /** Accepted checkpoint revision; zero is the initially qualified seed. */
  revision: number;

  /** Qualified points with original measurements and actual supporting pairs. */
  landmarks: IAutoMovieRecoverySceneLandmark[];

  /** Source-order feature populations extracted once each. */
  featureCounts: number[];

  /** Actual directed descriptor comparisons during this operation. */
  descriptorComparisons: number;

  /** Bidirectionally intersected index links before transitive grouping. */
  intersectionMatches: number;

  /** All globally linked components, including conflicts. */
  linkedTracks: number;

  /** Global duplicate-view components withheld before seed geometry. */
  conflictingTracks: number;

  /** Nonconflicting components absent from the accepted landmark set. */
  untriangulatedTracks: number;

  /** Full candidate ledger; consumed work survives every geometry rollback. */
  attempts: IAutoMovieRecoverySceneAttempt[];

  /** Accumulated work, including initial seed-point/joint construction. */
  work: IAutoMovieRecoverySceneWork;

  /**
   * Last accepted common-population joint report, null before seed
   * qualification.
   */
  joint: IAutoMovieRecoveryMapJointFit | null;

  /**
   * Last completed fit of a refused initial checkpoint, possibly before a later
   * closure capacity/budget refusal. Its own population is authoritative and it
   * may be converged despite whole-checkpoint refusal. Absent without an
   * admitted/completed report, after seed acceptance, or in older artifacts;
   * absence does not prove that no internal fit ran. No failed pose or point
   * geometry is exposed.
   */
  refusedSeedJoint?: IAutoMovieRecoveryMapJointFit;

  /**
   * Maximum accepted retained-observation error in pixels, null without a
   * checkpoint.
   */
  maximumReprojectionErrorPx: number | null;

  /** Minimum over points of each strongest actual acute supporting angle. */
  minimumPointParallaxDegrees: number | null;
}

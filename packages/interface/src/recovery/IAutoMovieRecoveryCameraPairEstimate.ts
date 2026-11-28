import type {
  IAutoMovieRecoveryCameraConsensus,
  IAutoMovieRecoveryCameraFeaturePopulation,
  IAutoMovieRecoveryCameraMatch,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraRelativePose,
  IAutoMovieRecoveryCameraSource,
} from "..";

/**
 * Tentative correspondences and the qualification outcome for two calibrated
 * images. Use `status` to determine whether the observation supports a pose. An
 * accepted pose uses the first camera's unit-baseline gauge. Physical scale
 * remains unknown, and the correspondences remain tentative.
 */
export type IAutoMovieRecoveryCameraPairEstimate =
  | IAutoMovieRecoveryCameraPairEstimate.IAccepted
  | IAutoMovieRecoveryCameraPairEstimate.IRefused;

export namespace IAutoMovieRecoveryCameraPairEstimate {
  /** Observations retained whether or not the camera qualifies. */
  export interface IObservations {
    /** Version of the camera-pair evidence record. */
    schema: "automovie-recovery-camera-pair-estimate-v1";

    /** Fixed scene identity supplied by the caller. */
    objectId: string;

    /** Source category for the evidence, copied from the acquisition input. */
    cohort: IAutoMovieRecoveryCameraPairInput["cohort"];

    /** Qualification policy used for this observation. */
    policy: IAutoMovieRecoveryCameraPairInput["policy"];

    /**
     * Declared work limits. The feature and consensus counts report actual
     * work.
     */
    budget: IAutoMovieRecoveryCameraPairInput["budget"];

    /** Caller-supplied source identities and camera assertions. */
    sources: IAutoMovieRecoveryCameraSource[];

    /** Feature counts in source order. */
    features: IAutoMovieRecoveryCameraFeaturePopulation[];

    /** Tentative mutual appearance matches and their fitted support flags. */
    matches: IAutoMovieRecoveryCameraMatch[];
  }

  /** All relative-pose qualification checks passed. */
  export interface IAccepted extends IObservations {
    /** The observation qualifies the returned relative pose. */
    status: "accepted-relative-pose";

    /** No qualification failures were recorded. */
    refusalReasons: [];

    /** Measured epipolar support and final qualification statistics. */
    consensus: IAutoMovieRecoveryCameraConsensus;

    /** Rotation and unit-baseline translation in the first camera's frame. */
    pose: IAutoMovieRecoveryCameraRelativePose;
  }

  /** The observation retained its measurements but failed camera qualification. */
  export interface IRefused extends IObservations {
    /** The observation does not qualify a relative pose. */
    status: "refused";

    /** One or more failed qualifications in evaluation order. */
    refusalReasons: [string, ...string[]];

    /** Attempted consensus, or `null` with fewer than eight tentative matches. */
    consensus: IAutoMovieRecoveryCameraConsensus | null;

    /** No pose passed all qualification checks. */
    pose: null;
  }
}

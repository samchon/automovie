import type { IAutoMovieRecoveryCameraBudget } from "./IAutoMovieRecoveryCameraBudget";
import type { IAutoMovieRecoveryCameraPolicy } from "./IAutoMovieRecoveryCameraPolicy";
import type { IAutoMovieRecoveryCameraView } from "./IAutoMovieRecoveryCameraView";

/**
 * Two ordered resident RGB8 images of an asserted fixed scene with supplied
 * corrected pinhole charts. Integer positions locate pixel centers. Keep both
 * borrowed rasters unchanged until synchronous estimation returns.
 */
export interface IAutoMovieRecoveryCameraPairInput {
  /** Resident schema for a calibrated camera pair. */
  schema: "automovie-recovery-camera-pair-v1";

  /** Nonblank identity of the asserted common scene. */
  objectId: string;

  /**
   * Caller assertion that both views show one fixed scene, including retained
   * background features.
   */
  rigidity: "asserted-fixed-scene";

  /** Acquisition class carried into the resulting pair evidence. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /**
   * Exactly two unique calibrated views, ordered with the reference camera
   * first.
   */
  views: IAutoMovieRecoveryCameraView[];

  /**
   * Feature, matching, consensus and relative-pose thresholds used for this
   * pair.
   */
  policy: IAutoMovieRecoveryCameraPolicy;

  /**
   * Positive safe work ceilings for pixel population, feature extraction,
   * matching and numerical fitting.
   */
  budget: IAutoMovieRecoveryCameraBudget;
}

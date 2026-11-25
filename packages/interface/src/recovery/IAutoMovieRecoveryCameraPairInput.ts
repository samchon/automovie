import type { IAutoMovieRecoveryCameraBudget } from "./IAutoMovieRecoveryCameraBudget";
import type { IAutoMovieRecoveryCameraPolicy } from "./IAutoMovieRecoveryCameraPolicy";
import type { IAutoMovieRecoveryCameraView } from "./IAutoMovieRecoveryCameraView";

/**
 * Two fixed RGB observations with supplied pinhole intrinsics and unknown pose.
 * Integer (column,row) denotes a pixel centre in the supplied calibration
 * chart. This differs from the orthographic support observer's pixel-edge
 * convention. Intrinsics, correction history and rigidity are caller
 * assertions; this record neither calibrates a lens nor establishes a static
 * scene from image bytes.
 */
export interface IAutoMovieRecoveryCameraPairInput {
  /** Version of the estimated-extrinsics resident image pair. */
  schema: "automovie-recovery-camera-pair-v1";

  /**
   * Common fixed object/scene identity; consistency is asserted rather than
   * proved.
   */
  objectId: string;

  /**
   * The observed scene, including any retained background features, is asserted
   * static.
   */
  rigidity: "asserted-fixed-scene";

  /**
   * Keep real photographic measurements distinct from analytic and inconsistent
   * controls.
   */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /**
   * Exactly two unique views, in the order defining the returned first-camera
   * gauge.
   */
  views: IAutoMovieRecoveryCameraView[];

  /** Current classical method and explicit experimental operating point. */
  policy: IAutoMovieRecoveryCameraPolicy;

  /**
   * Positive integer work limits checked before the corresponding allocation or
   * traversal.
   */
  budget: IAutoMovieRecoveryCameraBudget;
}

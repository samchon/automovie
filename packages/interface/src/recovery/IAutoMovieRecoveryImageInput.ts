import type { IAutoMovieRecoveryImageBackground } from "./IAutoMovieRecoveryImageBackground";
import type { IAutoMovieRecoveryImageBudget } from "./IAutoMovieRecoveryImageBudget";
import type { IAutoMovieRecoveryImageView } from "./IAutoMovieRecoveryImageView";

/**
 * Capture one caller-asserted fixed object in supplied horizontal
 * orthographic views. Use a common right-handed millimetre frame, exact
 * resident RGB8 views, one background rule and explicit observation limits.
 * Keep the view records and their pixel arrays stable until synchronous
 * observation returns.
 */
export interface IAutoMovieRecoveryImageInput {
  /** Nonempty identity for the fixed object common to every view. */
  objectId: string;

  /** Caller assertion that the object remains fixed throughout the capture. */
  rigidity: "asserted-fixed";

  /**
   * Evidence category for analytic input, photographs or inconsistent-input
   * controls.
   */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /**
   * Nonempty identity of the shared right-handed millimetre coordinate frame.
   */
  frame: string;

  /**
   * Shared RGB byte reference and channel-distance threshold for foreground
   * classification.
   */
  background: IAutoMovieRecoveryImageBackground;

  /**
   * Ordered calibrated resident RGB8 captures with unique view identities. Keep
   * them stable until observation returns.
   */
  views: IAutoMovieRecoveryImageView[];

  /**
   * Positive safe integer limits on views, total pixels and retained support
   * rows.
   */
  budget: IAutoMovieRecoveryImageBudget;
}

import type { IAutoMovieRecoveryImageBackground } from "./IAutoMovieRecoveryImageBackground";
import type { IAutoMovieRecoveryImageBudget } from "./IAutoMovieRecoveryImageBudget";
import type { IAutoMovieRecoveryImageView } from "./IAutoMovieRecoveryImageView";

/**
 * Resident RGB observations of one caller-declared fixed rigid object. Known
 * orthographic cameras look horizontally through the common XZ plane. Pixel
 * centres are (column + 0.5, row + 0.5); positive image U projects cos(azimuth)
 * X + sin(azimuth) Z and positive image V projects negative Y. Supplied
 * calibration fixes metric scale and object frame, not estimated cameras.
 */
export interface IAutoMovieRecoveryImageInput {
  /** Identity of the same fixed rigid object in all views. */
  objectId: string;

  /** Caller assertion; structural admission cannot verify physical rigidity. */
  rigidity: "asserted-fixed";

  /**
   * Keep analytic truth, actual photographs and inconsistent-input results
   * separate.
   */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Common right-handed metric-frame identity. */
  frame: string;

  /**
   * Fixed sRGB byte background; a maximum absolute channel distance at least
   * the positive threshold, at most 255, marks foreground.
   */
  background: IAutoMovieRecoveryImageBackground;

  /**
   * Borrowed row-major RGB8 arrays, stable until synchronous observation
   * returns.
   */
  views: IAutoMovieRecoveryImageView[];

  /**
   * Positive integer total-pixel, view and retained-row limits checked before
   * scans.
   */
  budget: IAutoMovieRecoveryImageBudget;
}

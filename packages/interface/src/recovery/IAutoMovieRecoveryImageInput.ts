import type { IAutoMovieRecoveryImageBackground } from "./IAutoMovieRecoveryImageBackground";
import type { IAutoMovieRecoveryImageBudget } from "./IAutoMovieRecoveryImageBudget";
import type { IAutoMovieRecoveryImageView } from "./IAutoMovieRecoveryImageView";

/**
 * Resident RGB observations of one caller-declared fixed rigid object.
 * Known orthographic cameras look horizontally through the common XZ plane.
 * Pixel centres are (column + 0.5, row + 0.5); positive image U projects
 * cos(azimuth) X + sin(azimuth) Z and positive image V projects negative Y.
 * Supplied calibration fixes metric scale and object frame, not estimated cameras.
 *
 * @evidence contracts/common.md#principled-implementation Explicit metric orthographic charts and immutable byte identities distinguish supplied calibration from recovered geometry and permit corresponding physical rows without matching sliding apparent contours.
 * @evidence contracts/common.md#clear-and-simple-design This pure capture record contains resident pixels, camera provenance and the declared non-trained background test; fitting policy and saved coefficients belong to separate records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One asserted rigid object and one cohort identify the capture; no hidden camera estimation, learned mask, manual curve, resampling or mesh reference is represented.
 * @evidence contracts/common.md#meaningful-documentation Documents pixel centres, axis signs, millimetres, supplied calibration, RGB interpretation, byte provenance and borrowed-array lifetime.
 */
export interface IAutoMovieRecoveryImageInput {
  /** Identity of the same fixed rigid object in all views. */
  objectId: string;

  /** Caller assertion; structural admission cannot verify physical rigidity. */
  rigidity: "asserted-fixed";

  /** Keep analytic truth, actual photographs and inconsistent-input results separate. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Common right-handed metric-frame identity. */
  frame: string;

  /** Fixed sRGB byte background; a maximum absolute channel distance at least the positive threshold, at most 255, marks foreground. */
  background: IAutoMovieRecoveryImageBackground;

  /** Borrowed row-major RGB8 arrays, stable until synchronous observation returns. */
  views: IAutoMovieRecoveryImageView[];

  /** Positive integer total-pixel, view and retained-row limits checked before scans. */
  budget: IAutoMovieRecoveryImageBudget;
}

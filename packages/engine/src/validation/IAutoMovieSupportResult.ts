import {
  IAutoMovieInteractionEvent,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IAutoMovieToppling } from "./IAutoMovieToppling";

/**
 * Support advice, fall events and a nullable topple from detectSupportToppling.
 *
 * @evidence contracts/development/design.md#principled-representation The detector separates invalid-input errors, unsupported-body warnings and an optional nearest-hull-edge suggestion; a supplied physicsIntent suppresses the warning and topple while retaining the fall event.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One geometric decision supplies both diagnostic and interaction consumers without requiring a second support computation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A suggested topple is advice rather than an applied motion, and point support-hull testing does not prove dynamic balance or continuous collision freedom.
 * @evidence contracts/development/common.md#meaningful-documentation Names the detector and warning/error envelope, time-zero events and nullable toppling meaning, including physics-intent suppression.
 */
export interface IAutoMovieSupportResult {
  /** Warning-severity feedback (or an error for bad input). */
  validation: IAutoMovieValidation;

  /** Fall events on the shot clock: "one calculation, two consumers". */
  events: IAutoMovieInteractionEvent[];

  /** Suggested topple, or `null` when supported. */
  toppling: IAutoMovieToppling | null;
}

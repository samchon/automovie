import {
  IAutoMovieInteractionEvent,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IAutoMovieToppling } from "./IAutoMovieToppling";

/**
 * Support advice, fall events and a nullable topple from detectSupportToppling.
 *
 * @evidence contracts/common.md#principled-implementation The detector separates invalid-input errors, unsupported-body warnings and an optional nearest-hull-edge suggestion; a supplied physicsIntent suppresses the warning and topple while retaining the fall event.
 * @evidence contracts/common.md#clear-and-simple-design One geometric decision supplies both diagnostic and interaction consumers without requiring a second support computation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A suggested topple is advice rather than an applied motion, and point support-hull testing does not prove dynamic balance or continuous collision freedom.
 * @evidence contracts/common.md#meaningful-documentation Names the detector and warning/error envelope, time-zero events and nullable toppling meaning, including physics-intent suppression.
 * @evidence contracts/performance.md#efficient-algorithms This wrapper performs no hull construction or nearest-edge scan; the detector owns those population costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Its findings and suggestion come from one support evaluation rather than unrelated independently cached poses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns outcome containers and fresh event points; suggested pivot endpoints borrow input support references, without an acquired physics host.
 * @author Samchon
 */
export interface IAutoMovieSupportResult {
  /** Warning-severity feedback (or an error for bad input). */
  validation: IAutoMovieValidation;

  /** Fall events on the shot clock: "one calculation, two consumers". */
  events: IAutoMovieInteractionEvent[];

  /** Suggested topple, or `null` when supported. */
  toppling: IAutoMovieToppling | null;
}

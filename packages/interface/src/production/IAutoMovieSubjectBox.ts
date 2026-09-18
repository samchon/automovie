import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Inclusive axis-aligned box in the description's stated coordinate space.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Exposes measurable compiled subject extent without requiring a render.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Types the measured minimum and maximum corners.
 */
export interface IAutoMovieSubjectBox {
  /**
   * Inclusive minimum corner in metres.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Reports the lower coordinate limits of compiled subject content.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Types the box minimum produced by deterministic measurement.
   */
  min: IAutoMovieVector3;
  /**
   * Inclusive maximum corner in metres.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-compiled-truth Reports the upper coordinate limits of compiled subject content.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-bounds Types the box maximum produced by deterministic measurement.
   */
  max: IAutoMovieVector3;
}

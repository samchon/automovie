import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * One shot-local frame-grid time and nonempty render-pass population required for visual review.
 *
 * @evidence contracts/common.md#principled-implementation Design validation admits an in-shot production-frame time and unique passes; review requires current verified captures at those coordinates, while edited segments select only contained review frames or an explicit source-in fallback.
 * @evidence contracts/common.md#clear-and-simple-design A stable review id, time and pass list specify visual evidence without embedding PNG bytes or mixing the review request with a capture receipt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declaring a frame does not prove capture or reviewer observation; exact current bundle identity and actual media checks remain required for its evidence.
 * @evidence contracts/common.md#meaningful-documentation Defines stable review-frame identity, shot-local second/frame-grid timing and the nonempty unique pass list.
 * @author Samchon
 */
export interface IAutoMovieShotReviewFrame {
  /** Stable frame-contract id. */
  id: string;

  /**
   * Shot-local time in seconds inside the owning duration and exactly on the production frame clock.
   */
  time: number;

  /** Non-empty unique passes that must be captured. */
  passes: AutoMovieGuidePass[];
}

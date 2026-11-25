import type { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/**
 * One shot-local frame-grid time and nonempty render-pass population required
 * for visual review.
 */
export interface IAutoMovieShotReviewFrame {
  /** Stable frame-contract id. */
  id: string;

  /**
   * Shot-local time in seconds inside the owning duration and exactly on the
   * production frame clock.
   */
  time: number;

  /** Non-empty unique passes that must be captured. */
  passes: AutoMovieGuidePass[];
}

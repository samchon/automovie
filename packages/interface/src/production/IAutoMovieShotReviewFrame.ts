import { AutoMovieGuidePass } from "../cinematics/AutoMovieGuidePass";

/** A frame time and guide passes required for shot review. */
export interface IAutoMovieShotReviewFrame {
  /** Stable frame-contract id. */
  id: string;

  /**
   * Time inside the owning shot, snapped exactly to the production frame clock.
   */
  time: number;

  /** Non-empty unique passes that must be captured. */
  passes: AutoMovieGuidePass[];
}

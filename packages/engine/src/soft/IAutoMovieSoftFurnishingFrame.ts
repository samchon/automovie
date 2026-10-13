import {
  IAutoMovieSoftAnalysis,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";

/** One frame of a bound furnishing: what was computed, and what was claimed. */
export interface IAutoMovieSoftFurnishingFrame {
  /** Identity of the furnishing the frame belongs to. */
  furnishing: string;

  /**
   * What the analysis actually did, including anything it declined to claim.
   */
  analysis: IAutoMovieSoftAnalysis;

  /** The particle state, or `null` when nothing was computed at all. */
  state: IAutoMovieSoftBodyState | null;

  /** Drawable geometry derived from that state, or `null` beside it. */
  surface: IAutoMovieSoftBodySurface | null;
}

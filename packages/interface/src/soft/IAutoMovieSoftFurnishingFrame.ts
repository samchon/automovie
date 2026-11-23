import type { IAutoMovieSoftAnalysis } from "./IAutoMovieSoftAnalysis";
import type { IAutoMovieSoftBodyState } from "./IAutoMovieSoftBodyState";
import type { IAutoMovieSoftBodySurface } from "./IAutoMovieSoftBodySurface";

/**
 * One lowerSoftFurnishing result with its computation status and derived
 * surface.
 */
export interface IAutoMovieSoftFurnishingFrame {
  /** Identity of the furnishing the frame belongs to. */
  furnishing: string;

  /** What the analysis actually did, including anything it declined to claim. */
  analysis: IAutoMovieSoftAnalysis;

  /** The particle state, or `null` when nothing was computed at all. */
  state: IAutoMovieSoftBodyState | null;

  /** Drawable geometry derived from that state, or `null` beside it. */
  surface: IAutoMovieSoftBodySurface | null;
}

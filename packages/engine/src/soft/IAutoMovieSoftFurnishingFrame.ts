import {
  IAutoMovieSoftAnalysis,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";

/**
 * One lowerSoftFurnishing result with its computation status and derived surface.
 *
 * @evidence contracts/development/design.md#principled-representation Particle state and its surface accompany an explicit analysis status, so not-run nulls differ from rest geometry returned for a declared unsupported solve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Furnishing identity joins simulation and display derivatives in one result while domain configuration remains authored elsewhere.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null state/surface expose an unperformed derivation, and unsupported/rest statuses do not claim a moving cloth simulation succeeded.
 * @evidence contracts/development/common.md#meaningful-documentation Names the lowering producer and distinguishes no computation from a drawable but explicitly unsolved rest state.
 */
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

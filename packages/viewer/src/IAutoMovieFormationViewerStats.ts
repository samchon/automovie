import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Per-frame bounded debug summary for one formation.
 *
 * @evidence contracts/development/design.md#principled-representation Separates anonymous near/far batch-selected slots, chunk-frustum exclusions and authored removals from promoted hero selection. Counts describe viewer state, not native draw submissions or visible pixels; compiled inputs omit hero tiers from anonymous LODs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A fixed-size count record exposes runtime accounting without retaining per-member debug arrays for the host.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Hero visibility is not counted as anonymous instances; removed and off-camera members remain distinct instead of being combined to match a total.
 * @evidence contracts/development/common.md#meaningful-documentation Explains anonymous accounting, promoted hero treatment and why authored removal differs from frustum culling.
 */
export interface IAutoMovieFormationViewerStats {
  /**
   * Slots assigned to visible batches per tier after chunk culling, without observing draw submissions or pixels.
   *
   * `near` and `far` count anonymous instance slots. `hero` counts promoted
   * hero objects still inside the frustum instead, because an anonymous slot
   * can never select that tier: the builder drops the hero tier from the
   * anonymous LOD list. Anonymous accounting is therefore the sum of `near`,
   * `far`, `culled` and `removed`, and the hero count belongs beside it rather
   * than inside it.
   */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;

  /** Anonymous slots rejected by camera-frustum chunk culling. */
  culled: number;

  /**
   * Anonymous slots a per-member cue has taken out of the shot at this time.
   *
   * Counted apart from `culled`, because the two are different claims: a culled
   * member is off camera and would be drawn if the camera turned, while a
   * removed one is not in the shot at all.
   */
  removed: number;

  /** Named heroes kept outside instance batches. */
  heroes: number;
}

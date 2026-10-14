import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Per-frame bounded debug summary for one formation.
 *
 * @evidence contracts/common.md#principled-implementation Separates anonymous near/far visible slots, camera-culled slots and authored removals from promoted hero counts, preserving the different meanings of visibility and shot membership.
 * @evidence contracts/common.md#clear-and-simple-design A fixed-size count record exposes runtime accounting without retaining per-member debug arrays for the host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hero visibility is not counted as anonymous instances; removed and off-camera members remain distinct instead of being combined to match a total.
 * @evidence contracts/common.md#meaningful-documentation Explains anonymous accounting, promoted hero treatment and why authored removal differs from frustum culling.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These numeric fields choose no culling or LOD algorithm; buildInstancedFormation computes them.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A per-frame count value coordinates no retained computation across frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The summary has fixed numeric storage and no member references, handles or asynchronous tasks.
 *
 * @author Samchon
 */
export interface IAutoMovieFormationViewerStats {
  /**
   * Slots currently drawn per tier after chunk culling.
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


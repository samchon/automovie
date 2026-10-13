import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Per-frame bounded debug summary for one formation.
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


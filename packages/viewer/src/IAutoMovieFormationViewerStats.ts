import type { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Per-frame bounded debug summary for one formation.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Reports visible, culled, removed, and promoted populations separately.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements bounded logical-to-display accounting for a formation.
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
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Counts the visible slots selected for each display tier.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Reports the logical-to-display tier selection.
   */
  visible: Record<IAutoMovieCompiledFormationLod["tier"], number>;

  /**
   * Anonymous slots rejected by camera-frustum chunk culling.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Counts slots rejected by the active camera-frustum policy separately.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Reports the culling side of logical-to-display resolution.
   */
  culled: number;

  /**
   * Anonymous slots a per-member cue has taken out of the shot at this time.
   *
   * Counted apart from `culled`, because the two are different claims: a culled
   * member is off camera and would be drawn if the camera turned, while a
   * removed one is not in the shot at all.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Separates authored removal from camera culling and drawn tiers.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Keeps removed logical members out of display-tier counts.
   */
  removed: number;

  /**
   * Named heroes kept outside instance batches.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-evidence-quantity Separates named heroes from anonymous display tiers.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Preserves hero display identity outside anonymous LOD accounting.
   */
  heroes: number;
}


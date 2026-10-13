/**
 * One distance-specific recipe reference emitted as authoring/runtime metadata.
 *
 * The foundation builder materializes every referenced recipe. The scaffold
 * viewer automatically selects anonymous formation tiers from distance and
 * projected contribution with hysteresis; ordinary scene nodes do not yet
 * switch model tiers automatically.
 */
export interface IAutoMovieModelLodRecipe {
  /** Detail tier. */
  tier: "hero" | "near" | "far";

  /**
   * Positive maximum viewing distance in meters, strictly increasing between
   * tiers, or null only on the final unbounded tier.
   */
  maxDistance: number | null;

  /** Existing recipe id used at this tier; self-reference is allowed. */
  recipe: string;
}

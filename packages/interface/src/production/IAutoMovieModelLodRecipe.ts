/**
 * One distance-specific recipe reference emitted as authoring/runtime metadata.
 *
 * The builder materializes referenced recipes. The scaffold viewer selects anonymous formation tiers from distance and projected contribution with hysteresis; ordinary scene nodes currently retain their selected model.
 *
 * @evidence contracts/common.md#principled-implementation Ordered distance thresholds map a declared tier to an existing recipe; design admission enforces increasing positive limits and permits null only for the final unbounded tier.
 * @evidence contracts/common.md#clear-and-simple-design This record owns one threshold-to-recipe edge while the model recipe owns tier order and the viewer owns hysteretic runtime selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-reference is explicitly valid and missing recipes refuse; declaring LOD metadata does not promise automatic tier switching for ordinary scene nodes.
 * @evidence contracts/common.md#meaningful-documentation Defines supported tiers, meter limits, terminal null, recipe identity and the current anonymous-formation consumer scope.
 * @author Samchon
 */
export interface IAutoMovieModelLodRecipe {
  /** Detail tier. */
  tier: "hero" | "near" | "far";

  /**
   * Positive maximum viewing distance in meters, strictly increasing between tiers, or null only on the final unbounded tier.
   */
  maxDistance: number | null;

  /** Existing recipe id used at this tier; self-reference is allowed. */
  recipe: string;
}

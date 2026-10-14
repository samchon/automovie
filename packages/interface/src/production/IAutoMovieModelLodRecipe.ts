/**
 * One distance-specific recipe reference emitted as authoring/runtime metadata.
 *
 * Engine population compilation retains references and recipe digests without materializing models. The viewer selects population tiers from distance and projected contribution with hysteresis; ordinary scene nodes retain their selected model.
 *
 * @evidence contracts/common.md#principled-implementation Ordered thresholds map a tier to an intended recipe. Increasing positive limits, terminal null and existing references are caller premises after production design-gate retirement; the Engine representation compiler preserves tiers and hashes an explicit marker for unresolved recipes.
 * @evidence contracts/common.md#clear-and-simple-design This record owns one threshold-to-recipe edge while the model recipe owns tier order and the viewer owns hysteretic runtime selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-reference is valid, while a missing recipe marker is not proof that its model exists. Declaring LOD metadata does not promise geometry construction or automatic tier switching for ordinary scene nodes.
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

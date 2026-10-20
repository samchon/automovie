/**
 * One distance-specific model group a population draws at one tier.
 *
 * A formation, an instance set or an instance prototype declares its ordered tiers; engine population compilation binds each tier to the referenced group's digest without materializing models. The viewer selects population tiers from distance and projected contribution with hysteresis; ordinary scene nodes retain their selected model.
 *
 * @evidence contracts/common.md#principled-implementation Ordered thresholds map a tier to a model group id. Increasing positive limits, terminal null and existing references are caller premises; the Engine representation compiler preserves tiers and hashes an explicit marker for an unresolved group.
 * @evidence contracts/common.md#clear-and-simple-design This record owns one threshold-to-group edge while the declaring population owns tier order and the viewer owns hysteretic runtime selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Self-reference is valid, while a missing-group marker is not proof that its model exists. Declaring LOD metadata does not promise geometry construction or automatic tier switching for ordinary scene nodes.
 * @evidence contracts/common.md#meaningful-documentation Defines supported tiers, meter limits, terminal null, model group identity and the population consumer scope.
 */
export interface IAutoMovieModelLod {
  /** Detail tier. */
  tier: "hero" | "near" | "far";

  /**
   * Positive maximum viewing distance in meters, strictly increasing between tiers, or null only on the final unbounded tier.
   */
  maxDistance: number | null;

  /** Id of the model group drawn at this tier; naming the population's own base group is allowed. */
  model: string;
}

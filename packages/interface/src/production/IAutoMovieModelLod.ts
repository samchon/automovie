/**
 * One distance-specific model group a population draws at one tier.
 *
 * A formation, an instance set or an instance prototype declares its ordered
 * tiers; engine population compilation binds each tier to the referenced
 * group's digest without materializing models. The viewer selects population
 * tiers from distance and projected contribution with hysteresis; ordinary
 * scene nodes retain their selected model.
 */
export interface IAutoMovieModelLod {
  /** Detail tier. */
  tier: "hero" | "near" | "far";

  /**
   * Positive maximum viewing distance in meters, strictly increasing between
   * tiers, or null only on the final unbounded tier.
   */
  maxDistance: number | null;

  /**
   * Id of the model group drawn at this tier; naming the population's own base
   * group is allowed.
   */
  model: string;
}

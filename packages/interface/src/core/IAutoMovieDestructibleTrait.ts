import type { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";

/**
 * Profile trait declaring durability and impact-material coefficients.
 *
 * ValidateProfileCapabilities, also called by validateModel and production
 * design admission, requires finite positive durability and valid impactBody
 * fields, allowing one destructible trait per profile. No engine verb currently
 * consumes it to apply damage, so it constrains metadata admission only.
 */
export interface IAutoMovieDestructibleTrait {
  /** Trait discriminator. */
  kind: "destructible";

  /** Structural durability, finite and positive; a unitless budget. */
  durability: number;

  /** Collision and material response owned by the declared proxy. */
  impactBody: IAutoMovieImpactBody;
}

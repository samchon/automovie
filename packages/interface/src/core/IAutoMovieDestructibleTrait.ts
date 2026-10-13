import { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";

/**
 * Profile trait proving that deterministic impacts can damage this body.
 *
 * `validateProfileCapabilities` and the production design lint require a
 * finite, positive `durability` and a valid `impactBody`, and allow one
 * destructible trait per profile. No engine verb reads this trait yet, so today
 * it constrains validation only.
 *
 * @author Samchon
 */
export interface IAutoMovieDestructibleTrait {
  /** Trait discriminator. */
  kind: "destructible";

  /** Structural durability, finite and positive; a unitless budget. */
  durability: number;

  /** Collision and material response owned by the declared proxy. */
  impactBody: IAutoMovieImpactBody;
}

import { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";

/**
 * Profile trait proving that deterministic impacts can damage this body.
 *
 * `validateProfileCapabilities` and the production design lint require a
 * finite, positive `durability` and a valid `impactBody`, and allow one
 * destructible trait per profile. No engine verb reads this trait yet, so today
 * it constrains validation only.
 *
 * @evidence contracts/common.md#principled-implementation A typed capability variant discriminated by `kind`, so the profile contract grants damage only through this exact variant; both validators apply the same positivity checks to durability and the proxy coefficients and the same `[0, 1]` range to restitution.
 * @evidence contracts/common.md#clear-and-simple-design A durability scalar plus the delegated impact proxy; no engine or production verb reads either field today, so the trait is validated data held for a damage verb that does not exist yet, which this chapter's rule against presumed future needs flags.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No profile or model name grants destruction, only the typed variant does, and both validators refuse a second destructible trait on one profile instead of merging the two.
 * @evidence contracts/common.md#meaningful-documentation Gives the validation rules, the one-per-profile rule, the unitless meaning of durability, and that no verb consumes the trait yet.
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

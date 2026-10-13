import { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";

/**
 * Profile trait proving that deterministic impacts can damage this body.
 *
 * `validateProfileCapabilities`, which `validateModel` and the production
 * design lint both run, requires a finite, positive `durability` and a valid
 * `impactBody`, and allows one destructible trait per profile. No engine verb
 * reads this trait yet, so today it constrains validation only.
 *
 * @evidence contracts/common.md#principled-implementation `validateProfileCapabilities` checks durability as finite and positive, checks every impact-body field against its own range, and refuses a second trait of the same kind in one profile.
 * @evidence contracts/common.md#clear-and-simple-design A discriminated trait with one budget and one material record, kept beside the mountable trait in the profile's `traits` list so capabilities are additive rather than flags on the profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No verb is faked to consume the trait; the documentation states that it only constrains validation until one exists.
 * @evidence contracts/common.md#meaningful-documentation States what the trait claims, which validators enforce it and how, the one-per-profile rule, and that no engine verb reads it yet.
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

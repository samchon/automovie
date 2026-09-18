import { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";

/**
 * Profile trait proving that deterministic impacts can damage this body.
 *
 * @evidence requirements/effects-and-simulation/damage-and-destruction-boundary.md#effects-damage-trait-result Exposes `IAutoMovieDestructibleTrait` as the portable data boundary for the effects damage trait result requirement.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#damage-trait-result-state-boundary Types `IAutoMovieDestructibleTrait` for the damage trait result state boundary system contract.
 */
export interface IAutoMovieDestructibleTrait {
  /**
   * Trait discriminator.
   *
   * @evidence requirements/effects-and-simulation/damage-and-destruction-boundary.md#effects-damage-trait-result Exposes `kind` as the portable data boundary for the effects damage trait result requirement.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#damage-trait-result-state-boundary Types `kind` for the damage trait result state boundary system contract.
   */
  kind: "destructible";
  /**
   * Positive structural durability.
   *
   * @evidence requirements/effects-and-simulation/damage-and-destruction-boundary.md#effects-damage-trait-result Exposes `durability` as the portable data boundary for the effects damage trait result requirement.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#damage-trait-result-state-boundary Types `durability` for the damage trait result state boundary system contract.
   */
  durability: number;
  /**
   * Collision and material response owned by the declared proxy.
   *
   * @evidence requirements/effects-and-simulation/damage-and-destruction-boundary.md#effects-damage-trait-result Exposes `impactBody` as the portable data boundary for the effects damage trait result requirement.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#damage-trait-result-state-boundary Types `impactBody` for the damage trait result state boundary system contract.
   */
  impactBody: IAutoMovieImpactBody;
}

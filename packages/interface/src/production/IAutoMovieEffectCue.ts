import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * One bounded reference to a registered deterministic world effect zone.
 *
 * @evidence requirements/effects-and-simulation/scope-and-simulation-tiers.md#effects-authoring-control Exposes `IAutoMovieEffectCue` as the portable data boundary for the effects authoring control requirement.
 * @evidence specifications/simulation-effects-and-sound/scope-tiers-and-identities.md#effect-tier-state-machine Types `IAutoMovieEffectCue` for the effect tier state machine system contract.
 */
export interface IAutoMovieEffectCue {
  /**
   * Stable cue id.
   *
   * @evidence requirements/effects-and-simulation/scope-and-simulation-tiers.md#effects-authoring-control Exposes `id` as the portable data boundary for the effects authoring control requirement.
   * @evidence specifications/simulation-effects-and-sound/scope-tiers-and-identities.md#effect-tier-state-machine Types `id` for the effect tier state machine system contract.
   */
  id: string;
  /**
   * Supported builder-owned recipe family.
   *
   * @evidence requirements/effects-and-simulation/scope-and-simulation-tiers.md#effects-authoring-control Exposes `recipe` as the portable data boundary for the effects authoring control requirement.
   * @evidence specifications/simulation-effects-and-sound/scope-tiers-and-identities.md#effect-tier-state-machine Types `recipe` for the effect tier state machine system contract.
   */
  recipe: "world-zone";
  /**
   * Existing world effect-zone id.
   *
   * @evidence requirements/effects-and-simulation/scope-and-simulation-tiers.md#effects-authoring-control Exposes `zone` as the portable data boundary for the effects authoring control requirement.
   * @evidence specifications/simulation-effects-and-sound/scope-tiers-and-identities.md#effect-tier-state-machine Types `zone` for the effect tier state machine system contract.
   */
  zone: string;
  /**
   * Film-global cue start.
   *
   * @evidence requirements/effects-and-simulation/scope-and-simulation-tiers.md#effects-authoring-control Exposes `start` as the portable data boundary for the effects authoring control requirement.
   * @evidence specifications/simulation-effects-and-sound/scope-tiers-and-identities.md#effect-tier-state-machine Types `start` for the effect tier state machine system contract.
   */
  start: AutoMovieFilmTime;
  /**
   * Cue duration.
   *
   * @evidence requirements/effects-and-simulation/scope-and-simulation-tiers.md#effects-authoring-control Exposes `duration` as the portable data boundary for the effects authoring control requirement.
   * @evidence specifications/simulation-effects-and-sound/scope-tiers-and-identities.md#effect-tier-state-machine Types `duration` for the effect tier state machine system contract.
   */
  duration: AutoMovieFilmTime;
  /**
   * Bounded normalized strength.
   *
   * @evidence requirements/effects-and-simulation/scope-and-simulation-tiers.md#effects-authoring-control Exposes `intensity` as the portable data boundary for the effects authoring control requirement.
   * @evidence specifications/simulation-effects-and-sound/scope-tiers-and-identities.md#effect-tier-state-machine Types `intensity` for the effect tier state machine system contract.
   */
  intensity: number;
}

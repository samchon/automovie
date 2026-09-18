import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One exact live billboard derived from a compiled effect stream.
 *
 * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state Carries the deterministic state of one live particle.
 * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence Exposes the bounded lifecycle sample consumed by projection.
 */
export interface IAutoMovieEffectParticle {
  /**
   * Stable zero-based spawn identity.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-deterministic-spawn Keeps each deterministic spawn independently addressable.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#deterministic-particle-spawn-interval Carries the stable index from which spawn variation is derived.
   */
  index: number;
  /**
   * Fixed-step sampled world position.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state Records the particle state at the requested step.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence Makes the live particle position available to deterministic projection.
   */
  position: IAutoMovieVector3;
  /**
   * World billboard size in meters.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state Retains the authored particle size throughout its lifetime.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence Carries the bounded drawable extent of the particle.
   */
  size: number;
  /**
   * Bounded sampled alpha.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state Reports the sampled visibility state of the live particle.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence Exposes the lifecycle-derived opacity without hidden renderer state.
   */
  opacity: number;
  /**
   * Normalized lifetime progress.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state Makes the particle's bounded lifetime progress explicit.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence Identifies the sampled position within the particle lifecycle.
   */
  ageRatio: number;
}

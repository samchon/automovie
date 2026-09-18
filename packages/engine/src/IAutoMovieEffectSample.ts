import { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";

/**
 * One bounded deterministic effect sample.
 *
 * @evidence requirements/effects-and-simulation/clock-seek-and-determinism.md#effects-seek-reconstruction Represents a complete reconstructed effect answer at an absolute time.
 * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#arbitrary-seek-reconstruction-contract Carries the reconstructed state without playback cursor history.
 */
export interface IAutoMovieEffectSample {
  /**
   * Fixed-step shot time actually sampled.
   *
   * @evidence requirements/effects-and-simulation/clock-seek-and-determinism.md#effects-step-boundary Exposes the exact fixed-step boundary used for the answer.
   * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#effect-film-time-step-boundary Records the deterministic film-time mapping chosen by the sampler.
   */
  time: number;
  /**
   * Whether the cue is active at that step.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state Distinguishes an inactive cue from an empty live population.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence Carries the lifecycle state at the sampled boundary.
   */
  active: boolean;
  /**
   * Sampled cue intensity.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state Exposes the bounded cue state that shapes particle visibility.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence Carries the deterministic lifecycle amplitude for projection.
   */
  intensity: number;
  /**
   * Live particles after deterministic distance thinning and hard cap.
   *
   * @evidence requirements/effects-and-simulation/particles-and-emission.md#effects-deterministic-spawn Preserves the repeatable live spawn population.
   * @evidence specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#deterministic-particle-spawn-interval Returns the interval-derived population after bounded selection.
   */
  particles: IAutoMovieEffectParticle[];
}

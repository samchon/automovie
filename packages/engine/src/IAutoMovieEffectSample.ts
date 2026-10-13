import { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";

/**
 * One bounded deterministic effect sample.
 *
 * `sampleCompiledEffect` snaps the requested time down to the effect's fixed
 * step, so two requests inside one step return the same sample. Outside the
 * cue's `[start, end)` window the sample is inactive, with zero intensity and no
 * particles.
 *
 * @author Samchon
 */
export interface IAutoMovieEffectSample {
  /**
   * Fixed-step shot time actually sampled, in seconds: the request floored to a
   * multiple of the step and never negative.
   */
  time: number;

  /** Whether the sampled time falls inside the cue's `[start, end)` window. */
  active: boolean;

  /**
   * Cue intensity interpolated linearly from the cue's `from` to `to` across its
   * window; 0 when inactive.
   */
  intensity: number;

  /**
   * Live particles in spawn order, keeping every fourth spawn when the camera is
   * beyond the recipe's LOD distance and stopping at `budget.maxParticles`.
   */
  particles: IAutoMovieEffectParticle[];
}

import type { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";

/**
 * One bounded deterministic effect sample.
 *
 * `sampleCompiledEffect` uses the requested time to decide membership in the
 * cue's `[start, end)` window. The active state uses its fixed-step clock with
 * a separate opening sample for cues that start between steps. Inactive samples
 * have zero intensity and no particles.
 */
export interface IAutoMovieEffectSample {
  /**
   * State time in seconds. It ordinarily uses the fixed-step clock, with the
   * active state's first and last instants bounded by the cue.
   */
  time: number;

  /** Whether the requested time falls inside the cue's `[start, end)` window. */
  active: boolean;

  /**
   * Cue intensity interpolated linearly from the cue's `from` to `to` across
   * its window; 0 when inactive.
   */
  intensity: number;

  /**
   * Live particles in spawn order, keeping only spawns whose index is a
   * multiple of four when the camera is beyond the recipe's LOD distance, and
   * holding at most `budget.maxParticles`; empty when inactive.
   */
  particles: IAutoMovieEffectParticle[];
}

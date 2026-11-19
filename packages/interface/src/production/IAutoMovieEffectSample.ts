import type { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";

/**
 * One bounded deterministic effect sample.
 *
 * `sampleCompiledEffect` uses the requested time to decide membership in the
 * cue's `[start, end)` window. The active state uses its fixed-step clock with
 * a separate opening sample for cues that start between steps. Inactive samples
 * have zero intensity and no particles.
 *
 * @evidence contracts/development/design.md#principled-representation Requested time decides exact interval membership, and fixed-step state uses an opening bound and a guard against rounding into the exclusive end. The result depends on the compiled stream and explicit sampling coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields: the snapped time, the active flag, the interpolated intensity and the particle list, so a renderer needs nothing beyond this record to draw the effect at that instant.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An inactive window yields an explicit inactive sample with zero intensity rather than an absent value a caller would have to guess at, and the LOD thinning rule is the recipe's own distance, not a per-camera exception.
 * @evidence contracts/development/common.md#meaningful-documentation States how the time is snapped, the half-open active window, the linear intensity law and its zero when inactive, and the order, thinning rule and budget cap of the particle list.
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
   * Cue intensity interpolated linearly from the cue's `from` to `to` across its
   * window; 0 when inactive.
   */
  intensity: number;

  /**
   * Live particles in spawn order, keeping only spawns whose index is a multiple
   * of four when the camera is beyond the recipe's LOD distance, and holding at
   * most `budget.maxParticles`; empty when inactive.
   */
  particles: IAutoMovieEffectParticle[];
}

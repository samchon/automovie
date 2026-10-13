import { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";

/**
 * One bounded deterministic effect sample.
 *
 * `sampleCompiledEffect` snaps the requested time down to the effect's fixed
 * step, so two requests inside one step return the same sample. Outside the
 * cue's `[start, end)` window the sample is inactive, with zero intensity and no
 * particles.
 *
 * @evidence contracts/common.md#principled-implementation A fixed-step sample: the time is floored to a step multiple with a 1e-9 tolerance, so every request inside one step maps to one deterministic sample and replay does not depend on the caller's frame rate.
 * @evidence contracts/common.md#clear-and-simple-design Four fields: the snapped time, the active flag, the interpolated intensity and the particle list, so a renderer needs nothing beyond this record to draw the effect at that instant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An inactive window yields an explicit inactive sample with zero intensity rather than an absent value a caller would have to guess at, and the LOD thinning rule is the recipe's own distance, not a per-camera exception.
 * @evidence contracts/common.md#meaningful-documentation States how the time is snapped, the half-open active window, the linear intensity law and its zero when inactive, and the order, thinning rule and budget cap of the particle list.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result shape only; candidate generation and thinning cost is answered on `sampleCompiledEffect`, which returns one sample per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type stores no sample cache; two requests in one step recompute the same sample, which `sampleCompiledEffect` documents as deterministic rather than shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned sample; its particle array is capped at the recipe's `budget.maxParticles`, so its size never grows with elapsed time.
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
   * Live particles in spawn order, keeping only spawns whose index is a multiple
   * of four when the camera is beyond the recipe's LOD distance, and holding at
   * most `budget.maxParticles`; empty when inactive.
   */
  particles: IAutoMovieEffectParticle[];
}

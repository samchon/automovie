import { IAutoMovieEffectParticle } from "./IAutoMovieEffectParticle";

/**
 *
 * One bounded deterministic effect sample.
 *
 * `sampleCompiledEffect` snaps the requested time down to the effect's fixed
 * step, so two requests inside one step return the same sample. Outside the
 * cue's `[start, end)` window the sample is inactive, with zero intensity and no
 * particles.
 *
 * @evidence contracts/common.md#principled-implementation Samples on a fixed-step clock and derives particles statelessly from spawn index, so any time can be sampled directly for a seek and a repeated request gives identical bytes.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the active flag apart from the particle list, so a consumer can skip an inactive cue without inspecting particles; the film runtime wraps it in `IAutoMovieProductionFilmEffectSample` instead of adding fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The thinning rule (every fourth spawn beyond `lodDistance`) and the hard cap come from the recipe's declared budget, not from per-scene tuning.
 * @evidence contracts/common.md#meaningful-documentation States the time snapping, the inactive shape, how intensity is interpolated, and the thinning and cap rules the particle list obeys.
 * @evidenceExclude contracts/performance.md#cost-and-resources A result record; producing it is linear in the live spawn window and that cost belongs to `sampleCompiledEffect`. The engine keeps no sample; two requests within one fixed step recompute identical bytes, and any step-keyed cache is the consumer's. Holds at most `budget.maxParticles` particles and is owned by the caller until it drops the sample.
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

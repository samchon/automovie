import { IAutoMovieVector3 } from "@automovie/interface";

/**
 *
 * One exact live billboard derived from a compiled effect stream.
 *
 * `sampleCompiledEffect` recomputes every field from the compiled effect seed,
 * the spawn index and the sampled time, so a particle carries no state between
 * samples and the same inputs give the same particle on every host.
 *
 * @evidence contracts/common.md#principled-implementation Every field is a closed-form function of seed, spawn index and sampled time, so a particle has no integration state that could drift between a seek and a continuous playback.
 * @evidence contracts/common.md#clear-and-simple-design Five fields a billboard renderer reads and nothing more; velocity and lifetime stay inside the sampler because no renderer needs them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no renderer-specific field; the opacity envelope and spawn numbering are the sampler's rules, documented here so consumers need not reconstruct them.
 * @evidence contracts/common.md#meaningful-documentation States the spawn numbering, the world frame and meters, how opacity and age ratio are formed, and that an expired particle is never emitted.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record of five numbers; the sampler allocates one per live particle, bounded by the recipe's particle budget. Rebuilt for every sampled time from seed and index, since position and opacity change with the particle's age. Owned by the sample array that holds it and released with that sample; at most `budget.maxParticles` exist per sample.
 * @author Samchon
 */
export interface IAutoMovieEffectParticle {
  /**
   * Stable zero-based spawn identity: burst particles take `0..burst-1` and
   * regular spawns continue after them in emission order, so a renderer can key
   * a billboard by it across samples.
   */
  index: number;

  /**
   * World position in meters at the sampled step: a seeded point inside the
   * effect bounds advanced by wind, rise and turbulence times the particle's
   * age.
   */
  position: IAutoMovieVector3;

  /** World billboard size in meters, seeded between the recipe's size bounds. */
  size: number;

  /**
   * Alpha seeded between the recipe's opacity bounds, scaled by the cue
   * intensity and by `sin(pi * ageRatio)` so it fades in and out over the
   * particle's life.
   */
  opacity: number;

  /**
   * Age over this particle's seeded lifetime, within `[0, 1)`; a particle at or
   * past its lifetime is not emitted.
   */
  ageRatio: number;
}

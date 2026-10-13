import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One exact live billboard derived from a compiled effect stream.
 *
 * `sampleCompiledEffect` recomputes every field from the compiled effect seed,
 * the spawn index and the sampled time, so a particle carries no state between
 * samples and the same inputs give the same particle on every host.
 *
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

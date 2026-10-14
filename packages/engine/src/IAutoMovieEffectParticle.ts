import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One exact live billboard derived from a compiled effect stream.
 *
 * `sampleCompiledEffect` recomputes every field from the compiled effect seed,
 * the spawn index and the sampled time, so a particle carries no state between
 * samples and the same inputs give the same particle on every host.
 *
 * @evidence contracts/common.md#principled-implementation Every field is a pure function of the compiled effect seed, the spawn index and the sampled time through a seeded hash, so the particle is reproducible on any host without carried simulation state.
 * @evidence contracts/common.md#clear-and-simple-design Holds exactly what a billboard renderer draws: a stable index for keying, a world position, a size, an opacity and the age ratio, with no velocity or history fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fields are recomputed rather than integrated frame to frame, so no accumulated drift is corrected after the fact and no renderer is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the index numbering of burst and regular spawns, the motion terms that move the position, the meter units, the opacity fade law, and the half-open range of the age ratio.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record without behavior; the per-particle hashing cost belongs to `sampleCompiledEffect`, which builds one of these per live spawn.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each sample recreates its particles from the seed, and since a particle depends on the sampled time no earlier particle can stand in for a later one.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns one position vector and four numbers; the containing sample's list owns it and is bounded by the recipe's particle budget.
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

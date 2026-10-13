import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One live decorative spray particle at the sampled step, as `sampleFluidSpray`
 * places it.
 *
 * The viewer's `buildFluidSprayObject` uploads `position`, `size` and
 * `ageRatio` as point attributes without changing them.
 *
 * @evidence contracts/common.md#principled-implementation `sampleFluidSpray` fills each particle from the emitter's seeded jitter at `index` and the age `time - index / rate`, so the record is the closed-form ballistic position at that age rather than an integrated one.
 * @evidence contracts/common.md#clear-and-simple-design The record holds the emitter id and spawn index for identity plus exactly the three values a point renderer draws, with velocity and direction left as sampling internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `size` is copied from the emitter rather than scaled by age or distance, so any fading or attenuation is a renderer choice made from `ageRatio`, not a second engine opinion.
 * @evidence contracts/common.md#meaningful-documentation States the producer and the viewer consumer; members give identity scope, spawn-time meaning of the index, world units, and the half-open range of the age ratio.
 * @author Samchon
 */
export interface IAutoMovieFluidSprayParticle {
  /** Id of the emitter that spawned it. */
  spray: string;

  /**
   * Stable zero-based spawn identity within that emitter; the particle launched
   * at `index / rate` domain-clock seconds.
   */
  index: number;

  /** World position in metres at the sampled step, on its ballistic arc. */
  position: IAutoMovieVector3;

  /** World billboard size in metres, copied from the emitter. */
  size: number;

  /** Age divided by the emitter's `lifetime`, in `[0, 1)`. */
  ageRatio: number;
}

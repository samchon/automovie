import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One live decorative spray particle at the sampled step, as `sampleFluidSpray`
 * places it.
 *
 * @author Samchon
 */
export interface IAutoMovieFluidSprayParticle {
  /** Id of the emitter that spawned it. */
  spray: string;

  /**
   * Stable zero-based spawn identity within that emitter; the particle launched
   * at `index / rate` seconds.
   */
  index: number;

  /** World position in metres at the sampled step, on its ballistic arc. */
  position: IAutoMovieVector3;

  /** World billboard size in metres, copied from the emitter. */
  size: number;

  /** Age divided by the emitter's `lifetime`, in `[0, 1)`. */
  ageRatio: number;
}

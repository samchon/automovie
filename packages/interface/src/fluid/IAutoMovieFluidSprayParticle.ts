import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One live decorative spray particle. */
export interface IAutoMovieFluidSprayParticle {
  /** Emitter that spawned it. */
  spray: string;

  /** Stable zero-based spawn identity within that emitter. */
  index: number;

  /** World position at the sampled step. */
  position: IAutoMovieVector3;

  /** World billboard size in metres. */
  size: number;

  /** Normalized lifetime progress in `[0, 1)`. */
  ageRatio: number;
}

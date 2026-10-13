import { IAutoMovieVector3 } from "@automovie/interface";

/** One exact live billboard derived from a compiled effect stream. */
export interface IAutoMovieEffectParticle {
  /** Stable zero-based spawn identity. */
  index: number;
  /** Fixed-step sampled world position. */
  position: IAutoMovieVector3;
  /** World billboard size in meters. */
  size: number;
  /** Bounded sampled alpha. */
  opacity: number;
  /** Normalized lifetime progress. */
  ageRatio: number;
}

import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One bounded decorative spray emitter: the mist of a fountain jet or the
 * curtain at the foot of a water wall.
 *
 * Spray is deterministic from `seed` and the particle index alone, so seeking
 * to a time reproduces the same particles regardless of what was sampled
 * before, and it is bounded twice: by `maxParticles` and by distance thinning.
 */
export interface IAutoMovieFluidSpray {
  /** Stable emitter identity within the domain. */
  id: string;

  /** Cell column the emitter sits in; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row the emitter sits in; `0 <= row < grid.rows`. */
  row: number;

  /** Particles spawned per second; strictly positive. */
  rate: number;

  /** Particle lifetime in seconds; strictly positive. */
  lifetime: number;

  /** Launch speed in m/s along {@link direction}; `>= 0`. */
  speed: number;

  /** Launch direction; must not be the zero vector and need not be unit. */
  direction: IAutoMovieVector3;

  /**
   * Symmetric per-axis jitter added to the normalized launch direction, in the
   * closed range `[0, 1]`. `0` emits a perfectly collimated jet.
   */
  spread: number;

  /** World billboard size of one particle in metres; strictly positive. */
  size: number;

  /** Deterministic seed; any safe integer. */
  seed: number;

  /** Hard cap on simultaneously live particles; a positive integer. */
  maxParticles: number;

  /**
   * Camera distance in metres past which the live set is deterministically
   * thinned; strictly positive.
   */
  lodDistance: number;
}

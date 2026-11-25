import type { IAutoMovieWorldBounds } from "./IAutoMovieWorldBounds";

/**
 * Named deterministic effect region binding a world-meter volume to a declared
 * recipe and seed.
 */
export interface IAutoMovieWorldEffectZone {
  /** Stable zone id. */
  id: string;

  /** Existing deterministic effect recipe id. */
  recipe: string;

  /** World-space volume. */
  bounds: IAutoMovieWorldBounds;

  /** Explicit non-negative safe-integer deterministic zone seed. */
  seed: number;
}

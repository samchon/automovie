import { IAutoMovieWorldBounds } from "./IAutoMovieWorldBounds";

/** An axis-aligned world-space effect volume. */
export interface IAutoMovieWorldEffectZone {
  /** Stable zone id. */
  id: string;

  /** Existing deterministic effect recipe id. */
  recipe: string;

  /** World-space volume. */
  bounds: IAutoMovieWorldBounds;

  /** Explicit deterministic zone seed. */
  seed: number;
}

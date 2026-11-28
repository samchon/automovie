/**
 * Horizontal position in world metres for selecting a ground surface or
 * sampling its height.
 */
export interface IAutoMovieGroundQueryPoint {
  /** Finite X in the world metre frame of the queried footprint or heightfield. */
  x: number;

  /** Finite Z in that same world metre frame. */
  z: number;
}

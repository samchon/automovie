/**
 * Non-negative half-extents of a planting cluster's world-XZ placement
 * rectangle.
 */
export interface IAutoMoviePlantingExtent {
  /** Half-extent along world `x` in metres; `>= 0`. */
  x: number;

  /** Half-extent along world `z` in metres; `>= 0`. */
  z: number;
}

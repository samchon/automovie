/** Half-extent of a placement rectangle on the ground plane. */
export interface IAutoMoviePlantingExtent {
  /** Half-extent along world `x` in metres; `>= 0`. */
  x: number;

  /** Half-extent along world `z` in metres; `>= 0`. */
  z: number;
}

/** A constant chord from a join's curve to one rail. */
export interface IAutoMovieConstructionChord {
  /** Discriminator. */
  type: "chord";

  /** The chord, metres, positive. */
  value: number;
}

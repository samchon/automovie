import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A one-handed greeting that lifts and reseats a hat already worn on this
 * performer's head. Register `tipHat` as a law and pass these parameters.
 */
export interface IAutoMovieMotionHumanTipHat {
  /** The scene id of the hat declared worn on the performer's head. */
  prop: string;

  /** The free hand that takes the brim. Defaults to the right hand. */
  hand?: AutoMovieHumanSide;
}

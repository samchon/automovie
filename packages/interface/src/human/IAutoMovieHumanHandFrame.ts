import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** The hand's frame on its knuckles. */
export interface IAutoMovieHumanHandFrame {
  /** Wrist centre to knuckle III. */
  along: AutoMovieVector3Tuple;

  /** Knuckle V toward II, square to `along`. */
  across: AutoMovieVector3Tuple;

  /** Toward the palm, square to both. */
  palmar: AutoMovieVector3Tuple;
}

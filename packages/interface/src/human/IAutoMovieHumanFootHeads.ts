import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanFootHeads; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootHeads {
  /** The heads and their mean. */
  export interface IHeads {
    /** Head centres, hallux first, left frame. */
    heads: AutoMovieVector3Tuple[];

    /** Mean of the heads, left frame. */
    ball: AutoMovieVector3Tuple;
  }
}

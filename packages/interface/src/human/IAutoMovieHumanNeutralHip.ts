import type { AutoMovieQuaternionTuple } from "../geometry/AutoMovieQuaternionTuple";

/**
 * A hip's world rotation from bind and its clinical resting abduction in
 * degrees. Runtime construction and admission remain with
 * AutoMovieHumanNeutralHip in Human.
 */
export namespace IAutoMovieHumanNeutralHip {
  /** One hip's neutral. */
  export interface IOutput {
    /** The thigh's world turn from the bind. */
    turn: AutoMovieQuaternionTuple;

    /** The abduction from the plumb line, degrees. */
    resting: number;
  }
}

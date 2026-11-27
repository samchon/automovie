import type { AutoMovieQuaternionTuple } from "../geometry/AutoMovieQuaternionTuple";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * The shoulder's bind-to-neutral quaternion, downward unit direction and
 * resting abduction angle.
 *
 * The interface package owns these declarations; AutoMovieHumanNeutralShoulder
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanNeutralShoulder {
  /** One shoulder's neutral. */
  export interface IOutput {
    /** The upper arm's world turn from the bind. */
    turn: AutoMovieQuaternionTuple;

    /** The arm's unit direction at neutral, from the shoulder down. */
    down: AutoMovieVector3Tuple;

    /** The resting abduction from the plumb line, degrees. */
    resting: number;
  }
}

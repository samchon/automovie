import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanNeutralShoulder; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanNeutralShoulder {
  /** One shoulder's neutral.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One shoulder's neutral.
   * @evidence contracts/development/design.md#principled-representation `turn`: The upper arm's world turn from the bind. `down`: The arm's unit direction at neutral, from the shoulder down. `resting`: The resting abduction from the plumb line, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeutralShoulder.derive. Also types AutoMovieHumanNeutral.shoulder.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `turn`, `down`, `resting`; callers supply the complete record.
   */
  export interface IOutput {
    /** The upper arm's world turn from the bind. */
    turn: AutoMovieQuaternionTuple;

    /** The arm's unit direction at neutral, from the shoulder down. */
    down: AutoMovieVector3Tuple;

    /** The resting abduction from the plumb line, degrees. */
    resting: number;
  }
}

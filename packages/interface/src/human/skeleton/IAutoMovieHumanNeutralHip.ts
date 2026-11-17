import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";

/** Type contracts exchanged by AutoMovieHumanNeutralHip; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanNeutralHip {
  /** One hip's neutral.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One hip's neutral.
   * @evidence contracts/development/design.md#principled-representation `turn`: The thigh's world turn from the bind. `resting`: The abduction from the plumb line, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeutralHip.derive. Also types AutoMovieHumanNeutral.hip, AutoMovieHumanNeutralHip.plumb.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `turn`, `resting`; callers supply the complete record.
   */
  export interface IOutput {
    /** The thigh's world turn from the bind. */
    turn: AutoMovieQuaternionTuple;

    /** The abduction from the plumb line, degrees. */
    resting: number;
  }
}

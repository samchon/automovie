import type { IAutoMovieHumanArmRootOval } from "./IAutoMovieHumanArmRootOval";
import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";

/** Type contracts exchanged by AutoMovieHumanShoulderRing; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanShoulderRing {
  /** What a shoulder ring reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a shoulder ring reads.
   * @evidence contracts/development/design.md#principled-representation `column`: The torso's column through the shoulders. `line`: The trapezius line, from the shoulder point to the neck's ring. `oval`: The arm's ellipse and its cap.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanShoulderRing.wall, AutoMovieHumanShoulderRing.controls. Also types AutoMovieHumanTrunkChains.shoulder.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `column`, `line`, `oval`, `axilla`; callers supply the complete record.
   */
  export interface IInput {
    /** The torso's column through the shoulders. */
    column: IAutoMovieHumanTrunkColumn.IColumn;

    /** The trapezius line, from the shoulder point to the neck's ring. */
    line: IAutoMovieHumanShoulderOutline;

    /** The arm's ellipse and its cap. */
    oval: IAutoMovieHumanArmRootOval.IInput;

    /** Height of the axilla, the ring's bottom, mm. */
    axilla: number;
  }
}

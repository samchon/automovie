import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";

/** Type contracts exchanged by AutoMovieHumanShoulderGirdle; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanShoulderGirdle {
  /** What the girdle reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the girdle reads.
   * @evidence contracts/development/design.md#principled-representation `column`: The torso's column through the shoulders. `line`: The trapezius line, from the shoulder point to the neck's ring.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanShoulderGirdle.section.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `column`, `line`; callers supply the complete record.
   */
  export interface IInput {
    /** The torso's column through the shoulders. */
    column: IAutoMovieHumanTrunkColumn.IColumn;

    /** The trapezius line, from the shoulder point to the neck's ring. */
    line: IAutoMovieHumanShoulderOutline;
  }
}

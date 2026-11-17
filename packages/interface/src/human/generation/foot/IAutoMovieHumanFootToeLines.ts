import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanFootToeLines; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootToeLines {
  /** A toe's line.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A toe's line.
   * @evidence contracts/development/design.md#principled-representation `head`: Metatarsal head centre, left frame. `tip`: The apex, left frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootToeLines.of. Read by AutoMovieHumanFootToeJoints.of, AutoMovieHumanFootToeSpacing.limit. Also types AutoMovieHumanFootBones.lines, AutoMovieHumanFootToeBreadth.neighbours.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `head`, `tip`; callers supply the complete record.
   */
  export interface ILine {
    /** Metatarsal head centre, left frame. */
    head: AutoMovieVector3Tuple;

    /** The apex, left frame. */
    tip: AutoMovieVector3Tuple;
  }
}

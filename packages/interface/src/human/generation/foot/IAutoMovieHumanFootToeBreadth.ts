import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/** Type contracts exchanged by AutoMovieHumanFootToeBreadth; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootToeBreadth {
  /** What the breadth reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the breadth reads.
   * @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `lines`: Every toe's line, hallux first. `index`: Which toe, 0 for the hallux.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootToeBreadth.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `lines`, `index`; callers supply the complete record.
   */
  export interface IInput {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** Every toe's line, hallux first. */
    lines: readonly IAutoMovieHumanFootToeLines.ILine[];

    /** Which toe, 0 for the hallux. */
    index: number;
  }

  /** A toe's line and breadth.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A toe's line and breadth.
   * @evidence contracts/development/design.md#principled-representation `head`: Metatarsal head centre, left frame. `tip`: The apex. `length`: The line's length, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootToeBreadth.of. Read by AutoMovieHumanFootToeCap.of, AutoMovieHumanFootToeRoot.of. Also types AutoMovieHumanFootToeSpan.breadth.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `head`, `tip`, `length`, `tangent`, `pointAt`, `shape`, `half`; callers supply the complete record.
   */
  export interface IBreadth {
    /** Metatarsal head centre, left frame. */
    head: AutoMovieVector3Tuple;

    /** The apex. */
    tip: AutoMovieVector3Tuple;

    /** The line's length, mm. */
    length: number;

    /** Unit direction of the line toward the tip. */
    tangent: AutoMovieVector3Tuple;

    /** The point at a length along the line. */
    pointAt: (s: number) => AutoMovieVector3Tuple;

    /** The toe's own half breadth at a length along the line, mm, before the neighbours. */
    shape: (s: number) => number;

    /** The half breadth at a length along the line, mm. */
    half: (s: number) => number;
  }
}

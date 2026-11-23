import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/**
 * Toe-line geometry and independent versus neighbour-constrained half-breadth readers. Runtime construction and admission remain with AutoMovieHumanFootToeBreadth in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes toe-line geometry and independent versus neighbour-constrained half-breadth readers; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Toe-line geometry and independent versus neighbour-constrained half-breadth readers. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanFootToeBreadth; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing FootToeBreadth contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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

    /**
     * The point at a length along the line.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The point at a length along the line.
     */
    pointAt: (s: number) => AutoMovieVector3Tuple;

    /**
     * The toe's own half breadth at a length along the line, mm, before the neighbours.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The toe's own half breadth at a length along the line, mm, before the neighbours.
     */
    shape: (s: number) => number;

    /**
     * The half breadth at a length along the line, mm.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The half breadth at a length along the line, mm.
     */
    half: (s: number) => number;
  }
}

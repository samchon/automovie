import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/**
 * Toe-line geometry and independent versus neighbour-constrained half-breadth
 * readers. Runtime construction and admission remain with
 * AutoMovieHumanFootToeBreadth in Human.
 */
export namespace IAutoMovieHumanFootToeBreadth {
  /** What the breadth reads. */
  export interface IInput {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** Every toe's line, hallux first. */
    lines: readonly IAutoMovieHumanFootToeLines.ILine[];

    /** Which toe, 0 for the hallux. */
    index: number;
  }

  /** A toe's line and breadth. */
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

    /**
     * The toe's own half breadth at a length along the line, mm, before the
     * neighbours.
     */
    shape: (s: number) => number;

    /** The half breadth at a length along the line, mm. */
    half: (s: number) => number;
  }
}

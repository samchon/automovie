import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/**
 * Type contracts exchanged by AutoMovieHumanFootToeSpan; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootToeSpan {
  /** A toe on its line, left frame. */
  export interface IToe {
    /** Chain name; `{side}` stands for the side. */
    name: string;

    /** Control points of a section. */
    order: number;

    /** Sections of the toe's chain (`AutoMovieHumanFootToeStations`). */
    sections: number;

    /** Metatarsal head centre, the line's start. */
    head: AutoMovieVector3Tuple;

    /** Unit direction of the line toward the tip. */
    tangent: AutoMovieVector3Tuple;

    /**
     * Half breadth, dorsal half depth and plantar half depth in millimetres at
     * line distance s in millimetres; values past cap retain the cap's
     * section.
     */
    size: (s: number) => [number, number, number];

    /** Length along the line of the first own section. */
    first: number;

    /** Length along the line where the tip starts to close. */
    cap: number;

    /** The apex. */
    pole: AutoMovieVector3Tuple;

    /** The foot's lateral direction. */
    lateral: AutoMovieVector3Tuple;

    /** Its nail plate along the line: root and free edge lengths, and width, mm. */
    nail: {
      /** Proximal nail-plate station along the digit's centre line, millimetres. */
      root: number;
      /**
       * Free nail edge at the distal cap's start, millimetres along the digit's
       * centre line.
       */
      edge: number;
      /** Nail plate's full transverse width, millimetres. */
      width: number;
    };
  }

  /** What a toe's span reads. */
  export interface IInput {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** Every toe's line, hallux first. */
    lines: readonly IAutoMovieHumanFootToeLines.ILine[];

    /** Which toe, 0 for the hallux. */
    index: number;
  }
}

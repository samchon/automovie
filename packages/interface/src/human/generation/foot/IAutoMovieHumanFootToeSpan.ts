import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/** Type contracts exchanged by AutoMovieHumanFootToeSpan; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootToeSpan {
  /** A toe on its line, left frame.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A toe on its line, left frame.
   * @evidence contracts/development/design.md#principled-representation `name`: Chain name; `{side}` stands for the side. `order`: Control points of a section. `sections`: Sections of the toe's chain (`AutoMovieHumanFootToeStations`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootToeSpan.of. Read by AutoMovieHumanFootToeChain.of, AutoMovieHumanFootToeChain.nail, AutoMovieHumanFootToeStations.of. Also types AutoMovieHumanFootConstruction.toes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `order`, `sections`, `head`, `tangent`, `size`, `first`, `cap`, `pole`, `lateral`, `nail`; callers supply the complete record.
   */
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

    /** Half breadth, dorsal and plantar half depths at a length along the line. */
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
      /** Free nail edge at the distal cap's start, millimetres along the digit's centre line. */
      edge: number;
      /** Nail plate's full transverse width, millimetres. */
      width: number;
    };
  }

  /** What a toe's span reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a toe's span reads.
   * @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `lines`: Every toe's line, hallux first. `index`: Which toe, 0 for the hallux.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootToeSpan.of.
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
}

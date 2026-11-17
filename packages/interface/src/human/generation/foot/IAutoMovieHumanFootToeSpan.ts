import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootToeLines } from "./IAutoMovieHumanFootToeLines";

/**
 * Type contracts exchanged by AutoMovieHumanFootToeSpan; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanFootToeSpan exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IToe, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanFootToeSpan; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IToe, IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
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

    /**
     * Half breadth, dorsal half depth and plantar half depth in millimetres at line distance s in millimetres; values past cap retain the cap's section.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Half breadth, dorsal half depth and plantar half depth in millimetres at line distance s in millimetres; values past cap retain the cap's section.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanFootToeSpan owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootToeSpan.IToe.size declares the invocation boundary only; AutoMovieHumanFootToeSpan and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanFootToeSpan.IToe.size must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanFootToeSpan.IToe.size owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanFootToeSpan and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanFootToeSpan producer or caller supplying the callback owns captured state and its lifetime.
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

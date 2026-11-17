import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootConnection } from "./IAutoMovieHumanFootConnection";

/**
 * Type contracts exchanged by AutoMovieHumanFootDorsum; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanFootDorsum exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanFootDorsum; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanFootDorsum {
  /** The original constant-height foot chart and its shared ankle contact.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The original constant-height foot chart and its shared ankle contact.
   * @evidence contracts/development/design.md#principled-representation `part`: Original dorsal knots and domain, calibration mm; no neighbouring part is acquired. `heel`: Pternion plan position and foot-along direction. `along`: Unit foot-along direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootDorsum.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `heel`, `along`, `length`, `height`, `arch`, `ankle`; callers supply the complete record.
   */
  export interface IInput {
    /** Original dorsal knots and domain, calibration mm; no neighbouring part is acquired. */
    part: Pick<IAutoMovieViewPart, "front" | "stations">;
    /** Pternion plan position and foot-along direction. */
    heel: AutoMovieVector3Tuple;
    /** Unit foot-along direction. */
    along: AutoMovieVector3Tuple;
    /** Public foot length, mm. */
    length: number;
    /** Existing axis height, preserved to keep the floor and closing points. */
    height: number;
    /** Williams-McClay dorsum height at half foot length, mm. */
    arch: number;
    /** The actual complete leg source and its sagittal cut. */
    ankle: IAutoMovieHumanFootConnection.IAnkle;
  }
}

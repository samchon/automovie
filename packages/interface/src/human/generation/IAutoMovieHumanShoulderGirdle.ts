import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";

/**
 * The torso column and trapezius outline consumed by shoulder-girdle construction.
 *
 * The interface package owns these declarations; AutoMovieHumanShoulderGirdle in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The torso column and trapezius outline consumed by shoulder-girdle construction. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanShoulderGirdle exchanges the named IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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

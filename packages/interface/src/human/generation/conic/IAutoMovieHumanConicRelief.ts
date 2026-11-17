/**
 * Named reflected relief nets whose phase window and directions belong to the reflected instance. Runtime construction and admission remain with AutoMovieHumanConicRelief in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes named reflected relief nets whose phase window and directions belong to the reflected instance; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Named reflected relief nets whose phase window and directions belong to the reflected instance. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanConicRelief; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing ConicRelief contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanConicRelief {
  /** A net stored as the reflection of an earlier one of its family's list.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A net stored as the reflection of an earlier one of its family's list.
   * @evidence contracts/development/design.md#principled-representation `name`: The twin's own name. `twin`: The name of the net it reflects, which stands before it in the list. `phases`: The twin's own phase window, radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanConicRelief.twin, AutoMovieHumanConicRelief.list.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `turn`: The twin's own turning direction; present exactly when the original has one.
   */
  export interface ITwin {
    /** The twin's own name. */
    name: string;

    /** The name of the net it reflects, which stands before it in the list. */
    twin: string;

    /** The twin's own phase window, radians. */
    phases: [number, number];

    /** The twin's own unit direction of height. */
    axis: [number, number, number];

    /** The twin's own turning direction; present exactly when the original has one. */
    turn?: [number, number, number];
  }
}

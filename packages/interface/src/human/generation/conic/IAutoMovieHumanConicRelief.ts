/** Type contracts exchanged by AutoMovieHumanConicRelief; runtime evaluation remains in Human. */
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

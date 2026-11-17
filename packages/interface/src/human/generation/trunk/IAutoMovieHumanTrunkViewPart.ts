/** Type contracts exchanged by AutoMovieHumanTrunkViewPart; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkViewPart {
  /**
   * The trunk's retained upper scalar-support datum, on the head axis above
   * the regular connection, in calibration millimetres. A shared connection
   * excludes it from the actual part domain without changing the source clock.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The trunk's retained upper scalar-support datum, on the head axis above the regular connection, in calibration millimetres.
   * @evidence contracts/development/design.md#principled-representation `x`: Forward place of the head mass's axis, mm. `y`: Height inside the head mass's neck domain, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkViewPart.create, AutoMovieHumanTrunkViewPart.define.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `x`, `y`; callers supply the complete record.
   */
  export interface ITop {
    /** Forward place of the head mass's axis, mm. */
    x: number;

    /** Height inside the head mass's neck domain, mm. */
    y: number;
  }
}

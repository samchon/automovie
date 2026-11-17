/**
 * The upper head-axis support datum retained outside the trunk's regular connection domain.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkViewPart in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The upper head-axis support datum retained outside the trunk's regular connection domain. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only ITop declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation ITop separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanTrunkViewPart exchanges the named ITop contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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

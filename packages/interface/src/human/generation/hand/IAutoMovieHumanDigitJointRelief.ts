/**
 * Arc-length location, window half-width and section radius for a digit-joint relief.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitJointRelief in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Arc-length location, window half-width and section radius for a digit-joint relief. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanDigitJointRelief exchanges the named IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanDigitJointRelief {
  /** A joint's fixed inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A joint's fixed inputs.
   * @evidence contracts/development/design.md#principled-representation `at`: Arc length of the joint's centre along the digit's line, mm. `half`: Half extent of the window along the line, mm; the joint's turn half-length is the natural size. `radius`: The joint's radius, mm: the mean of the section's half width and depth there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitJointRelief.height, AutoMovieHumanDigitJointRelief.slope. Also types AutoMovieHumanDigitProfile.reliefs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `half`, `radius`; callers supply the complete record.
   */
  export interface IInput {
    /** Arc length of the joint's centre along the digit's line, mm. */
    at: number;

    /** Half extent of the window along the line, mm; the joint's turn half-length is the natural size. */
    half: number;

    /** The joint's radius, mm: the mean of the section's half width and depth there. */
    radius: number;
  }
}

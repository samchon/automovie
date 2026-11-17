/**
 * Skin depth and outward slope at the outer edge of a generated lid band.
 *
 * The interface package owns these declarations; AutoMovieHumanEyelidProfile in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Skin depth and outward slope at the outer edge of a generated lid band. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IGenerateSkin declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IGenerateSkin separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanEyelidProfile exchanges the named IGenerateSkin contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanEyelidProfile {
  /** The skin argument of AutoMovieHumanEyelidProfile.generate. One column of the lid band, outer edge excluded: anterior surface,
  rounded anterior edge, margin face, posterior edge and tuck.
  @param s Lid sample
  @param g Seated globe
  @param band Band width, mm
  @param skin Skin depth relative to the globe centre at the band's
    outer edge, and its slope per mm outward
  @param drift Tangential offset of the cut vertex from the sample's smooth
    outward line, which the anterior surface loses toward the margin
  @returns Row points in mm
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One column of the lid band, outer edge excluded: anterior surface, rounded anterior edge, margin face, posterior edge and tuck.
 * @evidence contracts/development/design.md#principled-representation `x`: Skin depth from the globe centre at the lid band's outer edge, millimetres. `k`: Derivative of skin depth per millimetre outward at that band edge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanEyelidProfile.IGenerateSkin is the canonical exchange used by AutoMovieHumanEyelidProfile.generate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `x`, `k`; callers supply the complete record.
 */
  export type IGenerateSkin = {
    /** Skin depth from the globe centre at the lid band's outer edge, millimetres. */
    x: number;
    /** Derivative of skin depth per millimetre outward at that band edge. */
    k: number;
  };
}

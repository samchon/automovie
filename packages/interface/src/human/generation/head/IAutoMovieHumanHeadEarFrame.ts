/**
 * Own-side auricle directions, public dimensions and relief scaling in calibration millimetres.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadEarFrame in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Own-side auricle directions, public dimensions and relief scaling in calibration millimetres. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IFrame declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IFrame separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadEarFrame exchanges the named IFrame contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadEarFrame {
  /** Own-side dimensions and orientation in calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Own-side dimensions and orientation in calibration mm.
   * @evidence contracts/development/design.md#principled-representation `n`: Outward side-outline normal at the selected tragion height. `a`: Unit sa-sba chord direction, upward. `b`: Forward unit direction perpendicular to a and n.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadEarFrame.of. Read by AutoMovieHumanHeadEarPlate.of. Also types AutoMovieHumanHeadCanonical.frame, AutoMovieHumanHeadEarParts.f.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `n`, `a`, `b`, `top`, `bottom`, `length`, `breadth`, `protrusion`, `scale`, `sign`; callers supply the complete record.
   */
  export interface IFrame {
    /** Outward side-outline normal at the selected tragion height. */
    n: [number, number, number];
    /** Unit sa-sba chord direction, upward. */
    a: [number, number, number];
    /** Forward unit direction perpendicular to a and n. */
    b: [number, number, number];
    /** Selected highest superaurale height. */
    top: number;
    /** Lowest subaurale height, top - length*a.y. */
    bottom: number;
    /** Public sa-sba chord length. */
    length: number;
    /** Public c-j chord length. */
    breadth: number;
    /** Public scalp-to-rim distance at the tragal level. */
    protrusion: number;
    /** Retained relief-row scale, world breadth/31 mm. */
    scale: number;
    /** Own side, positive left and negative right. */
    sign: 1 | -1;
  }
}

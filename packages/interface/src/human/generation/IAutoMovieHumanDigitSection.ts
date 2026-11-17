/**
 * Digit half-extents, normalized curvatures and planar section controls in phase order. Runtime construction and admission remain with AutoMovieHumanDigitSection in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes digit half-extents, normalized curvatures and planar section controls in phase order; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Digit half-extents, normalized curvatures and planar section controls in phase order. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanDigitSection; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing DigitSection contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanDigitSection {
  /** A section's shape, millimetres and normalised constants.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section's shape, millimetres and normalised constants.
   * @evidence contracts/development/design.md#principled-representation `width`: Half width across the digit, from the bone to either side point. `palmar`: Depth of the palmar half from the bone to its apex. `dorsal`: Depth of the dorsal half from the bone to its apex.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDigitProfile.of, AutoMovieHumanDigitSpan.shape. Read by AutoMovieHumanDigitSection.controls, AutoMovieHumanDigitSection.knots, AutoMovieHumanDigitSection.girth. Also types AutoMovieHumanDigitProfile.shape, AutoMovieHumanHandDigitBones.shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `width`, `palmar`, `dorsal`, `side`, `palmarApex`, `dorsalApex`; callers supply the complete record.
   */
  export interface IShape {
    /** Half width across the digit, from the bone to either side point. */
    width: number;

    /** Depth of the palmar half from the bone to its apex. */
    palmar: number;

    /** Depth of the dorsal half from the bone to its apex. */
    dorsal: number;

    /** Curvature at the side points times the half width, `kappa_s w`. */
    side: number;

    /** Palmar apex curvature over the half ellipse's, `rho_p`. */
    palmarApex: number;

    /** Dorsal apex curvature over the half ellipse's, `rho_d`. */
    dorsalApex: number;
  }

  /**
   * Ordered planar [b, n] control points in millimetres, sampled at phases 2*pi*m/count from the radial side toward the palm. These are spline controls, not on-curve samples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Ordered planar [b, n] control points in millimetres, sampled at phases 2*pi*m/count from the radial side toward the palm. These are spline controls, not on-curve samples.
   * @evidence contracts/development/design.md#principled-representation Ordered planar [b, n] control points in millimetres, sampled at phases 2*pi*m/count from the radial side toward the palm. These are spline controls, not on-curve samples.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitSection.ControlsResult is the canonical exchange used by AutoMovieHumanDigitSection.controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanDigitSection input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type ControlsResult = [number, number][];

  /**
   * On-curve planar [b, n] knot samples in millimetres from the same uniform cubic B-spline. Their uniform phases match the section controls so an interpolating consumer preserves the guide jets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation On-curve planar [b, n] knot samples in millimetres from the same uniform cubic B-spline. Their uniform phases match the section controls so an interpolating consumer preserves the guide jets.
   * @evidence contracts/development/design.md#principled-representation On-curve planar [b, n] knot samples in millimetres from the same uniform cubic B-spline. Their uniform phases match the section controls so an interpolating consumer preserves the guide jets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitSection.KnotsResult is the canonical exchange used by AutoMovieHumanDigitSection.knots.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanDigitSection input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type KnotsResult = [number, number][];
}

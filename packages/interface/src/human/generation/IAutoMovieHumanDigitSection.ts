/** Type contracts exchanged by AutoMovieHumanDigitSection; runtime evaluation remains in Human. */
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

  /** Result of AutoMovieHumanDigitSection.controls. The section's control points in its frame, `[b, n]` per control point,
  phase `2 pi m / count` from the radial side point toward the palm.
  @param count Control points, a multiple of 2 with at least four spans per half.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The section's control points in its frame, `[b, n]` per control point, phase `2 pi m / count` from the radial side point toward the palm.
 * @evidence contracts/development/design.md#principled-representation The section's control points in its frame, `[b, n]` per control point, phase `2 pi m / count` from the radial side point toward the palm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitSection.ControlsResult is the canonical exchange used by AutoMovieHumanDigitSection.controls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitSection.controls for the section's control points in its frame, `[b, n]` per control point, phase `2 pi m / count` from the radial side point toward the palm.
 */
  export type ControlsResult = [number, number][];

  /** Result of AutoMovieHumanDigitSection.knots. Points of the section at its knots, `[b, n]`, phase `2 pi m / count`:
  the uniform cubic B-spline of {@link controls} evaluated where an
  interpolating consumer reads it back, so the guides' jets survive the
  interpolation exactly.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Points of the section at its knots, `[b, n]`, phase `2 pi m / count`: the uniform cubic B-spline of {@link controls} evaluated where an interpolating consumer reads it back, so the guides' jets survive the interpolation exactly.
 * @evidence contracts/development/design.md#principled-representation Points of the section at its knots, `[b, n]`, phase `2 pi m / count`: the uniform cubic B-spline of {@link controls} evaluated where an interpolating consumer reads it back, so the guides' jets survive the interpolation exactly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitSection.KnotsResult is the canonical exchange used by AutoMovieHumanDigitSection.knots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitSection.knots for points of the section at its knots, `[b, n]`, phase `2 pi m / count`: the uniform cubic B-spline of {@link controls} evaluated where an interpolating consumer reads it back, so the guides' jets survive the interpolation exactly.
 */
  export type KnotsResult = [number, number][];
}

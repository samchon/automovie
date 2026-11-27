/**
 * Digit half-extents, normalized curvatures and planar section controls in
 * phase order. Runtime construction and admission remain with
 * AutoMovieHumanDigitSection in Human.
 */
export namespace IAutoMovieHumanDigitSection {
  /** A section's shape, millimetres and normalised constants. */
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
   * Ordered planar [b, n] control points in millimetres, sampled at phases
   * 2_pi_m/count from the radial side toward the palm. These are spline
   * controls, not on-curve samples.
   */
  export type ControlsResult = [number, number][];

  /**
   * On-curve planar [b, n] knot samples in millimetres from the same uniform
   * cubic B-spline. Their uniform phases match the section controls so an
   * interpolating consumer preserves the guide jets.
   */
  export type KnotsResult = [number, number][];
}

/**
 * Area integrals of a strongest-site compact radial field on a convex plane
 * region.
 *
 * All coordinates and radius share one caller-selected length unit; scalar
 * integral and area have squared units, and integrated gradient has length
 * units. The producer admits dense finite coordinates, positive representable
 * radius and powers 2 or 3, with at most 512 sites; convexity remains a premise
 * and finite precision is not a certified bound.
 */
export namespace IAutoMovieIntegrateRadialField {
  /**
   * Area integrals before any image quantization or material layering; fields
   * retain the caller's coordinate units.
   */
  export interface IOutput {
    /**
     * Area integral of max(0, strongest q)^power, in squared coordinate units;
     * finite roundoff is clamped to [0,area]. Zero for no sites or a degenerate
     * footprint.
     */
    integral: number;

    /**
     * Fresh two-component integral of the physical planar gradient in the
     * polygon's first and second axes, in coordinate length units; not an
     * area-normalized average.
     */
    gradient: [number, number];

    /**
     * Absolute polygon area in squared coordinate units, independent of site
     * coverage; zero for an area-free footprint.
     */
    area: number;
  }

  /**
   * A strongest-site equal-radius compact radial field and its convex
   * integration domain.
   *
   * Coordinates and radius use one common unit in an orthonormal plane frame;
   * each site's z is its signed distance from that plane. The scalar is the
   * strongest positive sphere section q^power, where q=1-distance²/radius².
   * Equal radii make the strongest site a nearest-site half-plane partition.
   * Green's theorem reduces each cell's radial polynomial to edge integrals:
   * four-point Gauss-Legendre is exact for the interior degree-six polynomial
   * in real arithmetic, and the exterior zero-divergence flux uses a signed
   * angle. The returned gradient is the area integral of that scalar's physical
   * planar derivative, not a normal-map or BRDF average.
   *
   * The caller supplies the actual convex domain, rather than an extrapolation
   * from a smaller domain. This operation neither enumerates sites nor chooses
   * an application-specific field scale or eligibility. At most 512 sites bound
   * quadratic cell clipping; larger requests fail explicitly. Floating-point
   * cancellation near tangent circles or nearly coincident sites remains finite
   * precision, not a directed-rounding certificate. Degenerate footprints
   * return zero after input admission.
   *
   * Input collections are borrowed and unchanged. The implementation validates
   * dense finite entries, radius arithmetic and the site cap; convexity and an
   * orthonormal frame are caller premises, not measured by this operation.
   */
  export type IProps = {
    /**
     * Convex finite footprint in the supplied orthonormal plane; either winding
     * is accepted.
     */
    polygon: readonly (readonly [number, number])[];

    /**
     * Borrowed dense list of at most 512 equal-radius sphere centres; empty
     * gives zero scalar and gradient integrals while preserving footprint
     * area.
     */
    sites: readonly {
      /**
       * Finite site centre along the plane's first axis, in the polygon's
       * coordinate unit.
       */
      x: number;

      /**
       * Finite site centre along the plane's second axis, in the polygon's
       * coordinate unit.
       */
      y: number;

      /**
       * Finite signed perpendicular distance from the plane, in the same
       * coordinate unit; either sign gives the same sphere section.
       */
      z: number;
    }[];

    /** Strictly positive finite common support radius in that coordinate unit. */
    radius: number;

    /**
     * Supported compact radial polynomial exponent; these two degrees use the
     * exact interior quadrature rule.
     */
    power: 2 | 3;
  };
}

import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/** Wrapped section-curve evaluator and its natural equal-span count. */
export namespace IAutoMovieParameterizeSweepSection {
  /**
   * Parameterize a section curve over one closed parameter interval.
   *
   * The parameter `t` runs over `[0, 1)` and wraps; the curve is split into
   * equal parameter spans, one per segment. A superellipse has four, one per
   * quadrant, its angle parameter `p = 2 pi t` as `IAutoMovieSweepSection`
   * defines. A B-spline has one per control point, evaluated with the uniform
   * cubic basis on the four control points around it (Piegl and Tiller, The
   * NURBS Book, 2nd ed., 1997, Section 2.2, for the uniform knot vector), so `t
   * = k / n` lies opposite control point `k`. A Bezier curve has one per
   * anchor, evaluated with the cubic Bernstein basis. A polygon has one per
   * side, linear between corners, so `t = k / n` is corner `k` exactly. Radial
   * sections are read by direction instead and are not accepted here.
   */
  export type IResult = {
    /**
     * Evaluate finite t modulo one; returns a new mutable metre point in
     * section x/y axes. The compiled closure retains authored
     * point/axis/exponent data, so keep the section immutable. This is curve
     * parameter, not generally polar angle or arc-length share.
     */
    point: (t: number) => IAutoMovieSweepSection.IPoint;

    /**
     * Equal parameter spans in one turn: four superellipse quadrants, one per
     * polygon side or B-spline control point, or one per three Bezier points.
     * Used to choose angular inversion walk density.
     */
    segments: number;
  };
}

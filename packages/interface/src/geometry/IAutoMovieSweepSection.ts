/**
 * One closed cross-section curve of a sweep, in the plane of its station.
 *
 * Coordinates are metres in the station's section plane: `x` along the plane's
 * first axis and `y` along its second, both measured from the spine point,
 * which is the section's origin. Under the sweep's default direction
 * correspondence a section is read as its radius at every polar angle about
 * that origin, so it must be star-shaped about it: every ray from the origin
 * crosses the curve exactly once; angles grow counterclockwise from `+x` toward
 * `+y`, and a curve must run that way. Under parameter correspondence a section
 * is read by its own parameter instead, so it need only be simple.
 *
 * The kinds cover the forms a section family needs: an analytic superellipse
 * with a half-axis and an exponent per quadrant for rounded or boxy, symmetric
 * or egg-shaped sections; a periodic cubic B-spline whose control polygon a
 * junction can share; a closed piecewise cubic Bezier for authored outlines
 * with tangents; a polygon for sections with corners; and radii at even angles
 * for sections composed from additive terms. A new kind joins the union with
 * its own evaluation and leaves the others unchanged.
 */
export type IAutoMovieSweepSection =
  | IAutoMovieSweepSection.ISuperellipse
  | IAutoMovieSweepSection.IBSpline
  | IAutoMovieSweepSection.IBezier
  | IAutoMovieSweepSection.IPolygon
  | IAutoMovieSweepSection.IRadial;

/** Data and callback contracts shared by the SweepSection operations. */
export namespace IAutoMovieSweepSection {
  /** Exponents for the quadrants in counterclockwise order from `+x +y`. */
  export interface IQuadrantExponents {
    /** Exponent in the upper-right (`+x +y`) quadrant. */
    upperRight: number;

    /** Exponent in the upper-left (`-x +y`) quadrant. */
    upperLeft: number;

    /** Exponent in the lower-left (`-x -y`) quadrant. */
    lowerLeft: number;

    /** Exponent in the lower-right (`+x -y`) quadrant. */
    lowerRight: number;
  }

  /** A point of a section plane. */
  export interface IPoint {
    /** Metres along the section plane's first axis. */
    x: number;

    /** Metres along the section plane's second axis. */
    y: number;
  }

  /**
   * A superellipse with its own half-axis and exponent in each quadrant.
   *
   * Quadrant `k` runs from angle `k * 90` degrees to `(k + 1) * 90`; in it the
   * curve is `x = c.x + a * sign(cos p) |cos p|^(2/n)`, `y = c.y + b * sign(sin
   * p) |sin p|^(2/n)` for its half-axes `a`, `b` and exponent `n`. Exponent 2
   * is an ellipse quadrant, larger values square it toward a rectangle's
   * corner, values toward 1 straighten it toward a diamond. Neighbouring
   * quadrants share a half-axis, so the curve is closed and meets each axis
   * with a tangent perpendicular to it.
   */
  export interface ISuperellipse {
    /** Discriminator. */
    type: "superellipse";

    /** Metres from the centre to the curve along `+x`, positive. */
    right: number;

    /** Metres from the centre to the curve along `+y`, positive. */
    up: number;

    /** Metres from the centre to the curve along `-x`, positive. */
    left: number;

    /** Metres from the centre to the curve along `-y`, positive. */
    down: number;

    /**
     * Exponent per quadrant, counterclockwise from `+x +y`: from 1 (straight)
     * through 2 (elliptic) to at most 20 (nearly square).
     */
    exponents: IAutoMovieSweepSection.IQuadrantExponents;

    /**
     * Offset of the centre from the spine point; omitted, the centre is the
     * spine point.
     */
    centre?: IAutoMovieSweepSection.IPoint;
  }

  /**
   * A closed uniform cubic B-spline: the curve approximates its control
   * polygon, which closes from the last point back to the first. Its points are
   * where a Catmull-Clark ring of the same control points converges, so a sweep
   * end can match a subdivision ring exactly.
   */
  export interface IBSpline {
    /** Discriminator. */
    type: "bspline";

    /** Control points, at least three, counterclockwise. */
    points: IAutoMovieSweepSection.IPoint[];
  }

  /**
   * A closed piecewise cubic Bezier curve.
   *
   * Points come in threes per segment: an anchor, the anchor's outgoing handle
   * and the next anchor's incoming handle; the next segment starts at the next
   * anchor, and the last segment ends at the first anchor.
   */
  export interface IBezier {
    /** Discriminator. */
    type: "bezier";

    /** Anchors and handles, a positive multiple of three, counterclockwise. */
    points: IAutoMovieSweepSection.IPoint[];
  }

  /**
   * A closed polygon, straight between its corners, for sections with corners
   * such as a profile, a moulding or a duct. Under parameter correspondence
   * corner `k` of one station meets corner `k` of the next, so a polygon need
   * not be star-shaped there and may be concave.
   */
  export interface IPolygon {
    /** Discriminator. */
    type: "polygon";

    /** Corners, at least three, a simple polygon. */
    points: IAutoMovieSweepSection.IPoint[];
  }

  /**
   * Radii at evenly spaced angles, the first along `+x`, joined by the periodic
   * C2 spline of `interpolateAutoMovieSpline`, with continuous curvature and
   * the spline's sampled overshoot policy. Positive inputs need not give
   * positive interpolation; the section sampler refuses a non-positive or
   * non-finite sampled radius.
   */
  export interface IRadial {
    /** Discriminator. */
    type: "radial";

    /**
     * Metres from the spine point at angles `2 pi k / radii.length`, at least
     * three, positive.
     */
    radii: number[];
  }
}

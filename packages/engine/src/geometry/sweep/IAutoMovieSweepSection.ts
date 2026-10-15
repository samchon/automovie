/**
 * One closed cross-section curve of a sweep, in the plane of its station.
 *
 * Coordinates are metres in the station's section plane: `x` along the plane's
 * first axis and `y` along its second, both measured from the spine point,
 * which is the section's origin. Under the sweep's default direction
 * correspondence a section is read as its radius at every polar angle about
 * that origin, so it must be star-shaped about it: every ray from the origin
 * crosses the curve exactly once; angles grow counterclockwise from `+x`
 * toward `+y`, and a curve must run that way. Under parameter correspondence
 * a section is read by its own parameter instead, so it need only be simple.
 *
 * The kinds cover the forms a section family needs: an analytic superellipse
 * with a half-axis and an exponent per quadrant for rounded or boxy, symmetric
 * or egg-shaped sections; a periodic cubic B-spline whose control polygon a
 * junction can share; a closed piecewise cubic Bezier for authored outlines
 * with tangents; a polygon for sections with corners; and radii at even
 * angles for sections composed from additive terms. A new kind joins the
 * union with its own evaluation and leaves the others unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A closed union whose members are the standard closed-curve forms named in the lofting scope, read through one polar radius function, which makes sections of different kinds correspond by direction.
 * @evidence contracts/common.md#clear-and-simple-design One discriminated union instead of a section interface per kind; `parameterizeAutoMovieSweepSection` evaluates the curves and `sampleAutoMovieSweepSection` reads them by direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing converts one kind into another silently; a curve that is not star-shaped about its origin is refused by the sampler.
 * @evidence contracts/common.md#meaningful-documentation States the plane coordinates and unit, the origin, the star-shape requirement, the angle direction, and what each member is for.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; sampling cost is answered on `sampleAutoMovieSweepSection`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record read by the sweep compiler once per station.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its sweep.
 * @author Samchon
 */
export type IAutoMovieSweepSection =
  | IAutoMovieSweepSection.ISuperellipse
  | IAutoMovieSweepSection.IBSpline
  | IAutoMovieSweepSection.IBezier
  | IAutoMovieSweepSection.IPolygon
  | IAutoMovieSweepSection.IRadial;
export namespace IAutoMovieSweepSection {
  /**
   * A point of a section plane.
   *
   * @evidence contracts/common.md#principled-implementation A point of a section plane.
   * @evidence contracts/common.md#clear-and-simple-design Two coordinates.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are used as given.
   * @evidence contracts/common.md#meaningful-documentation States the axes and unit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `sampleAutoMovieSweepSection`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   * @author Samchon
   */
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
   * curve is `x = c.x + a * sign(cos p) |cos p|^(2/n)`, `y = c.y + b * sign(sin p) |sin p|^(2/n)` for its half-axes `a`, `b` and exponent `n`. Exponent 2 is an ellipse quadrant, larger values square it toward a rectangle's corner, values toward 1 straighten it toward a diamond. Neighbouring quadrants share a half-axis, so the curve is closed and meets each axis with a tangent perpendicular to it.
   *
   * @evidence contracts/common.md#principled-implementation A superellipse per quadrant, whose polar radius is closed-form when centred.
   * @evidence contracts/common.md#clear-and-simple-design Four half-axes, four exponents and an optional centre.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Half-axes and exponents out of range are refused.
   * @evidence contracts/common.md#meaningful-documentation States the quadrant formula and what the exponent does.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `sampleAutoMovieSweepSection`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   * @author Samchon
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
     * Exponent per quadrant, counterclockwise from `+x +y`: from 1 (straight) through 2 (elliptic) to at most 20 (nearly square).
     */
    exponents: [number, number, number, number];

    /** Offset of the centre from the spine point; omitted, the centre is the spine point. */
    centre?: IPoint;
  }

  /**
   * A closed uniform cubic B-spline: the curve approximates its control polygon, which closes from the last point back to the first. Its points are where a Catmull-Clark ring of the same control points converges, so a sweep end can match a subdivision ring exactly.
   *
   * @evidence contracts/common.md#principled-implementation A closed uniform cubic B-spline, the curve a Catmull-Clark ring converges to.
   * @evidence contracts/common.md#clear-and-simple-design Control points only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fewer than three points are refused.
   * @evidence contracts/common.md#meaningful-documentation States the closure and why it matches subdivision.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `sampleAutoMovieSweepSection`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   * @author Samchon
   */
  export interface IBSpline {
    /** Discriminator. */
    type: "bspline";

    /** Control points, at least three, counterclockwise. */
    points: IPoint[];
  }

  /**
   * A closed piecewise cubic Bezier curve.
   *
   * Points come in threes per segment: an anchor, the anchor's outgoing handle and the next anchor's incoming handle; the next segment starts at the next anchor, and the last segment ends at the first anchor.
   *
   * @evidence contracts/common.md#principled-implementation A closed piecewise cubic Bezier curve.
   * @evidence contracts/common.md#clear-and-simple-design Anchors and handles in threes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A point count not a multiple of three is refused.
   * @evidence contracts/common.md#meaningful-documentation States the point layout.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `sampleAutoMovieSweepSection`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   * @author Samchon
   */
  export interface IBezier {
    /** Discriminator. */
    type: "bezier";

    /** Anchors and handles, a positive multiple of three, counterclockwise. */
    points: IPoint[];
  }

  /**
   * A closed polygon, straight between its corners, for sections with corners such as a profile, a moulding or a duct. Under parameter correspondence corner `k` of one station meets corner `k` of the next, so a polygon need not be star-shaped there and may be concave.
   *
   * @evidence contracts/common.md#principled-implementation A closed polygon whose corners correspond by index under parameter correspondence.
   * @evidence contracts/common.md#clear-and-simple-design Corners only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fewer than three corners are refused.
   * @evidence contracts/common.md#meaningful-documentation States corner correspondence and concavity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `sampleAutoMovieSweepSection`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   * @author Samchon
   */
  export interface IPolygon {
    /** Discriminator. */
    type: "polygon";

    /** Corners, at least three, a simple polygon. */
    points: IPoint[];
  }

  /**
   * Radii at evenly spaced angles, the first along `+x`, joined by a periodic monotone interpolation, so a radius between two samples stays between their values.
   *
   * @evidence contracts/common.md#principled-implementation Radii at even angles joined by the periodic monotone scheme.
   * @evidence contracts/common.md#clear-and-simple-design One array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-positive radii are refused.
   * @evidence contracts/common.md#meaningful-documentation States the angle of each radius and the interpolation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its cost is answered on `sampleAutoMovieSweepSection`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its caller.
   * @author Samchon
   */
  export interface IRadial {
    /** Discriminator. */
    type: "radial";

    /** Metres from the spine point at angles `2 pi k / radii.length`, at least three, positive. */
    radii: number[];
  }
}

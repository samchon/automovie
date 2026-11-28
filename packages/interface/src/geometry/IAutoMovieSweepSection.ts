/**
 * Discriminated closed curve types for a local sweep section in metres.
 *
 * Direction correspondence needs a simple counterclockwise section admitting
 * one ray crossing at each direction. Parameter correspondence uses a curve's
 * own cyclic parameter and admits simple concave contours and holes.
 */
export type IAutoMovieSweepSection =
  | IAutoMovieSweepSection.ISuperellipse
  | IAutoMovieSweepSection.IBSpline
  | IAutoMovieSweepSection.IBezier
  | IAutoMovieSweepSection.IPolygon
  | IAutoMovieSweepSection.IRadial;

/** Named closed-curve variants and local point records for sweep sections. */
export namespace IAutoMovieSweepSection {
  /** Four exponent values in counterclockwise superellipse quadrant order. */
  export interface IQuadrantExponents {
    /** Finite exponent in [1, 20] for the positive X, positive Y quadrant. */
    upperRight: number;

    /** Finite exponent in [1, 20] for the negative X, positive Y quadrant. */
    upperLeft: number;

    /** Finite exponent in [1, 20] for the negative X, negative Y quadrant. */
    lowerLeft: number;

    /** Finite exponent in [1, 20] for the positive X, negative Y quadrant. */
    lowerRight: number;
  }

  /**
   * One pair of local section coordinates measured from the spine point in
   * metres.
   */
  export interface IPoint {
    /** Metres along the section's first axis from the spine point. */
    x: number;

    /** Metres along the section's second axis from the spine point. */
    y: number;
  }

  /**
   * Four positive signed-axis extents, four exponents and an optional centre
   * for one closed superellipse.
   *
   * For a quadrant parameter p, signed cosine and sine powers `2 / exponent`
   * are multiplied by the quadrant's metre half-axes. Quadrants share axis
   * intercepts and close about the supplied centre.
   */
  export interface ISuperellipse {
    /** Selects analytic superellipse quadrant evaluation. */
    type: "superellipse";

    /**
     * Positive finite distance from the centre to the positive X intercept, in
     * metres.
     */
    right: number;

    /**
     * Positive finite distance from the centre to the positive Y intercept, in
     * metres.
     */
    up: number;

    /**
     * Positive finite distance from the centre to the negative X intercept, in
     * metres.
     */
    left: number;

    /**
     * Positive finite distance from the centre to the negative Y intercept, in
     * metres.
     */
    down: number;

    /**
     * Quadrant powers in counterclockwise order. Two gives an ellipse and
     * higher values round toward a rectangle corner.
     */
    exponents: IAutoMovieSweepSection.IQuadrantExponents;

    /**
     * Optional finite local XY centre in metres. Omission places it at the
     * spine point.
     */
    centre?: IAutoMovieSweepSection.IPoint;
  }

  /**
   * Closed uniform cubic B-spline described by a cyclic control polygon.
   *
   * The uniform cubic control polygon gives the curve of a compatible
   * subdivision limit ring.
   */
  export interface IBSpline {
    /** Selects closed uniform cubic B-spline evaluation. */
    type: "bspline";

    /**
     * At least three finite section-plane controls in cyclic order, with the
     * closing connection implicit.
     */
    points: IAutoMovieSweepSection.IPoint[];
  }

  /**
   * Closed piecewise cubic B?zier with one anchor and two handle entries per
   * segment.
   */
  export interface IBezier {
    /** Selects periodic piecewise cubic B?zier evaluation. */
    type: "bezier";

    /**
     * Finite control entries in triples of anchor, outgoing handle and next
     * anchor's incoming handle, with a positive number of segments.
     */
    points: IAutoMovieSweepSection.IPoint[];
  }

  /** Closed simple polygon with explicit corners joined by straight sides. */
  export interface IPolygon {
    /** Selects piecewise-linear polygon evaluation. */
    type: "polygon";

    /**
     * At least three finite corners in boundary order. Supply a simple loop
     * with implicit closure.
     */
    points: IAutoMovieSweepSection.IPoint[];
  }

  /**
   * Closed section represented by positive metre radii sampled at even polar
   * directions.
   *
   * The tension selection scans for overshoot. Keep the queried radius positive
   * when using this profile in a section.
   */
  export interface IRadial {
    /** Selects radii-by-direction evaluation. */
    type: "radial";

    /**
     * At least three positive finite metre radii at angles 2?k divided by
     * sample count, starting on the positive first axis.
     */
    radii: number[];
  }
}

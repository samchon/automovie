import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * The path a sweep's sections travel along: a curve through points, such as the
 * centre line of a tube or the joint centres of a bone chain.
 *
 * The curve passes through every point and is parameterized by chord length, `u
 * = 0` at the first point and `u = 1` at the last, each point at its share of
 * the polygon's length. The curve is the centripetal Catmull-Rom spline through
 * the points, which has no cusp or loop within a segment, so a bone chain bends
 * smoothly through its joints and runs straight along its bones. Sections are
 * placed in rotation-minimizing frames transported from `normal` at the start,
 * so the path itself adds no twist. `tangents` can set the directions the path
 * leaves its first point and reaches its last, as a curve that must meet a
 * surface tangentially does.
 */
export interface IAutoMovieSweepSpine {
  /**
   * Points the path passes through, in metres, at least two, no two consecutive
   * ones equal.
   */
  points: IAutoMovieVector3[];

  /**
   * Direction of the section plane's first axis at the start, in metres' frame;
   * its component along the path's first tangent is removed, so it must not be
   * parallel to that tangent.
   */
  normal: IAutoMovieVector3;

  /**
   * Directions the path leaves its first point along and arrives at its last
   * point along; each replaces the spline's own end direction and keeps its
   * speed, so only the end segment's shape changes. Omitted, the spline's own.
   */
  tangents?: IAutoMovieSweepSpine.IEndpointTangents;
}

/** Named inputs extending the authored spine. */
export namespace IAutoMovieSweepSpine {
  /** Optional directions at the first and last spine points. */
  export type IEndpointTangents = {
    /**
     * Direction at the first point. Supply a finite nonzero direction, or omit
     * it to use the spline's own.
     */
    start?: IAutoMovieVector3;

    /**
     * Direction at the last point. Supply a finite nonzero direction, or omit
     * it to use the spline's own.
     */
    end?: IAutoMovieVector3;
  };
}

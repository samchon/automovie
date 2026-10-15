import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The path a sweep's sections travel along: a curve through points, such as
 * the centre line of a tube or the joint centres of a bone chain.
 *
 * The curve passes through every point and is parameterized by chord length,
 * `u = 0` at the first point and `u = 1` at the last, each point at its share
 * of the polygon's length. The curve is the centripetal Catmull-Rom spline
 * through the points, which has no cusp or loop within a segment, so a bone
 * chain bends smoothly through its joints and runs straight along its bones.
 * Sections are placed in rotation-minimizing frames transported from `normal`
 * at the start, so the path itself adds no twist.
 *
 * @evidence contracts/common.md#principled-implementation A centre curve through ordered points with chord-length knots, as sweep-based modelling interpolates key-section centres, through a centripetal Catmull-Rom spline so the path has no cusp at a bent joint.
 * @evidence contracts/common.md#clear-and-simple-design Points plus one starting direction are the least a frame-transported sweep needs; twist belongs to the stations' rotations, not to the spine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point is smoothed away or added; a path that doubles back on itself is refused where its tangent vanishes.
 * @evidence contracts/common.md#meaningful-documentation States interpolation, parameterization, the frame transport, and the meaning, unit and constraints of each field.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; frame cost is answered on `frameAutoMovieSweepSpine`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record compiled once per sweep.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data record owned by its sweep.
 * @author Samchon
 */
export interface IAutoMovieSweepSpine {
  /** Points the path passes through, in metres, at least two, no two consecutive ones equal. */
  points: IAutoMovieVector3[];

  /**
   * Direction of the section plane's first axis at the start, in metres' frame; its component along the path's first tangent is removed, so it must not be parallel to that tangent.
   */
  normal: IAutoMovieVector3;
}

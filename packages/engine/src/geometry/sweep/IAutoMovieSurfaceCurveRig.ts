/**
 * A network curve of a surface rig, from `rigAutoMovieSurfaceCurve`,
 * re-evaluated per pose into its own buffers.
 *
 * `update` runs once per pose after the sweeps and bones it reads; the
 * queries then write into caller arrays without allocation.
 *
 * @evidence contracts/common.md#principled-implementation A curve compiled once and re-fitted through moved control points per pose.
 * @evidence contracts/common.md#clear-and-simple-design One update and the three reads a cage needs: points, the bridge normal and the bridge direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads before `update` see the previous pose.
 * @evidence contracts/common.md#meaningful-documentation States the call order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on `rigAutoMovieSurfaceCurve`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its rig.
 */
export interface IAutoMovieSurfaceCurveRig {
  /**
   * Re-evaluate the curve for the current pose.
   *
   * @evidence contracts/common.md#principled-implementation Re-fits the curve through its moved control points with its end conditions.
   * @evidence contracts/common.md#clear-and-simple-design One call per pose.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A curve meeting a sweep along its normal is refused.
   * @evidence contracts/common.md#meaningful-documentation States when to call it.
   * @evidence contracts/performance.md#efficient-algorithms One or two spline updates, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSurfaceCurve`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSurfaceCurve`.
   */
  update(): void;

  /**
   * Write the point at a chord-length share.
   *
   * @param t Share, 0 to 1
   * @param out Receives three numbers
   * @param at Offset into `out`
   *
   * @evidence contracts/common.md#principled-implementation The curve point by chord-length share.
   * @evidence contracts/common.md#clear-and-simple-design Writes into a caller array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shares clamp to the curve.
   * @evidence contracts/common.md#meaningful-documentation States the parameter.
   * @evidence contracts/performance.md#efficient-algorithms A segment search and a cubic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSurfaceCurve`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSurfaceCurve`.
   */
  point(t: number, out: Float64Array, at: number): void;

  /**
   * Write the unit surface normal a bridge leaving the curve uses at a share.
   *
   * @param t Share, 0 to 1
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the curve declares no normal
   *
   * @evidence contracts/common.md#principled-implementation The declared normal blended toward sweep normals at the ends.
   * @evidence contracts/common.md#clear-and-simple-design Writes into a caller array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A curve without a normal is refused.
   * @evidence contracts/common.md#meaningful-documentation States the blend.
   * @evidence contracts/performance.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSurfaceCurve`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSurfaceCurve`.
   */
  normal(t: number, out: Float64Array, at: number): void;

  /**
   * Write the unit direction a bridge leaves the curve along.
   *
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the curve declares no direction
   *
   * @evidence contracts/common.md#principled-implementation The declared direction, turned with the curve's bone.
   * @evidence contracts/common.md#clear-and-simple-design Writes into a caller array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A curve without a direction is refused.
   * @evidence contracts/common.md#meaningful-documentation States the refusal.
   * @evidence contracts/performance.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSurfaceCurve`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSurfaceCurve`.
   */
  direction(out: Float64Array, at: number): void;
}

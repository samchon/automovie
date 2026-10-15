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
 * @author Samchon
 */
export interface IAutoMovieSurfaceCurveRig {
  /** Re-evaluate the curve for the current pose. */
  update(): void;

  /**
   * Write the point at a chord-length share.
   *
   * @param t Share, 0 to 1
   * @param out Receives three numbers
   * @param at Offset into `out`
   */
  point(t: number, out: Float64Array, at: number): void;

  /**
   * Write the unit surface normal a bridge leaving the curve uses at a share.
   *
   * @param t Share, 0 to 1
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the curve declares no normal
   */
  normal(t: number, out: Float64Array, at: number): void;

  /**
   * Write the unit direction a bridge leaves the curve along.
   *
   * @param out Receives three numbers
   * @param at Offset into `out`
   * @throws Error when the curve declares no direction
   */
  direction(out: Float64Array, at: number): void;
}

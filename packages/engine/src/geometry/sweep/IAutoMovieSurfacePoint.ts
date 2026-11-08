import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * A point of a surface rig that is written per pose: a node, a sweep sample
 * or a curve's control point.
 *
 * @evidence contracts/development/design.md#principled-representation A deferred evaluation bound at compile time, so per-pose evaluation is a call with no lookup.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One writer plus the sweep probe a node on a sweep carries for tangency.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The writer reads only state its rig refreshed for the current pose.
 * @evidence contracts/development/common.md#meaningful-documentation States what the point is for and when it is valid.
 */
export interface IAutoMovieSurfacePoint {
  /**
   * Write the point for the current pose.
   *
   * @param out Receives three numbers, metres
   * @param at Offset into `out`
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the point for the current pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Writes into a caller array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads only state refreshed for this pose.
   * @evidence contracts/development/common.md#meaningful-documentation States the output.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `rigAutoMovieSurfaceNetwork`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `rigAutoMovieSurfaceNetwork`.
   */
  write(out: Float64Array, at: number): void;

  /** For a point on a sweep, the sweep's rig and the probe slot of its normal there; otherwise null. */
  probe: { rig: IAutoMovieSweepRig; slot: number } | null;
}

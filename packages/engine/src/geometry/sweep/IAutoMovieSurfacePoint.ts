import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * A point of a surface rig that is written per pose: a node, a sweep sample
 * or a curve's control point.
 *
 * @evidence contracts/common.md#principled-implementation A deferred evaluation bound at compile time, so per-pose evaluation is a call with no lookup.
 * @evidence contracts/common.md#clear-and-simple-design One writer plus the sweep probe a node on a sweep carries for tangency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The writer reads only state its rig refreshed for the current pose.
 * @evidence contracts/common.md#meaningful-documentation States what the point is for and when it is valid.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its rig.
 * @author Samchon
 */
export interface IAutoMovieSurfacePoint {
  /**
   * Write the point for the current pose.
   *
   * @param out Receives three numbers, metres
   * @param at Offset into `out`
   */
  write(out: Float64Array, at: number): void;

  /** For a point on a sweep, the sweep's rig and the probe slot of its normal there; otherwise null. */
  probe: { rig: IAutoMovieSweepRig; slot: number } | null;
}

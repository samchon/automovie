import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * A point of a surface rig that is written per pose: a node, a sweep sample or
 * a curve's control point. rigSurfaceNetwork creates these records and
 * rigSurfaceCurve reads their current writers and probes. Sweep-node
 * records are resolved during registry finalization; reading their placeholder
 * writer before that throws.
 */
export interface IAutoMovieSurfacePoint {
  /**
   * Write the point for the current pose.
   *
   * @param out Borrowed writable buffer receiving model-space XYZ in metres;
   *   provide room for three scalars, since writers do not check capacity
   * @param at Nonnegative integer scalar offset into out, not a vertex index
   * @throws Any failure from the bound point writer, including reading before
   *   registry finalization or an invalid generated sweep sample
   */
  write(out: Float64Array, at: number): void;

  /**
   * For a point on a sweep, the sweep's rig and the probe slot of its normal
   * there; otherwise null.
   */
  probe: {
    /**
     * Shared sweep rig, refreshed before curve update. Its probe uses the
     * finalized geometric sampling cell, or a zero cell for observation-only
     * nodes.
     */
    rig: IAutoMovieSweepRig;

    /**
     * Probe ordinal, addressing six scalars at 6*slot: unit normal XYZ then
     * spine derivative XYZ in metres per normalized u. Null probe means the
     * point has no sweep tangent-plane constraint.
     */
    slot: number;
  } | null;
}

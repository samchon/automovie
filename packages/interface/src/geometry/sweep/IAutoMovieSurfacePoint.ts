import type { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";

/**
 * A point of a surface rig that is written per pose: a node, a sweep sample
 * or a curve's control point. rigAutoMovieSurfaceNetwork creates these records and rigAutoMovieSurfaceCurve reads their current writers and probes. Sweep-node records are resolved during registry finalization; reading their placeholder writer before that throws.
 *
 * @evidence contracts/development/design.md#principled-representation A deferred model-metre position writer and optional dimensionless normal/metres-per-u probe preserve the point's frame; output capacity and update ordering are caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface rigAutoMovieSurfaceNetwork resolves node writers and probes once, and rigAutoMovieSurfaceCurve reads them for endpoint positions and tangent-plane projection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A null probe means no sweep tangent-plane constraint; the mutable record also represents a pending sweep node until registry finalization replaces its throwing writer.
 * @evidence contracts/development/common.md#meaningful-documentation Defines model frame, units, pending-state failure, scalar output indexing and borrowed probe storage.
 */
export interface IAutoMovieSurfacePoint {
  /**
   * Write the point for the current pose.
   *
   * @param out Borrowed writable buffer receiving model-space XYZ in metres; provide room for three scalars, since writers do not check capacity
   * @param at Nonnegative integer scalar offset into out, not a vertex index
   * @throws Any failure from the bound point writer, including reading before registry finalization or an invalid generated sweep sample
   */
  write(out: Float64Array, at: number): void;

  /** For a point on a sweep, the sweep's rig and the probe slot of its normal there; otherwise null. */
  probe: {
    /** Shared sweep rig, refreshed before curve update. Its probe uses the finalized geometric sampling cell, or a zero cell for observation-only nodes. */
    rig: IAutoMovieSweepRig;

    /** Probe ordinal, addressing six scalars at 6*slot: unit normal XYZ then spine derivative XYZ in metres per normalized u. Null probe means the point has no sweep tangent-plane constraint. */
    slot: number;
  } | null;
}

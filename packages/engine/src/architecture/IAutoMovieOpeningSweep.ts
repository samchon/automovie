import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world volume one movable panel sweeps across its whole travel.
 *
 * Produced by `builtOpeningSweepEnvelope`, one per panel in authored order. It
 * is an axis-aligned world box around the four corners of the panel's
 * element-local `(0, 0)` to `(width, height)` rectangle over its own travel
 * range, so the leaf has no thickness here. Ancestors stand at the
 * environment's current state while the panel's own displacement is removed;
 * the box is not the union over every state a chain of leaves could reach.
 *
 * @evidence contracts/common.md#principled-implementation Solved, not sampled: a turning corner traces `A + B cos t + D sin t` under an affine world matrix, so each axis is extremal at the travel limits and the critical angles inside them, and a sliding corner is extremal at its limits.
 * @evidence contracts/common.md#clear-and-simple-design Only the box and the ids, because a later clearance or collision analysis reads the volume and owns the verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-finite travel limit, or a revolute range wider than a full turn, throws rather than being clamped, and a folding chain's reachable union is left to the caller instead of being reported under one panel's name.
 * @evidence contracts/common.md#meaningful-documentation States the producer and ordering, the solving method, that the leaf is a zero-thickness rectangle, the ancestor premise, and the world frame of both corners.
 * @evidenceExclude contracts/performance.md#cost-and-resources Two fresh corner vectors and two ids; its producer recomposes all element world matrices once per panel from a per-panel copy of the staged displacements, so an opening with several panels repeats that full pass.
 * @author Samchon
 */
export interface IAutoMovieOpeningSweep {
  /** Panel id inside its opening. */
  panel: string;

  /** The visible element the panel drives. */
  element: string;

  /** World minimum corner of the swept volume. */
  min: IAutoMovieVector3;

  /** World maximum corner of the swept volume. */
  max: IAutoMovieVector3;
}

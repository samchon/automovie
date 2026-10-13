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
 * @evidence contracts/common.md#principled-implementation The box bounds the four leaf corners over the panel's travel, solved from the closed form `A + B cos(t) + D sin(t)` a revolute corner traces, whose per-axis extremes lie at the limits or at the critical angles crossed, and from the limits for a prismatic leaf.
 * @evidence contracts/common.md#clear-and-simple-design Two world corners keyed by panel and element are what a clearance or collision analysis reads, and the record states no verdict about passage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The box is per panel with ancestors held at the current state rather than a union over every reachable configuration, a stated limitation, and the leaf is treated as having no thickness.
 * @evidence contracts/common.md#meaningful-documentation States the producer and order, that the box spans the panel's element-local rectangle over its own travel, that the leaf has no thickness, how ancestors are posed, and that it is not the union over a chain's states.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; per panel the producer rebuilds the matrix table and walks a bounded set of critical angles per corner, answered on `builtOpeningSweepEnvelope`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The staged displacement table is computed once per call and copied per panel with that panel's own joint removed; no envelope is retained.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two fresh vectors and two strings, owned by the caller's sweep list.
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

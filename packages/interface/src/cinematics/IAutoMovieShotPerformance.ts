/**
 * What one scene node does during a shot.
 *
 * @evidence contracts/common.md#principled-implementation Binds a scene node to a motion clip id and a start offset; `validateShotArtifact` requires a scene node, an offset within `[0, duration]`, one entry per node, and, when a registry is supplied, a compiled motion id.
 * @evidence contracts/common.md#clear-and-simple-design Three fields that reference motion by id, so each clip is stored once in the motion registry instead of being inlined into every shot that plays it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `performShot` always writes `startOffset: 0` and a non-null motion, so a later offset and the hold-pose `null` are accepted for hand-assembled or legacy shots but never produced by the engine.
 * @evidence contracts/common.md#meaningful-documentation States that each node appears once, the offset range in seconds, and that a `null` motion holds the node's pose.
 * @author Samchon
 */
export interface IAutoMovieShotPerformance {
  /** Id of the scene node performing; each node appears at most once. */
  node: string;

  /** Id of the motion clip it plays, or `null` to hold its pose. */
  motion: string | null;

  /**
   * Seconds into the shot at which this performance begins, within
   * `[0, duration]`.
   */
  startOffset: number;
}

/**
 * What one scene node does during a shot.
 *
 * Consumers advance the motion by `max(0, t - startOffset)` at shot time `t`,
 * so before `startOffset` the node holds the motion's first pose. `performShot`
 * writes one performance per performed node with `startOffset` `0`.
 *
 * @evidence contracts/common.md#principled-implementation `realizeShotContract`, `reviewVisualRead`, `resolveBeatEnd`, `measureAutoMovieGeometry` and the pose-keypoint plan all sample the motion at `max(0, t - startOffset)`, and `validateShotArtifact` requires a unique node that resolves in the scene, an offset within `[0, duration]`, and a non-blank motion id that resolves when the caller supplies the motion registry.
 * @evidence contracts/common.md#clear-and-simple-design The performance references the node and motion by id and adds one offset, so the motion stays a reusable clip and the shot only says when it starts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every consumer applies the same clamp at zero instead of extrapolating before the start, and a second performance for one node is refused rather than merged.
 * @evidence contracts/common.md#meaningful-documentation States how the offset maps shot time to motion time, what the node shows before it, what a null motion means, the per-node uniqueness, and the offset's range.
 * @author Samchon
 */
export interface IAutoMovieShotPerformance {
  /** Id of the scene node performing; each node appears at most once. */
  node: string;

  /** Id of the motion clip it plays, or `null` to hold its staged pose. */
  motion: string | null;

  /**
   * Seconds into the shot at which this performance begins, within
   * `[0, duration]`.
   */
  startOffset: number;
}

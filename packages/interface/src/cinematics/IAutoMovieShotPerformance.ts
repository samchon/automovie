/**
 * What one scene node does during a shot.
 *
 * Consumers advance the motion by `max(0, t - startOffset)` at shot time `t`,
 * so before `startOffset` the node holds the motion's first pose. `performShot`
 * writes one performance per performed node with `startOffset` `0`.
 */
export interface IAutoMovieShotPerformance {
  /** Id of the scene node performing; each node appears at most once. */
  node: string;

  /** Id of the motion clip it plays, or `null` to hold its staged pose. */
  motion: string | null;

  /**
   * Seconds into the shot at which this performance begins, within `[0,
   * duration]`.
   */
  startOffset: number;
}

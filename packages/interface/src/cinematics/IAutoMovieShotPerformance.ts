/**
 * What one scene node does during a shot.
 *
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

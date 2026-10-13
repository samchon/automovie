/** What one scene node does during a shot. */
export interface IAutoMovieShotPerformance {
  /** Id of the scene node performing. */
  node: string;

  /** Id of the motion clip it plays, or `null` to hold its pose. */
  motion: string | null;

  /** Seconds into the shot at which this performance begins. */
  startOffset: number;
}

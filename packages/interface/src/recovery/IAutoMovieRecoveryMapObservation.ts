/**
 * A measured feature location and its identity in one calibrated camera view.
 * The enclosing operation defines whether the view index addresses the full
 * source list or a compact active view list.
 */
export interface IAutoMovieRecoveryMapObservation {
  /** Index of the measuring view in the enclosing source or active-view array. */
  viewIndex: number;

  /** Index of the detected feature in that image's retained feature population. */
  featureIndex: number;

  /**
   * Measured pixel-center coordinates [column, row], with columns increasing
   * rightward and rows downward.
   */
  pixel: [number, number];
}

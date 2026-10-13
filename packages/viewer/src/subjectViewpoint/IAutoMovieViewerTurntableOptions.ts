/**
 * How a turntable plan is laid out around a subject.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerTurntableOptions {
  /**
   * Evenly spaced azimuths per elevation ring, at least one.
   */
  azimuthCount: number;

  /**
   * Elevation rings in degrees, in the order they are walked.
   */
  elevationsDeg: readonly number[];

  /**
   * Distance multiplier every generated viewpoint carries. Defaults to `1.25`,
   * which leaves a margin around the subject rather than cropping it to the
   * viewport edge.
   */
  distanceFactor?: number;
}

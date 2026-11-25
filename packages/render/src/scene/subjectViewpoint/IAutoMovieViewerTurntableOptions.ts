/**
 * Ordered elevation rings and evenly spaced positive-integer azimuth count for
 * a deterministic inspection plan. Finite positive distance factor defaults to
 * 1.25; rounded labels must remain unique.
 */
export interface IAutoMovieViewerTurntableOptions {
  /** Evenly spaced azimuths per elevation ring, at least one. */
  azimuthCount: number;

  /** Elevation rings in degrees, in the order they are walked. */
  elevationsDeg: readonly number[];

  /**
   * Distance multiplier every generated viewpoint carries. Defaults to `1.25`,
   * which leaves a margin around the subject rather than cropping it to the
   * viewport edge.
   */
  distanceFactor?: number;
}

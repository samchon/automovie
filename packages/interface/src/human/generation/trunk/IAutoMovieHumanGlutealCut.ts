/**
 * Horizontal original-source cut points with physical station and polar-phase
 * provenance.
 *
 * The interface package owns these declarations; AutoMovieHumanGlutealCut in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanGlutealCut {
  /** One horizontal-cut point and the actual source chart that produced it. */
  export interface IPoint {
    /** World X/Z in calibration millimetres. */
    point: [number, number];
    /** Physical station of the identical original source, calibration mm. */
    station: number;
    /** Original local polar phase, radians. */
    phase: number;
  }

  /**
   * Result of AutoMovieHumanGlutealCut.create. Preserve the existing point-only
   * consumer without preparing another field or solving another cut.
   */
  export type CreateResult = [number, number][] | string;
}

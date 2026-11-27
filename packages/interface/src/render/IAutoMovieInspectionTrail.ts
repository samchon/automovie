/**
 * Where one scene object's origin was at each sampled second, as
 * `AutoMovieRenderInspection.sampleTrails` reads it.
 */
export interface IAutoMovieInspectionTrail {
  /** The object's inspection path. */
  path: string;

  /** The sampled film seconds, ascending. */
  times: number[];

  /** World position of the object's origin at each second, flat xyz in metres. */
  positions: number[];

  /**
   * Whether every position lies within a micrometre of the first, so the object
   * did not move.
   */
  stationary: boolean;
}

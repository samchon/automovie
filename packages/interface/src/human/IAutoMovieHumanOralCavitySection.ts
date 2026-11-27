/**
 * One coronal section of the cavity's lining, an ellipse about a centre.
 * Coordinates and extents are registered-frame millimetres (+X forward, +Y up).
 * `sweep` is millimetres per squared normalized half-width share.
 */
export interface IAutoMovieHumanOralCavitySection {
  /** Forward place of the section at the midline. */
  x: number;

  /** Height of its centre. */
  y: number;

  /** Half width. */
  width: number;

  /** Rise of its top over the centre. */
  up: number;

  /** Fall of its bottom under the centre. */
  down: number;

  /**
   * Recession of its sides behind the midline, mm per squared share of the half
   * width.
   */
  sweep: number;
}

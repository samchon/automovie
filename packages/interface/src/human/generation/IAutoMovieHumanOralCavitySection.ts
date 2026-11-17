/** One coronal section of the cavity's lining, an ellipse about a centre.
 * Coordinates and extents are registered-frame millimetres (+X forward,
 * +Y up). `sweep` is millimetres per squared normalized half-width share.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One coronal section of the cavity's lining, an ellipse about a centre.
 * @evidence contracts/development/design.md#principled-representation `x`: Forward place of the section at the midline. `y`: Height of its centre. `width`: Half width.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanMouth.sweepAt. Also types AutoMovieHumanMouth.vestibule, AutoMovieHumanMouth.molars.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `x`, `y`, `width`, `up`, `down`, `sweep`; callers supply the complete record.
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

  /** Recession of its sides behind the midline, mm per squared share of the half width. */
  sweep: number;
}

/**
 * Interior room beyond the lip vestibule, independently of the visible aperture.
 * The two nonnegative expansions are millimetres along head X and Y. A smooth
 * depth transition preserves the actual rim; the existing posterior cap remains.
 * This is authored enclosure geometry, not measured palate or gingival anatomy.
 *
 * @author Samchon
 */
export interface IPortraitOralChamber {
  /** Additional transverse half-extent in mm, finite and nonnegative. */
  horizontalExpansion: number;

  /** Additional vertical half-extent in mm, finite and nonnegative. */
  verticalExpansion: number;

  /** Positive finite depth in mm at which expansion reaches its full weight. */
  transitionDepth: number;
}

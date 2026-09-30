/**
 * A horizontal neck section with independent anterior/posterior radii.
 * Distances are millimetres in the shared head frame.
 *
 * @author Samchon
 */
export interface IPortraitNeckSection {
  /** Height of this section; sections descend from upper to lower to crop. */
  y: number;

  /** Positive transverse half-width. */
  width: number;

  /** Positive radius anterior to the section's axis. */
  front: number;

  /** Positive radius posterior to the section's axis. */
  back: number;

  /** Sagittal position of the cervical axis; positive Z points forwards. */
  centre: number;
}

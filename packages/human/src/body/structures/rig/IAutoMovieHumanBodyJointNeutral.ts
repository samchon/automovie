/**
 * The source joint's three rest coordinates in degrees; the rig owner retains axes, frame and clinical qualification.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyJointNeutral {
  /** Source rest flexion degrees. */
  flexion: number;

  /** Source rest abduction degrees. */
  abduction: number;

  /** Source rest axial-rotation degrees. */
  twist: number;
}

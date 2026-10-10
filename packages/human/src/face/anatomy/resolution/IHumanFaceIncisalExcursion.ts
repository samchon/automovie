/**
 * Incisal movement from the same identity's closed reference, in millimetres
 * along the shared contact axes. Absolute final overjet and dental-midline
 * offset are different quantities owned by IHumanFaceIncisalOffset.
 *
 * @author Samchon
 */
export interface IHumanFaceIncisalExcursion {
  /** Positive anterior movement from closed reference, including initial overjet. */
  forward: number;

  /** Positive anatomical-left movement, correcting initial midline deviation. */
  left: number;
}

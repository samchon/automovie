/**
 * Lower minus upper midline incisal point in the contact frame, millimetres.
 *
 * @author Samchon
 */
export interface IHumanFaceIncisalOffset {
  /** Along the opening direction; positive is vertical overlap (overbite), negative is opening. */
  up: number;

  /** Anterior; negative is the upper incisor ahead (overjet), positive is protrusion past it. */
  forward: number;

  /** Toward the face's left along the mandibular axis. */
  left: number;
}

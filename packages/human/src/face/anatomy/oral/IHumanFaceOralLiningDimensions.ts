/**
 * The resolved dimensions of one arch's lining, in metres.
 *
 * They are the caller's `oral` values where given and the oral lining
 * owner's named defaults otherwise. Every length is positive and finite.
 *
 * @author Samchon
 */
export interface IHumanFaceOralLiningDimensions {
  /** Apical reach of the facial gingival collar, from the cervical ring to the vestibular fornix. */
  collarHeightMetres: number;

  /** Half width of the band about the arch curve over which facial collar and lingual vault blend; also the in-plane reach that is finished as gingiva. */
  collarThicknessMetres: number;

  /** In-plane distance of the vestibular fornix beyond the cervical rings. */
  wallClearanceMetres: number;

  /** Apical height of the palatal vault, or apical depth of the floor of the mouth, above the local cervical rings. */
  vaultMetres: number;

  /** In-plane posterior reach used by the assembly outline expansion; it does not terminate the lining field's posterior half-rays. */
  posteriorReachMetres: number;
}

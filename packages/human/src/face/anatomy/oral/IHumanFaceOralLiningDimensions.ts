/**
 * The resolved dimensions of one arch's lining, in metres.
 *
 * They are the caller's `oral` values where given and the oral lining owner's named defaults otherwise. Every length is positive and finite.
 *
 * @evidence contracts/common.md#principled-implementation Five positive resolved lengths select one arch's authored collar, clearance, vault and outline reach.
 * @evidence contracts/common.md#clear-and-simple-design Document millimetres or named defaults lower to one metre record used by field and assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generic adult defaults are authored extensions, not clinical normal ranges or the current person's acquired anatomy.
 * @evidence contracts/common.md#meaningful-documentation Posterior reach expands the outline without terminating the field's unbounded terminal rays.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Conversion and positivity admission execute in resolveHumanFaceOralLiningDimensions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One resolved dimension record is reused throughout the arch construction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns these scalars until its field/assembly completes; this schema allocates no buffers or handles.
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

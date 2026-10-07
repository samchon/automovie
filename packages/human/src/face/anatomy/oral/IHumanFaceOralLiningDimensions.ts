/**
 * The resolved dimensions of one arch's lining, in metres.
 *
 * They are the caller's `oral` values where given and the oral lining
 * owner's named defaults otherwise. Every length is positive and finite.
 *
 * @evidence contracts/common.md#principled-implementation Four resolved lengths enter the shared lining height field; posterior reach separately expands the assembly's posterior outline. Each retains its existing authored geometric meaning.
 * @evidence contracts/common.md#clear-and-simple-design One record per arch, resolved once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Holds resolved lengths only; no mesh-spacing fallback or per-tooth override.
 * @evidence contracts/common.md#meaningful-documentation States unit, origin and the meaning of each length.
 * @evidence contracts/modeling.md#parameter-channels Each length varies one trait of the lining and none depends on another once resolved.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the arch frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The lining owner groups the parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The lining owner constructs the boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The resolver owns the source of each default.
 * @evidenceExclude contracts/anatomy.md#permitted-range The resolver admits the values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The public oral document owns the inputs.
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

/**
 * One eye's globe: the surface carrying it and its attachment owner.
 *
 * @evidence contracts/common.md#principled-implementation The globe is identified by its surface and the existing attachment owner that rotates it.
 * @evidence contracts/common.md#clear-and-simple-design Two named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions The owner's attachment rows index the named surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Identifies the globe part of one eye.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The lids meet the globe; the contact owner resolves that boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularGlobe {
  /** ID of the basis surface that carries the globe. */
  surface: string;

  /** Attachment owner of the globe on that surface, the articulation eye ID. */
  owner: string;
}

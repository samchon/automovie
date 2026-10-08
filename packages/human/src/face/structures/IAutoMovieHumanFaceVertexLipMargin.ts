/**
 * The vermilion margin of the oral fissure on the contact's lips surface: the
 * upper lip's lower edge and the lower lip's upper edge, each an ordered vertex
 * chain from one commissure to the other.
 *
 * The chains are the edges the fissure shows from the front: the lower
 * silhouette of the upper vermilion and the upper silhouette of the lower
 * vermilion, projected onto the plane of the mandibular axis and the opening
 * direction, ordered along the axis and running unbroken to the commissure
 * join. These are the existing resident-vertex registrations. Their source
 * identity and order remain unchanged; closure and gap measurement verify
 * actual performed contact rather than deriving acceptance from registration.
 *
 * @evidence contracts/common.md#principled-implementation Existing resident chains retain their prepared registration; the performed closure and gap owners independently verify contact.
 * @evidence contracts/common.md#clear-and-simple-design Two ordered vertex chains on the surface the central lips pair names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The chains are registered by preparation from the stated silhouette rule, never guessed at runtime.
 * @evidence contracts/common.md#meaningful-documentation States the legacy chain registration and separates its order from performed contact acceptance.
 * @evidence contracts/modeling.md#part-identity-and-grouping Every vertex belongs to the lips surface the contact names.
 * @evidenceExclude contracts/modeling.md#parameter-channels The margin is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The margin emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Indices carry no unit.
 * @evidence contracts/modeling.md#shared-boundaries The chains are the boundary where upper and lower vermilion meet in contact.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact summary reports the residual apertures.
 * @evidence contracts/anatomy.md#anatomical-source Lip seal is contact along the whole vermilion margin from commissure to commissure.
 * @evidenceExclude contracts/anatomy.md#permitted-range The margin bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The margin is basis registration, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceVertexLipMargin {
  /** Existing undiscriminated resident-vertex registration. */
  kind?: undefined;

  /** The upper vermilion's lower edge, ordered along the mandibular axis. */
  upper: number[];

  /** The lower vermilion's upper edge, ordered along the mandibular axis. */
  lower: number[];
}

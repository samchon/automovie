/**
 * A part carried by some vertices of a basis surface, such as one brow on a
 * surface that holds both.
 *
 * @evidence contracts/common.md#principled-implementation A surface ID plus owned vertex rows separates one part of a shared surface without copying geometry.
 * @evidence contracts/common.md#clear-and-simple-design Two named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions Vertex rows index the named surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Identifies one part within a shared surface.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries Owned rows partition a shared surface between the two sides.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularComponent {
  /** ID of the basis surface that carries the part. */
  surface: string;

  /** Vertex indices of that surface owned by the part, ascending. */
  vertices: number[];
}

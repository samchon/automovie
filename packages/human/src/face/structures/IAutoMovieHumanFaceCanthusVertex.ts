/**
 * A canthus registered as one fixed skin vertex, used only where no
 * extreme-type definition exists.
 *
 * @evidence contracts/common.md#principled-implementation A fixed vertex is the fallback registration when no extreme definition exists.
 * @evidence contracts/common.md#clear-and-simple-design Two named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions The vertex indexes the margins' skin surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Defines one canthus.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The canthus is a common endpoint of both margins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCanthusVertex {
  /** Discriminant of the fixed-vertex definition. */
  kind: "vertex";

  /** Skin vertex index of the canthus, on the margins' surface. */
  vertex: number;
}

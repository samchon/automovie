/**
 * One ear as a head rule leaves it out of a search: the head view triangles
 * that touch the declared ear area, and the area's highest point at rest
 * (`humanPersonHeadEar`).
 *
 * @evidence contracts/common.md#principled-implementation The excluded triangles and the bound come from the same declared area.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both fields are read from the area; neither is a fixed number.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#spatial-conventions The top is a height in metres of the person frame at rest.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The consumer rule cites why the ear is excluded.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadEar {
  /** Ordinals of the head view triangles with a vertex in the ear area. */
  triangles: Set<number>;

  /** Highest ear-area vertex height at rest, metres. */
  top: number;
}

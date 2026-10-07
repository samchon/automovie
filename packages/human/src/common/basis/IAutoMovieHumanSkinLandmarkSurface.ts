/**
 * The part of a basis surface a named skin point is admitted against: its
 * flat XYZ positions.
 *
 * @evidence contracts/common.md#principled-implementation Admission needs only the vertex population.
 * @evidence contracts/common.md#clear-and-simple-design One field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No other surface data is read.
 * @evidence contracts/common.md#meaningful-documentation States the field.
 * @evidence contracts/modeling.md#spatial-conventions Flat XYZ metres of the basis frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanSkinLandmarkSurface {
  /** Flat XYZ positions of the surface. */
  positions: readonly number[];
}

/**
 * One whole final posed basis surface as a face measurement reads it.
 *
 * `positions` are flat XYZ metres in the basis head frame, each rounded to
 * Float32, in the surface's resident vertex order; `indices` are its oriented
 * triangles over those vertices, before material or UV seam splitting.
 * Both arrays are read only.
 *
 * @evidence contracts/common.md#principled-implementation Whole-surface readers measure the final output in its resident topology at exported precision.
 * @evidence contracts/common.md#clear-and-simple-design Two arrays: positions and triangles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readers get the resident topology, not a split or decimated copy.
 * @evidence contracts/common.md#meaningful-documentation States order, frame, precision and ownership.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres in the basis head frame, rounded to Float32.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record carries one existing surface and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Readers measure; the editor displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries geometry, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is not an input.
 * @author Samchon
 */
export interface IHumanFaceMeasurementSurface {
  /** Final posed XYZ metres, Float32-rounded, resident vertex order. */
  positions: readonly number[];

  /** Oriented triangles over the resident vertices. */
  indices: readonly number[];
}

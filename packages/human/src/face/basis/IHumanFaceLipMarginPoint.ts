import type { IAutoMovieVector3 } from "@automovie/interface";

/** One legacy vertex or native material seat read on actual geometry.
 *
 * @evidence contracts/common.md#principled-implementation Source support and canonical interpolation are retained together rather than reseated from a free point.
 * @evidence contracts/common.md#clear-and-simple-design A point and sparse native support serve both contact field and geometric measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no nearest guess or altered source position.
 * @evidence contracts/common.md#meaningful-documentation Names weights, source identity and exact anchor ownership.
 * @evidence contracts/modeling.md#spatial-conventions Point metres use the supplied head frame; weights and vertex indices are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Stable source identity is shared by oral joins and contact.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads existing skin support.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming assembly owns rendering.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Reads supplied geometry without clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source/contact owners admit their limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal coordinate input.
 * @author Samchon
 */
export interface IHumanFaceLipMarginPoint {
  /** Actual point from the canonical represented interpolation. */
  point: IAutoMovieVector3;

  /** Native support vertices; legacy support has one vertex and weight one. */
  vertices: readonly number[];

  /** Matching coefficients, never normalized by the reader. */
  weights: readonly number[];

  /** Stable source material identity for the same physical join. */
  identity: string;

  /** Exact source vertex only when this point is that original anchor. */
  nativeVertex: number | null;
}

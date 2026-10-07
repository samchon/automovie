import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Coordinates in one native facet's unnormalized orthogonal tangent basis.
 * These are dimensionless basis coefficients, not texture UVs, anatomical
 * measurements or a personal curve input. Exact values preserve shared
 * native corners through triangle-domain and edge-event comparisons.
 *
 * @evidence contracts/common.md#principled-implementation Two exact rational basis coefficients locate a point in the source facet's tangent plane.
 * @evidence contracts/common.md#clear-and-simple-design Carries one chart coordinate without a second geometry or UV authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source facet geometry defines the basis without a head axis or tolerance weld.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes dimensionless chart coefficients from physical length and authoring data.
 * @evidence contracts/modeling.md#spatial-conventions Coefficients address the one chart's native head-frame tangent basis.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no public authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The chart owner defines shared native coordinates.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow consumer owns rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Contains no measured anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart owner admits its geometric domain.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal source coordinate is not a personal sculpting input.
 * @author Samchon
 */
export interface IHumanFaceSkinChartCoordinate {
  /** Coefficient along the seed facet's first native edge. */
  x: IHumanExactFraction;

  /** Coefficient along its Gram-orthogonalized second native edge. */
  y: IHumanExactFraction;
}

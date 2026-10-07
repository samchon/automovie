import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";

/**
 * Exact barycentric correspondence on one native host triangle.
 * Chart lifting retains rational weights until the host reads a head-frame
 * point once. The same triangle supplies its existing corner-normal field.
 * This internal correspondence is not a personal authoring input.
 *
 * @evidence contracts/common.md#principled-implementation Exact barycentric weights preserve the chart inverse's native triangle correspondence.
 * @evidence contracts/common.md#clear-and-simple-design One triangle and three weights carry one native attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no replacement point or anatomical epsilon.
 * @evidence contracts/common.md#meaningful-documentation States exact position transport and normal-field ownership.
 * @evidence contracts/modeling.md#spatial-conventions Triangle ordinal and barycentric weights are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The native triangle is the common skin and attachment support.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Represents correspondence on an existing part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no anatomical trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The attached part owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometry rather than clinical measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart and contact owners admit supported construction.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Exposes no personal sculpting control.
 * @author Samchon
 */
export interface IHumanFaceExactSkinSeat {
  /** Ordinal in the host's actual complete triangle winding. */
  triangle: number;

  /** Exact affine weights of those three corners, summing to one. */
  weights: readonly [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction];
}

import type { IHumanBodyUnderwearLiftDerivativeFailure } from "./IHumanBodyUnderwearLiftDerivativeFailure";

/**
 * Analytic sparse derivatives of the actual returned unit normals.
 *
 * @evidence contracts/common.md#principled-implementation Each vertex owns one map from candidate Cartesian index to its returned unit-normal XYZ derivative, preserving all indexed one-ring dependencies.
 * @evidence contracts/common.md#clear-and-simple-design The normal derivative owner assembles one sparse map population and reports failed vertices through a separate located record population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unavailable normal clears its derivative map rather than substituting a frozen or flipped direction.
 * @evidence contracts/common.md#meaningful-documentation Documents per-vertex order, Cartesian-index keys, XYZ values, inverse-metre units and explicit missing derivatives.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidence contracts/modeling.md#spatial-conventions Normal derivatives map posed-skin metre coordinates to dimensionless unit-direction components, giving inverse-metre values.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
 * @author Samchon
 */
export interface IHumanBodyUnderwearNormalLinearization {
  /** One Cartesian-index to XYZ derivative map per candidate vertex; values have inverse-metre units. */
  derivatives: Map<number, number[]>[];

  /** Located normal derivative failures retained without freezing a failed normal. */
  unavailable: IHumanBodyUnderwearLiftDerivativeFailure[];
}

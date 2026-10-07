/**
 * The softness of one surface's sag proxy: a base value plus a gain for each
 * named body channel times the document's weight of that channel, held in a
 * closed range.
 *
 * @evidence contracts/common.md#principled-implementation Softness is an affine function of declared channel weights, clamped into one stated interval.
 * @evidence contracts/common.md#clear-and-simple-design Three fields: base, per-channel gains and range.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person or vertex is addressed; only named channels enter.
 * @evidence contracts/common.md#meaningful-documentation States the formula and each field.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidence contracts/modeling.md#parameter-channels Gains are keyed by existing body channel names.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Softness is dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The sagged surface is observed by its owner.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The softness is a numerical proxy, not a measured tissue property.
 * @evidenceExclude contracts/anatomy.md#permitted-range The range bounds a numerical factor, not a clinical state.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is basis policy, not an authored human input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisSurfaceSagSoftness {
  /** Softness with every listed channel at zero. */
  base: number;

  /** Gain per named body channel, multiplied by the document's weight of it. */
  channels: Record<string, number>;

  /** Closed interval the softness is held in. */
  range: [number, number];
}

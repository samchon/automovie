/**
 * The last anatomy solve of a body builder, kept with the key of the authored
 * weights and measurements it read so that pose, material and history edits
 * reuse it instead of solving again.
 *
 * @evidence contracts/common.md#principled-implementation The cached shape is reused only for the exact key it was solved from.
 * @evidence contracts/common.md#clear-and-simple-design Two fields: the key and the solved shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A changed key solves again; nothing is reused across different inputs.
 * @evidence contracts/common.md#meaningful-documentation States what the key covers and when the shape is reused.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidence contracts/modeling.md#parameter-channels The shape is a weight record over existing body channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Weights are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder's model is observed by its owner.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The solve bounds the weights.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is a cache, not an input.
 * @author Samchon
 */
export interface IHumanBodyAnatomySolve {
  /** Serialized authored weights and measurements the solve read. */
  key: string;

  /** The solved shape channel weights. */
  shape: Record<string, number>;
}

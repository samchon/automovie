/**
 * The best head solve candidate seen so far: its merit, channel weights and
 * the head readings at those weights.
 *
 * @evidence contracts/common.md#principled-implementation The readings are the real measurements at the stored weights, so the closest candidate reports its own residual.
 * @evidence contracts/common.md#clear-and-simple-design Three fields: merit, weights and readings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The candidate is reported as closest, never as a met target.
 * @evidence contracts/common.md#meaningful-documentation States each field and its unit.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidence contracts/modeling.md#parameter-channels Weights are in the solve's channel order over existing head channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Readings are metres; merit is a dimensionless sum of squared relative residuals.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The solved person is observed by the editor.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The head measurement rules state their protocols.
 * @evidenceExclude contracts/anatomy.md#permitted-range The channel envelopes bound the weights.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is solver state, not an input.
 * @author Samchon
 */
export interface IHumanPersonHeadCandidate {
  /** Sum of squared relative residuals of the primary measurements. */
  merit: number;

  /** Channel weights in the solve's channel order. */
  weights: number[];

  /** Head readings at those weights, metres, in the solve's reading order. */
  readings: number[];
}

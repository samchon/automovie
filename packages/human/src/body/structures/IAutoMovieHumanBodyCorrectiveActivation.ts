/**
 * One corrective row target's activation for a body evaluation.
 *
 * `humanBodyBasisWeights` computes activations from the admitted weights and
 * the coupled pose; the row evaluator multiplies every offset of `target` by
 * a positive activation and skips a zero one.
 *
 * @evidence contracts/common.md#principled-implementation A corrective contributes its rows scaled by the activation the pose computed, in activation order.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the anonymous activation element of the row state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Activations come from the weight owner, never a fixture or tolerance.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the consumer and the zero rule.
 * @evidence contracts/modeling.md#parameter-channels A corrective is a pose-driven row target blended with the channel endpoints.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The activation is dimensionless; the rows own their metres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder observes the emitted form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The weight owner bounds the activation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived evaluation state, not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCorrectiveActivation {
  /** Basis corrective row-target name. */
  target: string;

  /** Non-negative multiplier of the target's offsets. */
  activation: number;
}

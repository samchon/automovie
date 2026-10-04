import type { IAutoMovieHumanBodyCorrectiveActivation } from "./IAutoMovieHumanBodyCorrectiveActivation";

/**
 * The channel weights and corrective activations one body evaluation applies.
 *
 * `applyHumanBodyShapeRows` reads it to sum channel endpoints in the basis's
 * channel order and then correctives in activation order. Weights are the
 * admitted signed channel values; a negative weight selects the negative
 * endpoint. The state is read only.
 *
 * @evidence contracts/common.md#principled-implementation The row sum reads admitted weights and computed activations in a fixed order, so the result is deterministic.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the row evaluator's anonymous state type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The state carries only admitted weights and derived activations.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, the application order, the sign convention and read-only use.
 * @evidence contracts/modeling.md#parameter-channels Weights are the basis's named signed channels and activations their pose-driven correctives.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The state defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The state emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Weights and activations are dimensionless; the rows own their metres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The state builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder observes the emitted form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The state carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission already bounded the weights.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived evaluation state from admitted channels.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShapeRowState {
  /** Admitted signed weight per channel name. */
  weights: ReadonlyMap<string, number>;

  /** Corrective activations, in application order. */
  activations: readonly IAutoMovieHumanBodyCorrectiveActivation[];
}

import type { IAutoMovieHumanBodyCorrectiveActivation } from "./IAutoMovieHumanBodyCorrectiveActivation";

/**
 * The channel weights and corrective activations one body evaluation applies.
 *
 * `applyHumanBodyShapeRows` reads it to sum channel endpoints in the basis's
 * channel order and then correctives in activation order. Weights are the
 * admitted signed channel values; a negative weight selects the negative
 * endpoint. The state is read only.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShapeRowState {
  /** Admitted signed weight per channel name. */
  weights: ReadonlyMap<string, number>;

  /** Corrective activations, in application order. */
  activations: readonly IAutoMovieHumanBodyCorrectiveActivation[];
}

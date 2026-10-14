import type { IAutoMovieHumanBodyCorrectiveActivation } from "./IAutoMovieHumanBodyCorrectiveActivation";

/**
 * The channel weights and corrective activations one body evaluation applies.
 *
 * `applyHumanBodyShapeRows` reads it to sum channel endpoints in the basis's
 * channel order and then correctives in activation order. Weights are the
 * admitted signed channel values; a negative weight selects the negative
 * endpoint. The state is read only.
 *
 * @evidence contracts/common.md#principled-implementation A read-only weight map and ordered corrective list describe the admitted row evaluation; signed weights select their corresponding endpoints.
 * @evidence contracts/common.md#clear-and-simple-design Channel identity lookup is separate from ordered corrective application.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The state supplies no new offsets and does not canonicalize signed values.
 * @evidence contracts/common.md#meaningful-documentation Documentation states channel order, activation order and read-only use.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape row evaluation state declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape row evaluation state schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The shape row evaluation state type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShapeRowState {
  /** Admitted signed weight per channel name. */
  weights: ReadonlyMap<string, number>;

  /** Corrective activations, in application order. */
  activations: readonly IAutoMovieHumanBodyCorrectiveActivation[];
}

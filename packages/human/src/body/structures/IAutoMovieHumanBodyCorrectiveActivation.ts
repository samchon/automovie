/**
 * One corrective row target's activation for a body evaluation.
 *
 * `humanBodyBasisWeights` computes activations from the admitted weights and
 * the coupled pose; the row evaluator multiplies every offset of `target` by
 * a positive activation and skips a zero one.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCorrectiveActivation {
  /** Basis corrective row-target name. */
  target: string;

  /** Non-negative multiplier of the target's offsets. */
  activation: number;
}

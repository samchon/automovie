/**
 * One corrective row target's activation for a body evaluation.
 *
 * `humanBodyBasisWeights` computes activations from the admitted weights and
 * the coupled pose; the row evaluator multiplies every offset of `target` by
 * a positive activation and skips a zero one.
 *
 * @evidence contracts/common.md#principled-implementation A target name and nonnegative scalar represent one corrective contribution after weight and pose admission.
 * @evidence contracts/common.md#clear-and-simple-design The row evaluator receives the activation separately from the basis offsets it scales.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero activation skips a target by the row contract, without supplying replacement offsets.
 * @evidence contracts/common.md#meaningful-documentation The prose states the producer, multiplication meaning and zero behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The corrective activation records declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The corrective activation records schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The corrective activation records type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCorrectiveActivation {
  /** Basis corrective row-target name. */
  target: string;

  /** Non-negative multiplier of the target's offsets. */
  activation: number;
}

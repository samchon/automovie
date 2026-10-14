/**
 * Result of `solveHumanBodyMeasuredChannel`: the fresh shape with the solved
 * channel's weight, and the instrument's reading on it.
 *
 * @evidence contracts/common.md#principled-implementation A fresh weight record and actual metric reading carry the completed inversion without modifying its input shape.
 * @evidence contracts/common.md#clear-and-simple-design The solution keeps the selected weights and their observed measurement together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual metres report the instrument result rather than asserting the requested target exactly.
 * @evidence contracts/common.md#meaningful-documentation Members state fresh shape ownership and the unit of the returned observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The measured channel solutions declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The measured channel solutions schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The measured channel solutions type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelSolution {
  /** The solved shape. */
  shape: Record<string, number>;

  /** The instrument's reading on that shape, metres. */
  actualMetres: number;
}

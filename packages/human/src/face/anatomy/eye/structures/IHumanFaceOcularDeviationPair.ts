/** Actual exterior facets' certified one-sided distance to their generating patch, metres.
 *
 *
 * @evidence contracts/common.md#principled-implementation Rest and actually posed facets retain one-sided bounds to their generating patch.
 * @evidence contracts/common.md#clear-and-simple-design The optical assembly owns actual-cell metric readings and stores both evaluated states.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither field is a hull-inscription proof, reverse Hausdorff bound or tissue-clearance allowance.
 * @evidence contracts/common.md#meaningful-documentation Fields identify metre deviation and shape-only versus performed geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularDeviationPair is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularDeviationPair declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularDeviationPair itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularDeviationPair {
  /** Shaped reference geometry before its registered gaze transform. */
  rest: number;

  /** Actual performed coordinates after the registered gaze transform. */
  posed: number;
}

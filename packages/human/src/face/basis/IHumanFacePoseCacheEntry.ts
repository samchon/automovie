/**
 * The latest immutable pose result and its serialized selected geometric inputs.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceBasisPoseCache serializes admitted channel weights and supported numerical geometry profiles against one fixed source/evaluator boundary.
 * @evidence contracts/common.md#clear-and-simple-design One generic latest entry joins comparison key and evaluated result; geometry production remains the evaluator's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every downstream consumer must treat T as immutable; key equality proves equivalence only under fixed source/dependency premises and supplies no anatomy or observer replay guarantee.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish serialized geometric inputs and the caller's immutable-result obligation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This entry executes no serialization/evaluation; its cache owner carries those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no requests; the owner replaces the entry only after a successful miss evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; one latest generic result lives with the cache closure until replaced/released.
 *
 * @author Samchon
 */
export interface IHumanFacePoseCacheEntry<T> {
  /** Exact serialized geometric input values. */
  key: string;

  /** Result treated as immutable by every downstream consumer. */
  result: T;
}



/**
 * Authored pass whose units answer a production-local contract.
 *
 * @evidence contracts/common.md#principled-implementation Construction and naturalness distinguish the two authored host populations.
 * @evidence contracts/common.md#clear-and-simple-design The pass is independent from layer so screenplay revision keeps its own final host root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Naturalness obligations remain unsupported and the constructor rejects them.
 * @evidence contracts/common.md#meaningful-documentation Omitted pass defaults to construction in the local claim builder.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; local claim constructors and host admission select construction or final populations, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; local claim constructors and host admission select construction or final populations, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; local claim constructors and host admission select construction or final populations, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieProductionContractPass = "construction" | "naturalness";

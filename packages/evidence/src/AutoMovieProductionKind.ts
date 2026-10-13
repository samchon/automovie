

/**
 * A generated production's mutually exclusive evidence topology.
 *
 * @evidence contracts/common.md#principled-implementation Brief, film and library represent mutually exclusive selected production topologies.
 * @evidence contracts/common.md#clear-and-simple-design A null field in the config represents selection not yet made rather than another kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not infer kind from files or create an unspecified fourth topology.
 * @evidence contracts/common.md#meaningful-documentation Stage validation enforces kind-specific narrative and delivery exclusions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; validateAutoMovieProductionStages admits mutually exclusive topologies, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; validateAutoMovieProductionStages admits mutually exclusive topologies, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; validateAutoMovieProductionStages admits mutually exclusive topologies, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieProductionKind = "brief" | "film" | "library";

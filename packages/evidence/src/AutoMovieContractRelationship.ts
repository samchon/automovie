

/**
 * A closed manifest vocabulary classifies checklist, distributed coverage, foundation, lineage and population-account routes.
 *
 * @evidence contracts/common.md#principled-implementation A closed manifest vocabulary classifies checklist, distributed coverage, foundation, lineage and population-account routes.
 * @evidence contracts/common.md#clear-and-simple-design Manifest consumers receive semantic relationship names independently from native claim syntax.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Classification does not add native enforcement or infer prose correctness.
 * @evidence contracts/common.md#meaningful-documentation The alternatives expose how hosts relate to contract or population targets.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; createAutoMovieContractBindingManifest classifies native references, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; createAutoMovieContractBindingManifest classifies native references, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; createAutoMovieContractBindingManifest classifies native references, while the caller or module owns the lifetime of its values.
 */
export type AutoMovieContractRelationship =
  | "checklist"
  | "distributed-coverage"
  | "foundation"
  | "lineage"
  | "population-account";

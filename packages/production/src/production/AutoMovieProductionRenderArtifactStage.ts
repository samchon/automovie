

/**
 * Nine boundaries identifying where a host render-artifact finding arose.
 *
 * @evidence contracts/common.md#principled-implementation The stage predicate checks spelling while planner decisions preserve the supplied boundary with state/authority.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type executes no inspection and retains no native resource.
 */
export type AutoMovieProductionRenderArtifactStage = "absence" | "locator" | "capture" | "receipt" | "inventory" | "media" | "currentness" | "ownership" | "reference";

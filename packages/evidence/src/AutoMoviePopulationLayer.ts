/**
 * An authored film layer whose unit-file population can participate in a vertical-slice authoring scope.
 *
 * Treatments remain flat because they own no delivery partition. Scripts design that partition, and screenplays inherit it exactly.
 *
 * @evidence contracts/common.md#principled-implementation The three literal narrative families distinguish flat treatments from scripts and screenplays whose populations can be narrowed by a delivery partition.
 * @evidence contracts/common.md#clear-and-simple-design This narrow population-layer union keeps pilot selectors separate from the wider authored Markdown family registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only branches with the declared population semantics enter this union; library design families receive no invented narrative partition.
 * @evidence contracts/common.md#meaningful-documentation The comment states why treatments stay flat while scripts and screenplays share delivery partitioning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The narrative population-layer union executes no traversal or selection algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A narrative layer identity carries no completed or in-flight population work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased narrative-layer union acquires no population; createAutoMovieAuthoredPopulationFiles owns construction of the selected layer paths and its caller owns their retention.
 *
 * @author Samchon
 */
export type AutoMoviePopulationLayer = "screenplays" | "scripts" | "treatments";

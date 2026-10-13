import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";

/**
 * Read the explicit screenplay stage from the independent naturalness map.
 *
 * @evidence contracts/common.md#principled-implementation Read the explicit screenplay stage from the independent naturalness map.
 * @evidence contracts/common.md#clear-and-simple-design The helper keeps the revision branch access consistent between stage and claim assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default is supplied for an omitted map; unknown input admission is owned by validateAutoMovieNaturalnessStages.
 * @evidence contracts/common.md#meaningful-documentation The returned stage belongs to final screenplay expression rather than construction.
 * @evidence contracts/performance.md#efficient-algorithms A fixed nested property access takes constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The graph's supplied stage value is read directly without a copied or cached map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No ownership of the graph or retained revision population is acquired.
 */
export function revisionStage(graph: IAutoMovieEvidenceConfigProps): AutoMovieEvidenceStage {
  return graph.naturalness?.screenplays;
}

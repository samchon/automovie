import type { AutoMovieEvidenceBranch } from "./AutoMovieEvidenceBranch";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { revisionStage } from "./revisionStage";

/**
 * Dispatch the naturalness revision branch to its explicit map and all other supported branches to their declared stage.
 *
 * @evidence contracts/common.md#principled-implementation Dispatch the naturalness revision branch to its explicit map and all other supported branches to their declared stage.
 * @evidence contracts/common.md#clear-and-simple-design Branch vocabulary determines the sole exceptional nested access, keeping manifest and topology stage reads consistent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing-stage fallback is provided and declaration admission validates the supported map first.
 * @evidence contracts/common.md#meaningful-documentation The helper returns current lifecycle state without evaluating acknowledgment coverage.
 * @evidence contracts/performance.md#efficient-algorithms One branch comparison and property access have constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The current graph values are read directly; no stage snapshot or cross-call cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No graph ownership is transferred and only the stage string escapes.
 */
export function stageOf(graph: IAutoMovieEvidenceConfigProps, branch: AutoMovieEvidenceBranch): AutoMovieEvidenceStage {
  return branch === "screenplayNaturalness" ? revisionStage(graph) : graph[branch];
}

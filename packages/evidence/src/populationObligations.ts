import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { selectAutoMovieAuthoredContractFiles } from "./selectAutoMovieAuthoredContractFiles";

/**
 * Shared obligations selected for the branch's authored role.
 *
 * @evidence contracts/common.md#principled-implementation Select obligation routes through the canonical production-kind and authored-layer contract policy.
 * @evidence contracts/common.md#clear-and-simple-design The factory delegates semantic family applicability to selectAutoMovieAuthoredContractFiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty obligation family stays empty rather than receiving a placeholder target.
 * @evidence contracts/common.md#meaningful-documentation Returned paths are shared-contract routes relative to the docs root.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the fixed family policy selection and construction of its small route population.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical applicability table serves obligations, discovery and principles across their consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned route array belongs to the caller and the helper retains no production declaration.
 */
export function populationObligations(graph: IAutoMovieEvidenceConfigProps, layer: AutoMovieAuthoredDocumentLayer): string[] {
  return selectAutoMovieAuthoredContractFiles(graph.kind, layer).obligations;
}

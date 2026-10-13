import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { createAutoMovieAuthoredPopulationFiles } from "./createAutoMovieAuthoredPopulationFiles";

/**
 * Active narrative branches use scope-specific globs; disabled branches retain complete selectors so resident hosts can still be rejected.
 *
 * @evidence contracts/common.md#principled-implementation Active narrative branches use scope-specific globs; disabled branches retain complete selectors so resident hosts can still be rejected.
 * @evidence contracts/common.md#clear-and-simple-design The canonical authored selector owns layer grammar; this wrapper supplies complete scope for disabled branches and the declared scope for active branches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pilot narrowing is a declared narrative scope, not a special case for a fixture or an empty production.
 * @evidence contracts/common.md#meaningful-documentation The selectors are relative to docs and preserve construction layer identity.
 * @evidence contracts/performance.md#efficient-algorithms The fixed layer lookup and narrative selector construction allocate a small result independent of physical file count.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared population rules are reused; each call returns selectors rather than caching mutable project declarations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned selector strings escape; no filesystem resources or retained job state are acquired.
 */
export function authoredPopulationFiles(graph: IAutoMovieEvidenceConfigProps, layer: AutoMovieAuthoredDocumentLayer): string[] {
  return createAutoMovieAuthoredPopulationFiles(
    layer,
    graph[layer] === "disabled"
      ? { mode: "complete-production" }
      : graph.populationScope,
  );
}

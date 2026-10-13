import path from "node:path";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { DOCS } from "./DOCS";
import { authoredPopulationFiles } from "./authoredPopulationFiles";
import { populationFiles } from "./populationFiles";
import { walkProjectFiles } from "./walkProjectFiles";

/**
 * Resolve one layer's declared docs-relative selectors into current physical Markdown host paths.
 *
 * @evidence contracts/common.md#principled-implementation Resolve one layer's declared docs-relative selectors into current physical Markdown host paths.
 * @evidence contracts/common.md#clear-and-simple-design Narrative layers use scoped selectors through populationFiles; other authored layers use a recursive project-boundary walk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function does not manufacture missing hosts or widen a pilot scope to make a population nonempty.
 * @evidence contracts/common.md#meaningful-documentation Results are absolute physical files; stage-specific empty-population admission belongs to validateHosts.
 * @evidence contracts/performance.md#efficient-algorithms Filesystem walking and glob matching dominate according to selected roots and resident files.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical selector construction is reused; physical walks are repeated so current files are observed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned file list is caller-owned and no walk result survives in a module cache.
 */
export function markdownPopulationFiles(graph: IAutoMovieEvidenceConfigProps, layer: AutoMovieAuthoredDocumentLayer): string[] {
  return layer === "treatments" || layer === "scripts" || layer === "screenplays"
    ? populationFiles(
        graph,
        authoredPopulationFiles(graph, layer).map((file: string): string => `${DOCS}/${file}`),
        ".md",
      )
    : walkProjectFiles(graph, path.join(graph.location, DOCS, layer), ".md");
}

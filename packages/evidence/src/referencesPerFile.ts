import path from "node:path";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";
import { DOCS } from "./DOCS";
import { markdownPopulationFiles } from "./markdownPopulationFiles";
import { posix } from "./posix";

/**
 * Create one Markdown reference for each current scoped file so file-level foundation duties remain independently addressed.
 *
 * @evidence contracts/common.md#principled-implementation Create one Markdown reference for each current scoped file so file-level foundation duties remain independently addressed.
 * @evidence contracts/common.md#clear-and-simple-design Physical population selection is shared with host admission while this helper owns symbol and exclusion policy projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No empty-population fallback is added; review is forwarded as supplied and current graph callers pass false.
 * @evidence contracts/common.md#meaningful-documentation Targets are docs-relative physical file addresses and returned policy records are fresh.
 * @evidence contracts/performance.md#efficient-algorithms The physical walk dominates; mapping and relative-path conversion add linear work in selected file count and path bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Selected paths are used once per call; calls from separate claims currently repeat physical population selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns reference records and arrays; synchronous walker resources do not outlive construction.
 */
export function referencesPerFile(graph: IAutoMovieEvidenceConfigProps, directory: AutoMovieAuthoredDocumentLayer, symbol: "file" | "h2" | "h3" | "h4", review: boolean, noEvidenceExclude: boolean = false): ITtscEvidenceGraphReference[] {
  const root: string = path.join(graph.location, DOCS);
  return markdownPopulationFiles(graph, directory).map((file: string): { type: "markdown"; root: string; files: string[]; symbol: "file" | "h2" | "h3" | "h4"; noEvidenceExclude: boolean; requireReview: boolean; } => ({
    type: "markdown",
    root: DOCS,
    files: [posix(path.relative(root, file))],
    symbol,
    noEvidenceExclude,
    requireReview: review,
  }));
}

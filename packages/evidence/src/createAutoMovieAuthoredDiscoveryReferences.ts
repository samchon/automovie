import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieProductionKind } from "./AutoMovieProductionKind";
import { selectAutoMovieAuthoredContractFiles } from "./selectAutoMovieAuthoredContractFiles";


/** Binds a layer's open searches to its work-specific contract hosts.
 *
 * @evidence contracts/common.md#principled-implementation Work-specific discovery paths become ordered H2 Markdown references rooted at docs with no companion review requirement.
 * @evidence contracts/common.md#clear-and-simple-design Discovery references remain separate from per-unit principle checklists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only selector-owned contract paths govern searches; no copied production content or review fingerprint is fabricated.
 * @evidence contracts/common.md#meaningful-documentation The comment states open-search target ownership, and records retain exact paths and H2 symbols.
 * @evidence contracts/performance.md#efficient-algorithms Mapping the small fixed selector inventory is O(1) relative to authored file population.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared work-specific selector decides paths once for this call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only reference records escape to the graph owner; no source bytes or descriptors are acquired.
 */
export function createAutoMovieAuthoredDiscoveryReferences(
  kind: AutoMovieProductionKind | null,
  layer: AutoMovieAuthoredDocumentLayer,
): ITtscEvidenceGraphMarkdownReference[] {
  return selectAutoMovieAuthoredContractFiles(kind, layer).discovery.map(
    (file: string) : { type: "markdown"; root: string; files: string[]; symbol: "h2"; requireReview: false; } => ({
      type: "markdown",
      root: "docs",
      files: [file],
      symbol: "h2",
      requireReview: false,
    }),
  );
}

import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieProductionKind } from "./AutoMovieProductionKind";
import { selectAutoMovieAuthoredContractFiles } from "./selectAutoMovieAuthoredContractFiles";


/** Binds each applicable principle to every selected authored unit.
 *
 * @evidence contracts/common.md#principled-implementation Work-specific principle paths become complete H2 checklists with exclusions forbidden and companion rows disabled.
 * @evidence contracts/common.md#clear-and-simple-design The selector owns path routing while this producer owns mandatory per-unit principle policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target is narrowed for a fixture or omitted to pass coverage; explicit noEvidenceExclude preserves complete applicable duties.
 * @evidence contracts/common.md#meaningful-documentation The comment states every selected authored unit's principle relationship and native record fields expose policy.
 * @evidence contracts/performance.md#efficient-algorithms One small fixed path population is mapped to native references in O(1) work relative to production size.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared contract selection prevents a duplicate principle matrix.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The graph owner receives fresh records and file arrays without resident source text or resources.
 */
export function createAutoMovieAuthoredPrincipleReferences(
  kind: AutoMovieProductionKind | null,
  layer: AutoMovieAuthoredDocumentLayer,
): ITtscEvidenceGraphMarkdownReference[] {
  return selectAutoMovieAuthoredContractFiles(kind, layer).principles.map(
    (file: string) : { type: "markdown"; root: string; files: string[]; symbol: "h2"; checklist: true; noEvidenceExclude: true; requireReview: false; } => ({
      type: "markdown",
      root: "docs",
      files: [file],
      symbol: "h2",
      checklist: true,
      noEvidenceExclude: true,
      requireReview: false,
    }),
  );
}

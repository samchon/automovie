import type { ITtscEvidenceGraphMarkdownReference } from "@ttsc/evidence";
import { selectAutoMovieScreenplayNaturalnessContractFiles } from "./selectAutoMovieScreenplayNaturalnessContractFiles";


/** Binds every final screenplay unit to every selected naturalness target.
 *
 * @evidence contracts/common.md#principled-implementation Each selected final-screenplay contract becomes an H2 checklist requiring every target without evidence exclusions and without companion review rows.
 * @evidence contracts/common.md#clear-and-simple-design The reference producer owns naturalness checklist policy; its file selector owns required routes to project-owned resident documents without supplying their content.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unused review input remains; the constructor preserves every selected target and disables native companion requirements explicitly.
 * @evidence contracts/common.md#meaningful-documentation The comment states every final unit's target relationship and the returned native references carry explicit root and checklist fields.
 * @evidence contracts/performance.md#efficient-algorithms Three selected paths become three records in O(1) work relative to production size.
 * @evidence contracts/performance.md#reuse-equivalent-work One path selector and one reference construction pass serve all final units through graph selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned reference records and file arrays transfer to the graph owner without source content or file handles.
 */
export function createAutoMovieScreenplayNaturalnessReferences(): ITtscEvidenceGraphMarkdownReference[] {
  return selectAutoMovieScreenplayNaturalnessContractFiles().map((file: string) : { type: "markdown"; root: string; files: string[]; symbol: "h2"; checklist: true; noEvidenceExclude: true; requireReview: false; } => ({
    type: "markdown",
    root: "docs",
    files: [file],
    symbol: "h2",
    checklist: true,
    noEvidenceExclude: true,
    requireReview: false,
  }));
}

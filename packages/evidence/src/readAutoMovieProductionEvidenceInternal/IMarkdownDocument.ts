import type { IAutoMovieProductionEvidenceUnit } from "../IAutoMovieProductionEvidenceUnit";


/**
 * One governed Markdown document's path, title and ordered H2 units.
 *
 * @evidence contracts/common.md#principled-implementation A canonical project-relative path, governed H1 and ordered H2 units represent one read document.
 * @evidence contracts/common.md#clear-and-simple-design An internal document record is shared by design and contract output projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fields retain parsed source identity without generated prose scores.
 * @evidence contracts/common.md#meaningful-documentation Members document path, governed title and unit order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased document shape performs no filesystem acquisition; readMarkdownDocument returns path/title/unit records that readAutoMovieProductionEvidence projects into caller-owned owner and contract inventories.
 *
 *
 * @author Samchon
 */
export interface IMarkdownDocument {
  /** Canonical project-relative POSIX document path. */
  path: string;

  /** Governed document's sole visible H1 title. */
  title: string;

  /** Complete governed H2 unit inventory in document order. */
  units: IAutoMovieProductionEvidenceUnit[];
}

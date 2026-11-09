import type { EvidenceMetadataRewriteOwnership } from "./EvidenceMetadataRewriteOwnership";
import type { IEvidenceMetadataRenderedSample } from "./IEvidenceMetadataRenderedSample";
import type { IEvidenceMetadataRewriteFile } from "./IEvidenceMetadataRewriteFile";

/**
 * Reproducible result of one successful evidence-metadata rewrite check.
 *
 * @evidence contracts/development/design.md#principled-representation A successful result carries ownership, bulk state, sorted file results and a validated optional sample.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The report separates comparison evidence from the input request.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The coordinator creates this report only after diagnostics are empty.
 * @evidence contracts/development/common.md#meaningful-documentation Properties identify sorted coverage and when sample data is included.
 */
export interface IEvidenceMetadataRewriteReport {
  /** Exact mutable metadata region this report proved. */
  ownership: EvidenceMetadataRewriteOwnership;

  /** Whether this operation required a rendered readability sample. */
  bulk: boolean;

  /** Every compared file, sorted by path. */
  files: IEvidenceMetadataRewriteFile[];

  /** Validated sample record when the operation was bulk. */
  renderedSample?: IEvidenceMetadataRenderedSample;
}

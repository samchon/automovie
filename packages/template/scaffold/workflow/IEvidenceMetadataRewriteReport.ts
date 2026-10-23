import type { EvidenceMetadataRewriteOwnership } from "./EvidenceMetadataRewriteOwnership";
import type { IEvidenceMetadataRenderedSample } from "./IEvidenceMetadataRenderedSample";
import type { IEvidenceMetadataRewriteFile } from "./IEvidenceMetadataRewriteFile";

/** Reproducible result of one successful evidence-metadata rewrite check. */
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

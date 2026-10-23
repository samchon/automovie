import type { EvidenceMetadataRewriteOwnership } from "./EvidenceMetadataRewriteOwnership";
import type { IEvidenceMetadataRenderedSample } from "./IEvidenceMetadataRenderedSample";
import type { IEvidenceMetadataRewriteFile } from "./IEvidenceMetadataRewriteFile";

/**
 * Reproducible result of one successful evidence-metadata rewrite check.
 *
 * @evidence contracts/common.md#principled-implementation A successful result carries ownership, bulk state, sorted file results and a validated optional sample.
 * @evidence contracts/common.md#clear-and-simple-design The report separates comparison evidence from the input request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The coordinator creates this report only after diagnostics are empty.
 * @evidence contracts/common.md#meaningful-documentation Properties identify sorted coverage and when sample data is included.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
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

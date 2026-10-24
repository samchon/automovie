import type { EvidenceMetadataRewriteOwnership } from "./EvidenceMetadataRewriteOwnership";
import type { IEvidenceMetadataRenderedSample } from "./IEvidenceMetadataRenderedSample";

/**
 * Selects the two trees and exact Markdown population of a metadata rewrite.
 *
 * @evidence contracts/common.md#principled-implementation One record selects original and candidate roots, ownership and optional paths and sample.
 * @evidence contracts/common.md#clear-and-simple-design The request groups one comparison boundary without positional coupling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional population and bulk fields express supported operations without waiving byte protection.
 * @evidence contracts/common.md#meaningful-documentation Properties state root roles, omitted-files union semantics and bulk sample requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export interface IEvidenceMetadataRewriteProps {
  /** Immutable tree containing the bytes before the scoped operation. */
  beforeRoot: string;

  /** Candidate tree containing the bytes after the scoped operation. */
  afterRoot: string;

  /** Metadata region the operation promises is its only mutable surface. */
  ownership: EvidenceMetadataRewriteOwnership;

  /**
   * Relative Markdown paths the operation owns.
   *
   * Omit this to compare the union of every Markdown file in both roots.
   */
  files?: string[];

  /** Marks a single-file operation as bulk; multi-file changes infer it. */
  bulk?: boolean;

  /** Required auditable readability record for a bulk metadata rewrite. */
  renderedSample?: IEvidenceMetadataRenderedSample;
}

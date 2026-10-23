import type { IMetadataFragment } from "./IMetadataFragment";
import type { IProjectionSegment } from "./IProjectionSegment";

/**
 * Captures protected bytes, metadata, and exact source-position mappings.
 *
 * @evidence contracts/common.md#principled-implementation The record combines protected bytes, declarations, removed fragments, original bytes and span mappings.
 * @evidence contracts/common.md#clear-and-simple-design One projection serves comparison, hashing, diagnostics and sample checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original bytes are retained rather than reconstructed from normalized text.
 * @evidence contracts/common.md#meaningful-documentation Properties state one-based declaration lines, original-buffer role and byte mapping semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export interface IProtectedProjection {
  /** Ordered source bytes after only owned metadata is removed. */
  bytes: Buffer;

  /** Original one-based lines mapped to their exact structural declarations. */
  declarations: Map<number, string>;

  /** Removed metadata fragments and their insertion anchors. */
  metadata: IMetadataFragment[];

  /** Complete immutable source bytes used for diagnostic locations. */
  original: Buffer;

  /** Protected span mappings from projection back to original bytes. */
  segments: IProjectionSegment[];
}

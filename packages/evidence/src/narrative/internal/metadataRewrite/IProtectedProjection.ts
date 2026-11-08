import type { IMetadataFragment } from "./IMetadataFragment";
import type { IProjectionSegment } from "./IProjectionSegment";

/**
 * Captures protected bytes, metadata, and exact source-position mappings.
 *
 * @evidence contracts/development/design.md#principled-representation The record combines protected bytes, declarations, removed fragments, original bytes and span mappings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One projection serves comparison, hashing, diagnostics and sample checks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original bytes are retained rather than reconstructed from normalized text.
 * @evidence contracts/development/common.md#meaningful-documentation Properties state one-based declaration lines, original-buffer role and byte mapping semantics.
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

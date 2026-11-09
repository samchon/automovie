import type { EvidenceMetadataRewriteOwnership } from "./EvidenceMetadataRewriteOwnership";
import type { IEvidenceMetadataRenderedSample } from "./IEvidenceMetadataRenderedSample";

/**
 * Selects the two trees and exact Markdown population of a metadata rewrite.
 *
 * @evidence contracts/development/design.md#principled-representation One record selects original and candidate roots, ownership and optional paths and sample.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The request groups one comparison boundary without positional coupling.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional population and bulk fields express supported operations without waiving byte protection.
 * @evidence contracts/development/common.md#meaningful-documentation Properties state root roles, omitted-files union semantics and bulk sample requirements.
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

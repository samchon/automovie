import type { EvidenceMetadataRewriteOwnership } from "./EvidenceMetadataRewriteOwnership";
import type { IEvidenceMetadataRenderedSample } from "./IEvidenceMetadataRenderedSample";

/** Selects the two trees and exact Markdown population of a metadata rewrite. */
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

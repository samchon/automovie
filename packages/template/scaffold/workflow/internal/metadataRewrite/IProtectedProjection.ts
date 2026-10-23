import type { IMetadataFragment } from "./IMetadataFragment";
import type { IProjectionSegment } from "./IProjectionSegment";

/** Captures protected bytes, metadata, and exact source-position mappings. */
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

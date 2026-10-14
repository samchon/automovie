import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A person catalogue entry as the page reads it: the wire entry with its document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation Narrows the shared server entry to person domain and canonical whole-person numerical document type for page dispatch.
 * @evidence contracts/common.md#clear-and-simple-design Reuses id/key/basis wire fields instead of rebuilding the Person schema inside Viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The page type view does not admit JSON or join incompatible basis assets; the actual Person owner can still refuse construction.
 * @evidence contracts/common.md#meaningful-documentation Documents whole-person discriminator/document and inherits paired basis/source cache identity from the base entry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This subtype erases; catalogue/key projection and Person numerical/GPU work remain in their consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work Person reuse requires full document, paired basis digests and all three numerical sources, not type/id equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page borrows catalogue/document snapshots until replacement; this subtype creates no numerical process or GPU cache.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `person`. */
  domain: "person";

  /** The person document. */
  document: IAutoMovieHumanPersonDocument;
}

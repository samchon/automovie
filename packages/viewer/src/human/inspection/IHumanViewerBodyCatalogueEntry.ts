import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A body catalogue entry as the page reads it: the wire entry with its document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation Narrows the shared server entry to body domain and its canonical Human body document type for page consumers.
 * @evidence contracts/common.md#clear-and-simple-design Extends common id/key/basis fields rather than defining a second body schema or catalogue identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A typed page projection is not runtime admission; the actual domain owner still validates the document before producing geometry.
 * @evidence contracts/common.md#meaningful-documentation Documents the body discriminator and document type while retaining the base entry's source/basis/cache authority meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface erases; catalogue projection and actual body build own document-sized processing.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared entry keys carry document/basis/builder identity; body type equality or document id alone cannot justify model-cache reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page borrows entry/document snapshots until catalogue replacement; this subtype owns no worker, resident or additional retention map.
 *
 * @author Samchon
 */
export interface IHumanViewerBodyCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `body`. */
  domain: "body";

  /** The body document. */
  document: IAutoMovieHumanBodyBasisDocument;
}

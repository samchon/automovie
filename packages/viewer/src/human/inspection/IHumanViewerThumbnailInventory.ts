import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * What a thumbnail path is derived from: the source revision and each document's id and cache key.
 *
 * @evidence contracts/common.md#principled-implementation Thumbnail identity combines source revision and document id/cache key using a 16-hex revision prefix; changed authority normally selects another path, while prefix collisions are not excluded by this representation.
 * @evidence contracts/common.md#clear-and-simple-design A readonly projection of catalogue entries exposes only the fields used to derive thumbnail paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Keys come from document/basis/source authority rather than a hardcoded image assigned to a subject name.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish the revision folder from each document's id/key pair.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This inventory projection selects no image encoding or path-hashing algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Matching source revision and document key permit current-thumbnail reuse; older revision images are explicitly stale rather than equivalent current results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The inventory retains no image bytes or open image handles; thumbnail storage owns its revision directories separately.
 *
 * @author Samchon
 */
export interface IHumanViewerThumbnailInventory {
  /** Source revision whose folder holds the thumbnail. */
  revision: string;

  /** Documents with their cache keys. */
  documents: readonly Pick<IHumanViewerCatalogueEntry, "id" | "key">[];
}

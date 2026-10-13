import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * What a thumbnail path is derived from: the source revision and each document's id and cache key.
 *
 * @author Samchon
 */
export interface IHumanViewerThumbnailInventory {
  /** Source revision whose folder holds the thumbnail. */
  revision: string;

  /** Documents with their cache keys. */
  documents: readonly Pick<IHumanViewerCatalogueEntry, "id" | "key">[];
}

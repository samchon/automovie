import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * What a thumbnail path is derived from: the source revision and each document's id and cache key.
 *
 * @evidence contracts/common.md#principled-implementation Thumbnail addresses pair source revision with each document's own identity and cache key.
 * @evidence contracts/common.md#clear-and-simple-design A readonly projection borrows catalogue identity fields without exposing complete authoring documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A thumbnail source revision and document key remain explicit rather than inferred from the image bytes.
 * @evidence contracts/common.md#meaningful-documentation Documents the revision folder authority and readonly document identity/key population.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-output-naming Thumbnail addresses pair source revision with each document's own identity and cache key.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity A readonly projection borrows catalogue identity fields without exposing complete authoring documents.
 * @author Samchon
 */
export interface IHumanViewerThumbnailInventory {
  /**
   * Source revision whose folder holds the thumbnail.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-output-naming Source revision whose folder holds the thumbnail. Thumbnail addresses pair source revision with each document's own identity and cache key.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source revision whose folder holds the thumbnail. A readonly projection borrows catalogue identity fields without exposing complete authoring documents.
   */
  revision: string;

  /**
   * Documents with their cache keys.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-output-naming Documents with their cache keys. Thumbnail addresses pair source revision with each document's own identity and cache key.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Documents with their cache keys. A readonly projection borrows catalogue identity fields without exposing complete authoring documents.
   */
  documents: readonly Pick<IHumanViewerCatalogueEntry, "id" | "key">[];
}

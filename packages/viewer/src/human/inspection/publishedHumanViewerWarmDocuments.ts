import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * The automatic warm population promised by the viewer: published faces and standard body states. Hand-written inputs and assembled people remain explicit consumer requests; registering them does not authorize background work that delays every interactive request behind their first build.
 *
 * @evidence contracts/common.md#principled-implementation The actual catalogue is filtered to published non-Person entries and excludes file-prefixed hand-written inputs.
 * @evidence contracts/common.md#clear-and-simple-design One domain/id filter defines automatic background population without numerical example construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registering a Person or file input alone does not authorize its first build to delay interactive requests.
 * @evidence contracts/common.md#meaningful-documentation Documentation separates automatic published warming from explicit assembled-person and hand-written consumers.
 * @evidence contracts/performance.md#efficient-algorithms One pass over document entries performs constant per-entry domain and prefix checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Selected entry objects are reused without copying documents; cache-key/warm-pass sharing remains downstream.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The filtered array borrows entry references and owns no worker, queued build or resident allocation.
 */
export function publishedHumanViewerWarmDocuments<
  Document extends IHumanViewerCatalogueEntry,
>(documents: readonly Document[]): Document[] {
  return documents.filter(
    (entry: Document): boolean =>
      entry.domain !== "person" && !entry.id.startsWith("file:"),
  );
}

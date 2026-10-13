import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * The automatic warm population promised by the viewer: published faces and
 * standard body states. Hand-written inputs and assembled people remain
 * explicit consumer requests; registering them does not authorize background
 * work that delays every interactive request behind their first build.
 */
export function publishedHumanViewerWarmDocuments<
  Document extends IHumanViewerCatalogueEntry,
>(documents: readonly Document[]): Document[] {
  return documents.filter(
    (entry) => entry.domain !== "person" && !entry.id.startsWith("file:"),
  );
}

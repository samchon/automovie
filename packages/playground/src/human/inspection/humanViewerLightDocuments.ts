import type { HumanViewerCatalogue } from "@automovie/viewer/human/inspection/HumanViewerCatalogue";

/**
 * Project the admitted catalogue into the documents whose product viewport
 * supports studio-light inspection. Body and composed Person use the Body
 * viewport; Face does not expose its setter. The controls consume this fresh
 * set on catalogue replacement and hide the form for an absent or Face id.
 * Inputs remain caller-owned; the result contains no numerical documents.
 */
export function humanViewerLightDocuments(
  documents: readonly Pick<
    HumanViewerCatalogue["documents"][number],
    "id" | "domain"
  >[],
): Set<string> {
  return new Set(
    documents
      .filter((entry) => entry.domain !== "face")
      .map((entry) => entry.id),
  );
}

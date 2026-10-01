import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";

/**
 * Project the admitted catalogue into the documents whose product viewport
 * supports studio-light inspection. Body and composed Person use the Body
 * viewport; Face does not expose its setter. The controls consume this fresh
 * set on catalogue replacement and hide the form for an absent or Face id.
 * Inputs remain caller-owned; the result contains no numerical documents.
 *
 * @evidence contracts/common.md#principled-implementation Projects the declared Body/Person viewport capability without guessing from document-name prefixes.
 * @evidence contracts/common.md#clear-and-simple-design Keeps catalogue capability projection independent of DOM and numerical content.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses catalogue domains rather than subject identities or manually seeded document lists.
 * @evidence contracts/common.md#meaningful-documentation Explains the consuming controls and why Face and absent documents remain unsupported.
 */
export function humanViewerLightDocuments(
  documents: readonly Pick<HumanViewerCatalogue["documents"][number], "id" | "domain">[],
): Set<string> {
  return new Set(documents.filter((entry) => entry.domain !== "face").map((entry) => entry.id));
}

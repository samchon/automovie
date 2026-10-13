import type { HumanViewerCatalogue } from "@automovie/viewer/human/inspection/HumanViewerCatalogue";

/**
 * Project the admitted catalogue into the documents whose product viewport supports studio-light inspection. Body and composed Person use the Body viewport; Face does not expose its setter. The controls consume this fresh set on catalogue replacement and hide the form for an absent or Face id. Inputs remain caller-owned; the result contains no numerical documents.
 *
 * @evidence contracts/common.md#principled-implementation Non-Face catalogue domains identify existing Body/Person studio-light capability, and Set membership deduplicates ids without changing numerical documents.
 * @evidence contracts/common.md#clear-and-simple-design One catalogue projection supplies UI capability membership while actual light setters and display remain with the product viewport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Face receives no fabricated light setter and capability selection follows domain rather than a hand-kept subject name list.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies supported domains, fresh catalogue replacement, absent-id hiding and caller-owned parameter data.
 * @evidence contracts/performance.md#efficient-algorithms One n-document scan inserts supported ids in O(n) expected time and O(a) retained set entries for a distinct supported ids without intermediate filtered/mapped arrays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability query retains no cross-revision cache; controls replace membership when the catalogue changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only id strings remain in the returned set and the helper acquires no document frame or light resource.
 */
export function humanViewerLightDocuments(
  documents: readonly Pick<
    HumanViewerCatalogue["documents"][number],
    "id" | "domain"
  >[],
): Set<string> {
  const ids: Set<string> = new Set();
  for (const entry of documents) if (entry.domain !== "face") ids.add(entry.id);
  return ids;
}

import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";

/**
 * The address after one part is switched into or out of the isolated set (`parts`, only these are shown) or the hidden set (`hide`, these are not). A part is listed once, in the order it was chosen; switching a part off removes it and an empty set means no restriction. The rest of the address, the camera included, is kept, so the frame changes only by that part.
 *
 * @evidence contracts/common.md#principled-implementation Removing prior occurrences before optional insertion makes membership unique and keeps the selected part's latest choice at the end while preserving all other address fields.
 * @evidence contracts/common.md#clear-and-simple-design One immutable address edit serves isolation and hiding through the chosen set without owning display or mesh lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact reported mesh names drive membership and no renamed or missing part is silently mapped to another geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment defines isolation/hiding, stable other-member order, empty-set meaning and preservation of camera/address fields.
 * @evidence contracts/performance.md#efficient-algorithms Filtering p selected names and optionally appending one costs O(p) time and output references; the shallow address copy preserves other collection identities without deep copying display metadata.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Membership authoring is a display effect and shares no numerical computation or cached mesh result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned ordinary address owns its new member array, while this helper acquires no mesh, listener or renderer resource.
 */
export function changeHumanViewerParts(
  address: HumanViewerAddress,
  name: string,
  set: "parts" | "hide",
  on: boolean,
): HumanViewerAddress {
  const others: string[] = address[set].filter(
    (part: string): boolean => part !== name,
  );
  return { ...address, [set]: on ? [...others, name] : others };
}

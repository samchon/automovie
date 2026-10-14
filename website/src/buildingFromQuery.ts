import type { Building } from "./Building";

/**
 * Read the first building query value and reject absent or unsupported compressed-tour addresses instead of presenting another production.
 *
 * @evidence contracts/common.md#principled-implementation URLSearchParams performs browser query decoding, followed by membership in the three exporter-supported routes; duplicate parameters follow the API's first-value behavior.
 * @evidence contracts/common.md#clear-and-simple-design Address admission belongs at the tour fetch boundary and returns the same Building discriminator used by exportTourData.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported addresses throw rather than using a fallback production or fixture-specific alias.
 * @evidence contracts/common.md#meaningful-documentation The comment states the first-value rule, accepted address purpose and failure effect.
 * @evidence contracts/performance.md#efficient-algorithms Query decoding costs O(Q) time and storage in query length; checking three supported names adds constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The current query is parsed once per call; no retained result can outlive a changed browser address.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary query parser becomes unreachable on return or throw; no event listener or task is acquired.
 */
export const buildingFromQuery: (query: string) => Building = (query: string): Building => {
  const building: string | null = new URLSearchParams(query).get("building");
  if (building !== "ancient" && building !== "modern" && building !== "future")
    throw new Error(
      "Choose a building from the collection to open its 3D tour.",
    );
  return building;
};

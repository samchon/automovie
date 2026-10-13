import {
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";

/**
 * Index a mask by the scene node ids that draw each entry.
 *
 * The viewer holds objects, not semantics; this is the join it uses. Built as
 * one map rather than searched per mesh, because a structural pass touches
 * every drawable in the scene once per frame.
 *
 * @evidence contracts/common.md#principled-implementation Map every entry's drawing node ids to the borrowed entry, also mapping instance-set entry ids to their viewer group name; validated mask ownership prevents conflicting node claims.
 * @evidence contracts/common.md#clear-and-simple-design One map performs the viewer-object/semantic-entry join instead of searching the entire mask per rendered mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Instance-set id indexing follows the actual group naming contract; no fixture alias is added. Invalid conflicting inputs would use the last entry, so verifier admission remains required.
 * @evidence contracts/common.md#meaningful-documentation Docs identify the borrowed entry map, ordinary node ids and the additional batched-group key convention.
 * @evidence contracts/performance.md#efficient-algorithms N node references plus I instance-set entries require O(N+I) map writes/storage and expected O(1) later lookup per drawable.
 * @evidence contracts/performance.md#reuse-equivalent-work A viewer pass builds the index once and reuses it for all meshes; changed mask entries/ownership require rebuilding rather than caching by mutable object identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the map for its pass lifetime and entries remain mask-owned; no renderer object or disposal handle is retained.
 */
export const autoMovieSemanticMaskNodeIndex: (mask: IAutoMovieSemanticMask) => Map<string, IAutoMovieSemanticMaskEntry> = (
  mask: IAutoMovieSemanticMask,
): Map<string, IAutoMovieSemanticMaskEntry> => {
  const index: Map<string, IAutoMovieSemanticMaskEntry> = new Map<string, IAutoMovieSemanticMaskEntry>();
  for (const entry of mask.entries) {
    for (const node of entry.nodes) index.set(node, entry);
    // An instance set's viewer group carries the entry's own id as its name,
    // so the same index resolves batched geometry without a second lookup.
    if (entry.kind === "instance-set") index.set(entry.id, entry);
  }
  return index;
};

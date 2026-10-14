import { productionRootNamespaceReleaseCoordinate } from "./productionRootNamespaceReleaseCoordinate";

/**
 * Release an acquired coordinate sequence in reverse order without changing the caller's array. Every release delegates exact-token ownership to the commit-lock owner.
 *
 * @evidence contracts/common.md#principled-implementation Reverses a copy of the acquired sequence so retirement opposes acquisition order without mutating the caller's lease inventory.
 * @evidence contracts/common.md#clear-and-simple-design One set-retirement helper serves root, production and creation leases, sharing the single-coordinate release boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No path-only deletion bypasses token proof, and the established void release API does not provide an all-resources-freed guarantee.
 * @evidence contracts/common.md#meaningful-documentation States reverse order, caller-array preservation and the underlying release-completion limitation.
 * @evidence contracts/performance.md#efficient-algorithms Copies and traverses C coordinate pairs in O(C) work and temporary references, in addition to each lock's native release cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses exact acquired pairs and process-local depth; repeated release is not cached or treated as proof of previous native completion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the supplied nesting levels through their owners, while native cleanup failure can retain fences or backups; it keeps no independent lease registry.
 */
export const productionRootNamespaceReleaseCoordinates: (leases: readonly { path: string; token: string }[]) => void = (
  leases: readonly { path: string; token: string }[],
): void => {
  for (const lease of [...leases].reverse()) productionRootNamespaceReleaseCoordinate(lease);
};

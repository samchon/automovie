import { type BigIntStats } from "node:fs";
import path from "node:path";
import { productionRootNamespaceCoordinatePath } from "./productionRootNamespaceCoordinatePath";

/**
 * Name both the requested child path and the resolved parent device/inode plus case-folded child name, so path aliases and physical-parent aliases share a creation fence.
 *
 * @evidence contracts/common.md#principled-implementation Uses two distinct coordinate domains for lexical child path and observed physical parent identity, avoiding reliance on only one alias representation.
 * @evidence contracts/common.md#clear-and-simple-design Owns the creation-coordinate composition while the shared path formatter handles hashing and external directory authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parent bigint identity is stringified without numeric rounding, and case folding intentionally over-coordinates POSIX child spellings.
 * @evidence contracts/common.md#meaningful-documentation Documents the two witnesses and case-folding tradeoff; naming alone does not acquire or preserve the parent's identity.
 * @evidence contracts/performance.md#efficient-algorithms Builds exactly two coordinates with cost following parent path, child name and bigint digit lengths, plus formatter suitability checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same naming domains and resolved root, but current parent identity remains supplied by the acquisition owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns two path strings and no lease or descriptor; actual creation locks belong to the subsequent acquisition scope.
 */
export const productionRootNamespaceCreationCoordinates: (parentReal: string, childName: string, parentIdentity: BigIntStats) => string[] = (
  parentReal: string,
  childName: string,
  parentIdentity: BigIntStats,
): string[] => {
  return [
    productionRootNamespaceCoordinatePath("create-path", path.join(parentReal, childName)),
    productionRootNamespaceCoordinatePath(
      "create-id",
      `${parentIdentity.dev}\0${parentIdentity.ino}\0${childName.toLowerCase()}`,
    ),
  ];
};

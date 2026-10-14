import type { BigIntStats, Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionRootNamespaceLstatOrNull } from "./productionRootNamespaceLstatOrNull";

/**
 * Return bigint stat identity only for a currently physical directory; absence, symlink and nondirectory observations return null, while other filesystem errors propagate.
 *
 * @evidence contracts/common.md#principled-implementation lstat rejects links and nondirectories before bigint stat supplies dev/ino without numeric precision loss.
 * @evidence contracts/common.md#clear-and-simple-design One physical-directory witness is reused by parent, canonical-root and requested-root checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null represents an inadmissible finite observation, never permission to silently recreate a leased directory or follow a replacement link.
 * @evidence contracts/common.md#meaningful-documentation Documents null/refusal meaning, bigint identity and propagation of errors beyond recognized absence.
 * @evidence contracts/performance.md#efficient-algorithms Uses at most one lstat and one stat, with constant application bookkeeping and provider-dependent filesystem latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the canonical witness procedure but repeats native observations because directory identity is mutable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Native stat returns values rather than descriptors; no handle or long-lived identity registry is retained.
 */
export const productionRootNamespacePhysicalDirectoryIdentityOrNull: (directory: string) => BigIntStats | null = (
  directory: string,
): BigIntStats | null => {
  const linked: Stats | null = productionRootNamespaceLstatOrNull(directory);
  return linked === null ||
    linked.isSymbolicLink() ||
    linked.isDirectory() === false
    ? null
    : fileSystem.statSync(directory, { bigint: true });
};

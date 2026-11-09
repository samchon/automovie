import * as fs from "node:fs";

/**
 * Admission for reading or capturing a scaffold file: a regular file, not a symbolic link. Any number of directory entries may name it; the in-place rewrite separately requires exactly one through {@link assertOrdinarySingleLinkFile}.
 *
 * @evidence contracts/common.md#principled-implementation A bigint lstat must name a regular non-symlink file; reading such a file is safe whatever its link count, because no other name observes a read.
 * @evidence contracts/common.md#clear-and-simple-design One admission predicate serves pathname capture; the stricter single-link predicate stays with the descriptor that rewrites in place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Symbolic links and non-regular entries are still refused, so a capture never follows a link out of the scaffold.
 * @evidence contracts/common.md#meaningful-documentation The comment states the regular-file and symlink conditions and why the link count is not one of them.
 * @evidence contracts/performance.md#efficient-algorithms Two stat predicates cost constant work per observed file.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh stats remain distinct filesystem observations; admission caches no earlier verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate owns only the supplied stat reference and opens no descriptor or retained task.
 */
export const assertOrdinaryFile: (status: fs.BigIntStats, file: string) => void = (
  status: fs.BigIntStats,
  file: string,
): void => {
  if (status.isSymbolicLink() || status.isFile() === false)
    throw new Error(`scaffold file is not one ordinary file: ${file}`);
};

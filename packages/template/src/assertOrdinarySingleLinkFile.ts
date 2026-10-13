import * as fs from "node:fs";


/**
 * Admission for the in-place rewrite: a regular file, not a symbolic link,
 * that exactly one directory entry names, because the rewrite changes the
 * inode every other name would show.
 *
 * @evidence contracts/common.md#principled-implementation A bigint stat must name a regular non-symlink file with exactly one hard link before in-place replacement.
 * @evidence contracts/common.md#clear-and-simple-design One admission predicate is shared by pathname capture and descriptor verification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Multiply linked files are refused because truncating their inode would change every linked name.
 * @evidence contracts/common.md#meaningful-documentation The comment states the regular-file, symlink and link-count conditions and their reason.
 * @evidence contracts/performance.md#efficient-algorithms A fixed set of stat predicates and one bigint comparison costs constant work per observed file.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh stats remain distinct filesystem observations; admission does not cache an earlier verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate owns only the supplied stat reference and opens no descriptor or retained task.
 */
export const assertOrdinarySingleLinkFile: (status: fs.BigIntStats, file: string) => void = (
  status: fs.BigIntStats,
  file: string,
): void => {
  if (
    status.isSymbolicLink() ||
    status.isFile() === false ||
    status.nlink !== 1n
  )
    throw new Error(
      `scaffold file is not one ordinary single-link file: ${file}`,
    );
};

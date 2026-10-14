import type { BigIntStats, Stats } from "node:fs";
import path from "node:path";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import type { IAutoMovieProductionRootNamespaceLease } from "./IAutoMovieProductionRootNamespaceLease";
import { productionRootNamespacePhysicalDirectoryIdentityOrNull } from "./productionRootNamespacePhysicalDirectoryIdentityOrNull";
import { productionRootNamespaceLstatOrNull } from "./productionRootNamespaceLstatOrNull";

/**
 * Refuse a held reservation whose canonical root no longer has its recorded device/inode or whose coordinate file is absent, nonregular, linked, unreadable or no longer contains its exact token.
 *
 * @evidence contracts/common.md#principled-implementation Combines fresh physical-directory identity with current regular-file and exact-token checks across every held coordinate before admitting continued mutation.
 * @evidence contracts/common.md#clear-and-simple-design One lease assertion serves importer and project mutation callers, while requested-path stability remains a separate check at acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable token evidence is invalid rather than proof of permission; no fallback reacquires or repairs a replaced root under this lease.
 * @evidence contracts/common.md#meaningful-documentation Names root and token failure conditions and that callers must reassert at mutation boundaries because finite checks do not eliminate later filesystem races.
 * @evidence contracts/performance.md#efficient-algorithms For C held coordinates, performs up to C stats/token reads plus one root observation, with O(T) token-byte temporary storage; find stops at the first invalid coordinate.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the lease's original identity and tokens as witnesses, but rereads current entries because retained path strings do not prove continuing ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no new lock and transfers no descriptor; on refusal the caller still owns lease cleanup, which must not mutate a replacement root's resident namespace.
 */
export const assertProductionRootNamespaceLease: (lease: IAutoMovieProductionRootNamespaceLease) => void = (
  lease: IAutoMovieProductionRootNamespaceLease,
): void => {
  const current: BigIntStats | null = productionRootNamespacePhysicalDirectoryIdentityOrNull(lease.root);
  const invalidLock: { path: string; token: string; } | undefined = lease.locks.find((leaseLock: { path: string; token: string; }): boolean => {
    const lock: Stats | null = productionRootNamespaceLstatOrNull(leaseLock.path);
    if (lock === null || lock.isSymbolicLink() || lock.isFile() === false)
      return true;
    const root: string = path.dirname(leaseLock.path);
    try {
      return (
        Buffer.from(
          readAutoMovieProductionOwnedFile({
            root,
            directory: root,
            relative: path.basename(leaseLock.path),
          }),
        ).toString("utf8") !== leaseLock.token
      );
    } catch {
      return true;
    }
  });
  if (
    current === null ||
    current.dev.toString() !== lease.device ||
    current.ino.toString() !== lease.inode ||
    invalidLock !== undefined
  )
    throw new Error(
      `Production project root identity or namespace fence changed while "${lease.root}" was held. No unfenced project mutation is allowed.`,
    );
};

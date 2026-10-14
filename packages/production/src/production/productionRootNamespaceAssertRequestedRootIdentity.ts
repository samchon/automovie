import type { BigIntStats } from "node:fs";
import type { IAutoMovieProductionRootNamespaceLease } from "./IAutoMovieProductionRootNamespaceLease";
import { productionRootNamespacePhysicalDirectoryIdentityOrNull } from "./productionRootNamespacePhysicalDirectoryIdentityOrNull";

/**
 * Refuse when the caller's original root spelling no longer names the dev/ino recorded by its held lease, including absence, symlink or nondirectory replacement.
 *
 * @evidence contracts/common.md#principled-implementation A current physical-directory observation is compared as bigint decimal strings with the acquired device/inode witness.
 * @evidence contracts/common.md#clear-and-simple-design Separates requested-name stability from canonical-root/token lease validation, because an alias or rename can change one without changing the other.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No realpath repair or fallback rebinds a lease to a replacement root after identity drift.
 * @evidence contracts/common.md#meaningful-documentation States the requested-path witness and refusal before project initialization; the assertion does not extend authority across future unobserved mutations.
 * @evidence contracts/performance.md#efficient-algorithms A fixed physical-directory check and two identity comparisons cost path/bigint string lengths plus filesystem latency.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the acquired lease identity as the comparison basis and obtains a fresh path observation for each assertion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no handle or new lock; the caller retains the lease and owns cleanup after this assertion throws.
 */
export const productionRootNamespaceAssertRequestedRootIdentity: (requestedRoot: string, lease: IAutoMovieProductionRootNamespaceLease) => void = (
  requestedRoot: string,
  lease: IAutoMovieProductionRootNamespaceLease,
): void => {
  const current: BigIntStats | null = productionRootNamespacePhysicalDirectoryIdentityOrNull(requestedRoot);
  if (
    current === null ||
    current.dev.toString() !== lease.device ||
    current.ino.toString() !== lease.inode
  )
    throw new Error(
      `Requested production root "${requestedRoot}" changed physical identity during namespace acquisition. No project state was initialized.`,
    );
};

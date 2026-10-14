import type { BigIntStats, Stats } from "node:fs";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { IAutoMovieProductionRootNamespaceLease } from "./IAutoMovieProductionRootNamespaceLease";
import { productionRootNamespaceCoordinatePath } from "./productionRootNamespaceCoordinatePath";
import { productionRootNamespaceAcquireCoordinates } from "./productionRootNamespaceAcquireCoordinates";
import { assertProductionRootNamespaceLease } from "./assertProductionRootNamespaceLease";
import { releaseProductionRootNamespace } from "./releaseProductionRootNamespace";
import { productionRootNamespaceAssertRequestedRootIdentity } from "./productionRootNamespaceAssertRequestedRootIdentity";
import { productionRootNamespaceLstatOrNull } from "./productionRootNamespaceLstatOrNull";

/**
 * Reserve path and physical-identity coordinates for an existing physical root, optionally scoped to one production ID. Before returning, verify both its canonical lease root and the caller's requested path still name that identity.
 *
 * @evidence contracts/common.md#principled-implementation Physical-directory admission and realpath/stat supply dev/ino, then paired path/identity fences and two post-acquisition checks establish the finite lease witness.
 * @evidence contracts/common.md#clear-and-simple-design Owns existing-root lease construction while coordinate naming, set acquisition and identity assertions retain their separate boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A linked requested root refuses and a production ID changes both coordinate domains; no path-only or token-only observation grants unfenced mutation.
 * @evidence contracts/common.md#meaningful-documentation Documents optional production namespace, canonical root witness and requested-path recheck without claiming a kernel-level namespace transaction.
 * @evidence contracts/performance.md#efficient-algorithms Fixed root stats and two-coordinate acquisition drive local work, with path/ID hashing and token/process waits charged by their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work One observed identity supplies both coordinate names and lease fields; post-acquisition checks renew authority rather than reusing only the initial stat.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Success transfers the two nesting levels in one lease; assertion failure attempts release, and the caller must release successful leases to bound retained locks.
 */
export const productionRootNamespaceAcquireExistingRoot: (rootDirectory: string, productionId?: string) => IAutoMovieProductionRootNamespaceLease = (
  rootDirectory: string,
  productionId?: string,
): IAutoMovieProductionRootNamespaceLease => {
  const linked: Stats | null = productionRootNamespaceLstatOrNull(rootDirectory);
  if (
    linked === null ||
    linked.isSymbolicLink() ||
    linked.isDirectory() === false
  )
    throw new Error(
      `Production project root "${rootDirectory}" is not a physical directory.`,
    );
  const root: string = fileSystem.realpathSync(rootDirectory);
  const identity: BigIntStats = fileSystem.statSync(root, { bigint: true });
  const device: string = identity.dev.toString();
  const inode: string = identity.ino.toString();
  const locks: { path: string; token: string; }[] =
    productionId === undefined
      ? productionRootNamespaceAcquireCoordinates([
          productionRootNamespaceCoordinatePath("root-path", root),
          productionRootNamespaceCoordinatePath("root-id", `${device}\0${inode}`),
        ])
      : productionRootNamespaceAcquireCoordinates([
          productionRootNamespaceCoordinatePath("production-path", `${root}\0${productionId}`),
          productionRootNamespaceCoordinatePath(
            "production-id",
            `${device}\0${inode}\0${productionId}`,
          ),
        ]);
  const lease: IAutoMovieProductionRootNamespaceLease = {
    root,
    locks,
    device,
    inode,
  };
  try {
    assertProductionRootNamespaceLease(lease);
    productionRootNamespaceAssertRequestedRootIdentity(rootDirectory, lease);
    return lease;
  } catch (error) {
    releaseProductionRootNamespace(lease);
    throw error;
  }
};

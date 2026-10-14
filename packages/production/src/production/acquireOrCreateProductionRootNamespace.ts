import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { IAutoMovieProductionRootNamespaceLease } from "./IAutoMovieProductionRootNamespaceLease";
import { productionRootNamespaceReleaseCoordinates } from "./productionRootNamespaceReleaseCoordinates";
import { productionRootNamespaceAcquireCreationCoordinates } from "./productionRootNamespaceAcquireCreationCoordinates";
import { productionRootNamespaceEnsureDirectory } from "./productionRootNamespaceEnsureDirectory";
import { productionRootNamespaceAcquireExistingRoot } from "./productionRootNamespaceAcquireExistingRoot";
import { releaseProductionRootNamespace } from "./releaseProductionRootNamespace";
import { productionRootNamespaceAssertRequestedRootIdentity } from "./productionRootNamespaceAssertRequestedRootIdentity";
import { productionRootNamespaceLstatOrNull } from "./productionRootNamespaceLstatOrNull";

/**
 * Reserve a physical project root, creating missing ancestors and the root under short external creation fences before taking its stable path/identity lease. Created directories are not rolled back on later failure.
 *
 * @evidence contracts/common.md#principled-implementation Real parent resolution and paired creation coordinates protect child creation, then the existing-root owner takes stable identity/path reservations and rechecks the original requested root.
 * @evidence contracts/common.md#clear-and-simple-design Separates temporary creation authority from the returned stable root lease, with temporary scopes attempting retirement in finally and stable assertion failure delegating its own cleanup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Linked or nondirectory collisions refuse and no replacement namespace is silently adopted; already created ancestors remain actual filesystem effects.
 * @evidence contracts/common.md#meaningful-documentation States absent-root creation, temporary versus stable ownership and persistent directory effects after later refusal.
 * @evidence contracts/performance.md#efficient-algorithms For D missing ancestors, the parent walk performs O(D) creation scopes and recursion frames, retaining resolved paths whose total text size depends on ancestor spellings. Path resolution/naming and stable lease acquisition add their own text/hash work; native waits accrue per scope.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses resolved parents and creation witnesses only within their attempt, and the stable lease is separately acquired because creation and mutation authority differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Creation locks attempt reverse retirement in finally; a stable lease transfers on success and assertion failure attempts its release before propagating. Native cleanup failure can retain fences under the void release contract, and created directories may remain.
 */
export const acquireOrCreateProductionRootNamespace: (rootDirectory: string) => IAutoMovieProductionRootNamespaceLease = (
  rootDirectory: string,
): IAutoMovieProductionRootNamespaceLease => {
  const root: string = path.resolve(rootDirectory);
  const linked: Stats | null = productionRootNamespaceLstatOrNull(root);
  if (linked !== null) return productionRootNamespaceAcquireExistingRoot(root);
  const parentReal: string = productionRootNamespaceEnsureDirectory(path.dirname(root));
  const physical: string = path.join(parentReal, path.basename(root));
  const locks: { path: string; token: string; }[] = productionRootNamespaceAcquireCreationCoordinates(parentReal, path.basename(root));
  try {
    const current: Stats | null = productionRootNamespaceLstatOrNull(physical);
    if (current === null) fileSystem.mkdirSync(physical);
    else if (current.isSymbolicLink() || current.isDirectory() === false)
      throw new Error(
        `Production project root "${root}" is not a physical directory.`,
      );
    const lease: IAutoMovieProductionRootNamespaceLease = productionRootNamespaceAcquireExistingRoot(physical);
    try {
      productionRootNamespaceAssertRequestedRootIdentity(root, lease);
      return lease;
    } catch (error) {
      releaseProductionRootNamespace(lease);
      throw error;
    }
  } finally {
    productionRootNamespaceReleaseCoordinates(locks);
  }
};

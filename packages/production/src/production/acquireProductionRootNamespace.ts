import path from "node:path";
import type { IAutoMovieProductionRootNamespaceLease } from "./IAutoMovieProductionRootNamespaceLease";
import { productionRootNamespaceAcquireExistingRoot } from "./productionRootNamespaceAcquireExistingRoot";

/**
 * Reserve an existing physical project root, optionally fencing one production ID instead of the shared root namespace. The returned lease must be asserted before mutation and released by its owner.
 *
 * @evidence contracts/common.md#principled-implementation Resolves the requested spelling and delegates paired path/physical-identity acquisition with post-acquisition root and token checks.
 * @evidence contracts/common.md#clear-and-simple-design The public existing-root entry supplies only path resolution and optional production scope to the common acquisition owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not create missing roots or silently follow a requested root symlink; no production-ID branch bypasses the identity fences.
 * @evidence contracts/common.md#meaningful-documentation Documents optional namespace scope, caller assertion/release duties and that a lease is a finite witnessed reservation rather than atomic filesystem authority.
 * @evidence contracts/performance.md#efficient-algorithms Path resolution is output-length work plus fixed root checks and two-coordinate acquisition; native token/query/contended waits are counted by their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested requests share underlying exact coordinate-token depth, while distinct calls acquire their own balanced levels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Success transfers one lease containing two coordinate levels; the caller must release it, and failed native retirement can retain fences under the existing void release contract.
 */
export const acquireProductionRootNamespace: (rootDirectory: string, productionId?: string) => IAutoMovieProductionRootNamespaceLease = (
  rootDirectory: string,
  productionId?: string,
): IAutoMovieProductionRootNamespaceLease =>
  productionRootNamespaceAcquireExistingRoot(path.resolve(rootDirectory), productionId);

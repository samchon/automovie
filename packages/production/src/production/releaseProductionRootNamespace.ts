import type { IAutoMovieProductionRootNamespaceLease } from "./IAutoMovieProductionRootNamespaceLease";
import { productionRootNamespaceReleaseCoordinates } from "./productionRootNamespaceReleaseCoordinates";

/**
 * Return the lease's coordinate levels in reverse acquisition order through exact-token commit-lock release. This void API does not certify that every failed native retirement physically freed a lock.
 *
 * @evidence contracts/common.md#principled-implementation The lease retains exact path/token pairs and the canonical release owner checks each pair's nesting depth and physical resident identity.
 * @evidence contracts/common.md#clear-and-simple-design The public retirement entry delegates set ordering rather than implementing another token registry or filesystem deletion path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not remove a foreign coordinate by name, and does not turn the existing swallowed cleanup failures into a false release-completion claim.
 * @evidence contracts/common.md#meaningful-documentation States reverse-order token retirement and the unresolved physical cleanup limit of the established void-return contract.
 * @evidence contracts/performance.md#efficient-algorithms Copies and traverses C lease pairs in O(C) work and temporary references, plus each token/read/native retirement operation's cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the underlying process-local depth discipline; effects are attempted through their owner rather than cached by a prior void return.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Attempts return of every supplied coordinate level; successful retirement releases ownership, while failure can retain fences or backup bytes without a structured outcome.
 */
export const releaseProductionRootNamespace: (lease: IAutoMovieProductionRootNamespaceLease) => void = (
  lease: IAutoMovieProductionRootNamespaceLease,
): void => {
  productionRootNamespaceReleaseCoordinates(lease.locks);
};

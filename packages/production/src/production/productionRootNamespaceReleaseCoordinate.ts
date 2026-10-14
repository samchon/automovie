import { releaseCommitLock } from "../project/commitLock";

/**
 * Return one supplied coordinate nesting level through owner-checked commit-lock release; the pair is value evidence rather than a native descriptor.
 *
 * @evidence contracts/common.md#principled-implementation Uses the exact path and token established during acquisition, delegating depth and physical identity checks to canonical commit-lock release.
 * @evidence contracts/common.md#clear-and-simple-design One release projection is shared by set cleanup and normal lease retirement without maintaining another ownership registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not remove a coordinate solely by path, age or process ID, and retains the underlying void API's fail-closed cleanup behavior.
 * @evidence contracts/common.md#meaningful-documentation States the balanced nesting level and that native release completion follows the underlying release contract.
 * @evidence contracts/performance.md#efficient-algorithms Projection is constant work plus token-reading and filesystem retirement costs of the canonical release operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the acquisition pair's exact token; effectful release is not memoized by equal result values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Release may end local depth and physical lock ownership, but underlying failures may retain a fence or backup; this projection supplies no independent completion receipt.
 */
export const productionRootNamespaceReleaseCoordinate: (lease: { path: string; token: string }) => void = (lease: { path: string; token: string }): void => {
  releaseCommitLock(lease.path, lease.token);
};

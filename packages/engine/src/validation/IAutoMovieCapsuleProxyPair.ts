import { IAutoMovieCapsuleProxy } from "@automovie/interface";

/**
 * Declare one capsule pair to include in a self-intersection check.
 *
 * @evidence contracts/common.md#principled-implementation Explicit pairing defines the checked population because neighboring anatomical capsules can share joints; each proxy still requires distinct reachable endpoints and a positive radius.
 * @evidence contracts/common.md#clear-and-simple-design Pair selection is authored separately from the canonical capsule admission and distance owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted pairs are not inferred as safe or tested automatically, and this record does not certify topology or continuous collision freedom.
 * @evidence contracts/common.md#meaningful-documentation Documents the exact pair population and why adjacent joint-sharing proxies may be omitted deliberately.
 * @evidence contracts/performance.md#efficient-algorithms The record has constant data shape; the consumer's work grows with declared pairs, sampled frames and FK resolution.
 * @evidence contracts/performance.md#reuse-equivalent-work Both supplied proxy records are borrowed by the check; the type introduces no duplicate geometry or cached intersection result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the pair and proxies, with no sampled maps, simulation task or host resource retained by the type.
 */
export interface IAutoMovieCapsuleProxyPair {
  /** First capsule in the pair. */
  first: IAutoMovieCapsuleProxy;

  /** Second capsule in the pair. */
  second: IAutoMovieCapsuleProxy;
}

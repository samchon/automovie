import type { IProductionClaimOwner } from "../IProductionClaimOwner";

/**
 * Identifies the factory owner before its final config-array index exists.
 *
 * @evidence contracts/common.md#principled-implementation Omitting the config index represents ownership at claim creation, before the full array establishes final positions.
 * @evidence contracts/common.md#clear-and-simple-design Omit removes index and reuses the owner vocabulary before the completed config establishes positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts ownClaim registers actual identity and final capture supplies index; names do not establish ownership.
 * @evidence contracts/common.md#meaningful-documentation The comment explains creation-time ownership before the final config index exists.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Creation-time claim owner is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Creation-time claim owner declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Creation-time claim owner acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export type IProductionClaimOwnerInput = Omit<IProductionClaimOwner, "index">;

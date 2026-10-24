import type { IProductionGateKey } from "./IProductionGateKey";

/**
 * Ownership assigned by the factory, independent of diagnostic locations.
 *
 * @evidence contracts/common.md#principled-implementation The owner records original config index, layer/pass key and generated/custom/review/verdict/support role; the optional authored marker identifies the primary H2 inventory.
 * @evidence contracts/common.md#clear-and-simple-design The shared layer/pass pair gains original index and role so native diagnostic joins are independent of mutable labels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory assigns these records; the structural type does not infer ownership from fixture names or diagnostic locations.
 * @evidence contracts/common.md#meaningful-documentation Members define original unfiltered indices, claim roles and the primary authored H2 marker.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Captured claim ownership is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Captured claim ownership declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Captured claim ownership acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionClaimOwner extends IProductionGateKey {
  /** Original position in the unfiltered evidence config. */
  index: number;

  /** Distinguishes authored duties, work declarations, and review records. */
  kind: "generated" | "custom" | "review" | "verdict" | "support";

  /** The factory's primary authored H2 population for this pass. */
  authored?: true;
}

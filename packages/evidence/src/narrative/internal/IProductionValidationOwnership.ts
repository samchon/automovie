import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";

/**
 * Captures immutable policy text and original object identities at construction.
 *
 * @evidence contracts/common.md#principled-implementation The record keeps serialized config/policy plus original claim object identities and assigned owners, enabling mutation and clone rejection without writable provenance fields.
 * @evidence contracts/common.md#clear-and-simple-design Serialized policy and original references support different mutation/identity checks in one record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts validationOwner checks serialization and claim identity/order, rejecting equal-looking clones and edited policy.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish serialized config/props from original claims and config-indexed owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Original config snapshot record is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Original config snapshot record declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Original config snapshot record acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionValidationOwnership {
  /** Serialized graph before callers can mutate it. */
  config: string;

  /** Serialized production policy at factory capture. */
  props: string;

  /** Original claim object references in their authored order. */
  claims: IEvidenceConfig["claims"];

  /** Factory-assigned owners indexed by original claim position. */
  owners: IProductionClaimOwner[];
}

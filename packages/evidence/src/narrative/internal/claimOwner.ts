import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";
import { claimOwners } from "./claimOwners";

/**
 * Captures the original authored index after all families have been collected.
 *
 * @evidence contracts/common.md#principled-implementation A factory-registered weak identity lookup supplies layer/pass/kind metadata, then the completed config index is added to a fresh record; unregistered claims throw.
 * @evidence contracts/common.md#clear-and-simple-design The helper owns only the transition from creation-time ownership to final config-array position.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No claim name or report position is guessed as an owner when the exact object was not registered.
 * @evidence contracts/common.md#meaningful-documentation The comment states that indices are assigned after family collection; the error identifies an unowned original claim position.
 * @evidence contracts/performance.md#efficient-algorithms One weak-map lookup and fixed-size object copy take expected constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work The factory ownership entry is reused by claim identity; the result adds its supplied index without sharing a mutable returned record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This accessor opens no resource or retained task; its returned fixed-size record belongs to the caller and registry lifetime remains weakly tied to the claim.
 */
export function claimOwner(
  claim: IEvidenceClaim,
  index: number,
): IProductionClaimOwner {
  const owner: IProductionClaimOwnerInput | undefined = claimOwners.get(claim);
  if (owner === undefined)
    throw new Error(`Claim ${index} has no factory owner.`);
  return { ...owner, index };
}

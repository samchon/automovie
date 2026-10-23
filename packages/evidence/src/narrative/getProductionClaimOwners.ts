import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "./IProductionClaimOwner";
import { validationOwner } from "./internal/validationOwner";

/**
 * Returns captured authored indices only for this factory's original config.
 *
 * @evidence contracts/common.md#principled-implementation validationOwner verifies exact config provenance and captured serialized/object identities, then returns copied ownership records indexed by original claim position.
 * @evidence contracts/common.md#clear-and-simple-design The public accessor delegates all provenance checks to the same owner validator used by pass resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cloned or changed config objects fail instead of reconstructing ownership from labels or selected report indices.
 * @evidence contracts/common.md#meaningful-documentation The comment states captured authored-index semantics and the requirement for the original factory config.
 * @evidence contracts/performance.md#efficient-algorithms The validator serializes config/props, compares claim identities and copies n owner records; time grows with serialized bytes plus n claims and output memory is O(n).
 * @evidence contracts/performance.md#reuse-equivalent-work The factory's captured ownership is reused, but mutation validation runs on every accessor call because callers can edit objects between requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a copied owner array escapes this accessor; the weak factory registries own the original snapshots and it opens no handle or task.
 */
export function getProductionClaimOwners(
  config: IEvidenceConfig,
): IProductionClaimOwner[] {
  return validationOwner(config).owners;
}

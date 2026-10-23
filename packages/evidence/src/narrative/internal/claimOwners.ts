import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";

/**
 * Keeps factory ownership tied to each original claim object.
 *
 * Principled implementation: Claim object identity is the weak key for creation-time layer/pass/kind metadata, so labels and repeated content cannot impersonate factory ownership.
 * Clear and simple design: A module-local weak identity table keeps provenance separate from mutable native graph fields and delegates capture/validation to their owning functions.
 * Prohibited implementation shortcuts: No filename, label or serialized equality acts as a replacement factory key; only the registered object identity is admitted.
 * Meaningful documentation: The comment identifies exact object ownership and the producer/consumer functions establish registration and invalidation semantics.
 * Efficient algorithms: Weak-map access has expected constant-time identity lookup; the owning capture operation accounts for snapshot construction and stored graph size.
 * Reuse equivalent work: Entries are set once by ownClaim and read during final-index capture; repeated ownership throws there.
 * Bound retention and release resources: The weak map retains one fixed-size owner record per live claim key without extending that key's lifetime; there is no independently growing strong registry or open handle.
 */
export const claimOwners: WeakMap<IEvidenceClaim, IProductionClaimOwnerInput> =
  new WeakMap();

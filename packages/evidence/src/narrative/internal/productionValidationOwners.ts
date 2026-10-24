import type { IProductionValidationOwnership } from "./IProductionValidationOwnership";

/**
 * Keeps snapshots outside mutable production configuration objects.
 *
 * Principled implementation: The exact config identity keys serialized config/policy, original claim identities and assigned owners, supporting clone and mutation rejection.
 * Clear and simple design: A module-local weak identity table keeps provenance separate from mutable native graph fields and delegates capture/validation to their owning functions.
 * Prohibited implementation shortcuts: No filename, label or serialized equality acts as a replacement factory key; only the registered object identity is admitted.
 * Meaningful documentation: The comment identifies exact object ownership and the producer/consumer functions establish registration and invalidation semantics.
 * Efficient algorithms: Weak-map access has expected constant-time identity lookup; the owning capture operation accounts for snapshot construction and stored graph size.
 * Reuse equivalent work: Factory capture registers before native plan filtering; validationOwner reuses the record only after comparing current serialization and original claim ordering.
 * Bound retention and release resources: Snapshot bytes and claim/owner references scale with each live config graph; the weak key does not extend config lifetime, and the map owns no handles/tasks.
 */
export const productionValidationOwners: WeakMap<
  object,
  IProductionValidationOwnership
> = new WeakMap();

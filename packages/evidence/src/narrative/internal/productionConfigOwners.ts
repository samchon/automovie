import type { IProductionConfigProps } from "../IProductionConfigProps";

/**
 * Keeps actual evidence config ownership outside writer-editable machine JSON.
 *
 * Principled implementation: The exact native config object is the weak key for its original production props, preserving factory identity outside writer-editable config fields.
 * Clear and simple design: A module-local weak identity table keeps provenance separate from mutable native graph fields and delegates capture/validation to their owning functions.
 * Prohibited implementation shortcuts: No filename, label or serialized equality acts as a replacement factory key; only the registered object identity is admitted.
 * Meaningful documentation: The comment identifies exact object ownership and the producer/consumer functions establish registration and invalidation semantics.
 * Efficient algorithms: Weak-map access has expected constant-time identity lookup; the owning capture operation accounts for snapshot construction and stored graph size.
 * Reuse equivalent work: createProductionConfig registers once; lookup reuses the same policy object, while validationOwner separately rejects post-capture mutation.
 * Bound retention and release resources: Policy references last while their config key remains live; keys are weak and there is no independent count cap, descriptor or running task.
 */
export const productionConfigOwners: WeakMap<object, IProductionConfigProps> =
  new WeakMap<object, IProductionConfigProps>();

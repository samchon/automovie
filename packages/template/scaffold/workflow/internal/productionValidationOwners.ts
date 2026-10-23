import type { IProductionValidationOwnership } from "./IProductionValidationOwnership";

/** Keeps snapshots outside mutable production configuration objects. */
export const productionValidationOwners: WeakMap<
  object,
  IProductionValidationOwnership
> = new WeakMap();

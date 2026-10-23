import type { IProductionConfigProps } from "../IProductionConfigProps";

/** Keeps actual evidence config ownership outside writer-editable machine JSON. */
export const productionConfigOwners: WeakMap<object, IProductionConfigProps> =
  new WeakMap<object, IProductionConfigProps>();

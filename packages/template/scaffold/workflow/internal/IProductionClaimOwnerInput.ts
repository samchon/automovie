import type { IProductionClaimOwner } from "../IProductionClaimOwner";

/** Identifies the factory owner before its final config-array index exists. */
export type IProductionClaimOwnerInput = Omit<IProductionClaimOwner, "index">;

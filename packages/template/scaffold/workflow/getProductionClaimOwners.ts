import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "./IProductionClaimOwner";
import { validationOwner } from "./internal/validationOwner";

/** Returns captured authored indices only for this factory's original config. */
export function getProductionClaimOwners(
  config: IEvidenceConfig,
): IProductionClaimOwner[] {
  return validationOwner(config).owners;
}

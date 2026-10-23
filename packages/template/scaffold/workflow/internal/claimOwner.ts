import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";
import { claimOwners } from "./claimOwners";

/** Captures the original authored index after all families have been collected. */
export function claimOwner(
  claim: IEvidenceClaim,
  index: number,
): IProductionClaimOwner {
  const owner: IProductionClaimOwnerInput | undefined = claimOwners.get(claim);
  if (owner === undefined)
    throw new Error(`Claim ${index} has no factory owner.`);
  return { ...owner, index };
}

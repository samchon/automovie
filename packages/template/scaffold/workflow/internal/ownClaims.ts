import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";
import { ownClaim } from "./ownClaim";

/** Marks a homogeneous factory family at its creation boundary. */
export function ownClaims(
  claims: IEvidenceClaim[],
  owner: IProductionClaimOwnerInput,
): IEvidenceClaim[] {
  return claims.map(
    (claim: IEvidenceClaim): IEvidenceClaim => ownClaim(claim, owner),
  );
}

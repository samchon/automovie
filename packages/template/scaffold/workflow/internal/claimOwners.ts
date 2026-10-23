import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";

/** Keeps factory ownership tied to each original claim object. */
export const claimOwners: WeakMap<IEvidenceClaim, IProductionClaimOwnerInput> =
  new WeakMap();

import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";
import { claimOwners } from "./claimOwners";
import { createEvidenceFiles } from "./utilities/createEvidenceFiles";

/** Records ownership where a factory creates a claim, never from its label. */
export function ownClaim<T extends IEvidenceClaim>(
  claim: T,
  owner: IProductionClaimOwnerInput,
): T {
  if (claimOwners.has(claim))
    throw new Error("A claim cannot have two factory claimOwners.");
  if (
    claim.type === "markdown" &&
    claim.root === "docs/body" &&
    owner.pass === "construction" &&
    owner.kind !== "support"
  ) {
    if (claim.symbol !== "file" && claim.symbol !== "h2")
      throw new Error("Authored manuscript claims require file or H2 hosts.");
    claim.evidenceFiles = createEvidenceFiles(claim.symbol, claim.files);
  }
  claimOwners.set(claim, { ...owner });
  return claim;
}

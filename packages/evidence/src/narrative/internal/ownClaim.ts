import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";
import { claimOwners } from "./claimOwners";
import { createEvidenceFiles } from "./utilities/createEvidenceFiles";

/**
 * Records ownership where a factory creates a claim, never from its label.
 *
 * @evidence contracts/common.md#principled-implementation Creation-time claim identity is registered once, and construction Markdown file/H2 hosts receive the matching detached carrier selector before ownership is stored.
 * @evidence contracts/common.md#clear-and-simple-design This boundary owns the intentional mutation that attaches detached evidence and prevents later owner inference from labels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A second owner and unsupported authored symbol kind throw; docs/body construction is a real supported format requiring detached evidence, not a test exception.
 * @evidence contracts/common.md#meaningful-documentation The comment states factory ownership without labels; the implementation's errors identify repeated ownership and invalid manuscript host kinds.
 * @evidence contracts/performance.md#efficient-algorithms Weak identity lookup is expected constant time; detached evidence mapping scans f selector strings and allocates f mapped strings when needed, while ownership copying has fixed size.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing claims are never shared under a second owner; returning the same claim preserves the object identity consumed by captureProductionValidationOwners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The weak claim-keyed entry lasts only while that claim is live; the intentional evidenceFiles mutation belongs to the returned caller-owned claim and no external handle/task is acquired.
 */
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

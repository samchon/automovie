import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionClaimOwnerInput } from "./IProductionClaimOwnerInput";
import { ownClaim } from "./ownClaim";

/**
 * Marks a homogeneous factory family at its creation boundary.
 *
 * @evidence contracts/common.md#principled-implementation Each member of a homogeneous generated family passes through ownClaim with the same explicit layer/pass/kind owner, retaining claim order and identities.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper keeps family ownership at its creation site without duplicating per-claim validation or detached-carrier wiring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All claims receive the same ownClaim checks, including repeated-owner rejection; no family label bypasses those checks.
 * @evidence contracts/common.md#meaningful-documentation The comment states homogeneous creation-boundary ownership; ownClaim documents its identity and construction-evidence effects.
 * @evidence contracts/performance.md#efficient-algorithms For n claims and f total selector characters, mapping is O(n) plus delegated detached-selector work O(f); the returned array contains n existing claim references.
 * @evidence contracts/performance.md#reuse-equivalent-work The input claim objects are reused intentionally and receive one owner each; a second ownership attempt fails instead of serving a stale cached record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The new array belongs to the caller; delegated weak ownership does not extend claim lifetimes, and no handle or task is owned here.
 */
export function ownClaims(
  claims: IEvidenceClaim[],
  owner: IProductionClaimOwnerInput,
): IEvidenceClaim[] {
  return claims.map(
    (claim: IEvidenceClaim): IEvidenceClaim => ownClaim(claim, owner),
  );
}

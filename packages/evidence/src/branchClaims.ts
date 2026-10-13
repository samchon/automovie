import type { AutoMovieEvidenceBranch } from "./AutoMovieEvidenceBranch";
import type { IAutoMovieEvidenceBranchClaim } from "./IAutoMovieEvidenceBranchClaim";
import type { ITtscEvidenceGraphClaim } from "@ttsc/evidence";

/**
 * Each native claim is paired with its owning branch without altering the claim's policy or population.
 *
 * @evidence contracts/common.md#principled-implementation Each native claim is paired with its owning branch without altering the claim's policy or population.
 * @evidence contracts/common.md#clear-and-simple-design The pair lets graph assembly and manifest projection share branch ownership without adding fields to the native claim.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every supplied claim is retained in order; no diagnostic or coverage policy is overridden here.
 * @evidence contracts/common.md#meaningful-documentation The result contains fresh binding records and the original claim objects.
 * @evidence contracts/performance.md#efficient-algorithms Time and new binding storage are linear in the number of supplied claims.
 * @evidence contracts/performance.md#reuse-equivalent-work Claim objects are deliberately reused because this operation only attaches ownership metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned bindings and claims; the helper retains nothing between calls.
 */
export function branchClaims(branch: AutoMovieEvidenceBranch, ...claims: ITtscEvidenceGraphClaim[]): IAutoMovieEvidenceBranchClaim[] {
  return claims.map((claim: ITtscEvidenceGraphClaim): { branch: AutoMovieEvidenceBranch; claim: ITtscEvidenceGraphClaim; } => ({ branch, claim }));
}

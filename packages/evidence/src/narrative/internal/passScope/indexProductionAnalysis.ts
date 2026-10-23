import type {
  IEvidenceCheckAnalysis,
  IEvidenceCheckClaim,
  IEvidenceConfigPlan,
  IEvidenceConfigPlanClaim,
  IEvidenceGraphClaim,
  IEvidenceGraphClaimResult,
} from "@wrtnlabs/evidence";

/**
 * Indexes the original plan and all native graph/report claims without filtering.
 *
 * @evidence contracts/common.md#principled-implementation Native plan, graph input, graph results and report arrays are indexed by their own claim indices without filtering; completeness and duplicate admission are checked separately by inspectProductionAnalysis.
 * @evidence contracts/common.md#clear-and-simple-design Four explicit Maps expose each native representation to the resolver, replacing repeated claim searches while leaving their original records intact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No claim is excluded or renumbered; Map overwrite on a duplicate is not accepted as proof of validity because the original arrays are independently inspected.
 * @evidence contracts/common.md#meaningful-documentation The comment promises the original unfiltered populations, and the return fields distinguish plan, input, graph-result and report ownership.
 * @evidence contracts/performance.md#efficient-algorithms For n total entries across the four arrays, mapping and Map construction take O(n) expected time and O(n) additional references, with no record cloning.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned indexes are built once by resolveProductionPassValidationScope and reused throughout that resolution; a different analysis builds its own indexes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the four returned Maps and their references to the original records; the helper keeps no persistent index, handles or tasks.
 */
export function indexProductionAnalysis(
  plan: IEvidenceConfigPlan,
  analysis: IEvidenceCheckAnalysis,
): {
  planned: Map<number, IEvidenceConfigPlanClaim>;
  inputs: Map<number | undefined, IEvidenceGraphClaim>;
  results: Map<number, IEvidenceGraphClaimResult>;
  reports: Map<number, IEvidenceCheckClaim>;
} {
  const planned: Map<number, IEvidenceConfigPlanClaim> = new Map(
    plan.claims.map(
      (claim: IEvidenceConfigPlanClaim): [number, IEvidenceConfigPlanClaim] => [
        claim.index,
        claim,
      ],
    ),
  );
  const inputs: Map<number | undefined, IEvidenceGraphClaim> = new Map(
    analysis.graphInput.claims.map(
      (
        claim: IEvidenceGraphClaim,
      ): [number | undefined, IEvidenceGraphClaim] => [claim.index, claim],
    ),
  );
  const results: Map<number, IEvidenceGraphClaimResult> = new Map(
    analysis.graph.claims.map(
      (
        claim: IEvidenceGraphClaimResult,
      ): [number, IEvidenceGraphClaimResult] => [claim.claim, claim],
    ),
  );
  const reports: Map<number, IEvidenceCheckClaim> = new Map(
    analysis.report.claims.map(
      (claim: IEvidenceCheckClaim): [number, IEvidenceCheckClaim] => [
        claim.claim,
        claim,
      ],
    ),
  );
  return { planned, inputs, results, reports };
}

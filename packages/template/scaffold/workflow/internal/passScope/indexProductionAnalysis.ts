import type {
  IEvidenceCheckAnalysis,
  IEvidenceCheckClaim,
  IEvidenceConfigPlan,
  IEvidenceConfigPlanClaim,
  IEvidenceGraphClaim,
  IEvidenceGraphClaimResult,
} from "@wrtnlabs/evidence";

/** Indexes the original plan and all native graph/report claims without filtering. */
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

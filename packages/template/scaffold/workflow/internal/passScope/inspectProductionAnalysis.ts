import type {
  IEvidenceCheckAnalysis,
  IEvidenceCheckClaim,
  IEvidenceConfigPlanClaim,
  IEvidenceGraphClaim,
  IEvidenceGraphClaimResult,
} from "@wrtnlabs/evidence";
import path from "node:path";

import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";

/** Validates that pass interpretation received the original complete, unfiltered analysis. */
export function inspectProductionAnalysis(
  location: string,
  analysis: IEvidenceCheckAnalysis,
  planned: Map<number, IEvidenceConfigPlanClaim>,
): string[] {
  const issues: string[] = [];
  const issue: (message: string) => void = (message: string): void => {
    issues.push(message);
  };
  for (const entries of [
    analysis.graphInput.claims.map(
      (claim: IEvidenceGraphClaim): number | undefined => claim.index,
    ),
    analysis.graph.claims.map(
      (claim: IEvidenceGraphClaimResult): number => claim.claim,
    ),
    analysis.report.claims.map(
      (claim: IEvidenceCheckClaim): number => claim.claim,
    ),
  ])
    if (
      entries.length !== planned.size ||
      new Set(entries).size !== entries.length ||
      entries.some(
        (index: number | undefined): boolean =>
          index === undefined || !planned.has(index),
      )
    )
      issue(
        "Analysis does not contain every original active claim exactly once.",
      );
  if (
    analysis.report.only !== undefined ||
    analysis.report.shallow !== undefined ||
    (analysis.report.omittedDiagnostics ?? 0) !== 0
  )
    issue("Pass validation requires an unfiltered, unwindowed full analysis.");
  if (analysis.report.status !== "complete")
    issue("The original package analysis is incomplete.");
  if (
    canonical(path.dirname(analysis.report.configFile)) !== canonical(location)
  )
    issue("Analysis config location differs from the original package owner.");
  return issues;
}

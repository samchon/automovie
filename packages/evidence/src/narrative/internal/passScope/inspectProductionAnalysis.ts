import type {
  IEvidenceCheckAnalysis,
  IEvidenceCheckClaim,
  IEvidenceConfigPlanClaim,
  IEvidenceGraphClaim,
  IEvidenceGraphClaimResult,
} from "@wrtnlabs/evidence";
import path from "node:path";

/**
 * Validates that pass interpretation received the original complete, unfiltered analysis.
 *
 * @evidence contracts/common.md#principled-implementation Each native claim population must match the original plan exactly once, the report must be complete and unfiltered, and the captured config owner must equal the supplied location.
 * @evidence contracts/common.md#clear-and-simple-design The inspector returns all discovered admission issues while indexing and dependency traversal remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted diagnostics, windowing and partial status are explicit failures rather than retried or accepted under a wrapper.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the original complete analysis premise, and each issue states the specific broken admission condition.
 * @evidence contracts/performance.md#efficient-algorithms For n total native claim entries, arrays and Sets validate membership in O(n) expected time and O(n) temporary space; config-path comparison adds path-length work.
 * @evidence contracts/performance.md#reuse-equivalent-work The original planned Map and captured canonicalizer are reused; this inspector neither reconstructs native results nor caches acceptance across analyses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Index arrays, temporary Sets and issue strings are call-local; only the returned issue list survives under caller ownership, with size proportional to the checked populations.
 */
export function inspectProductionAnalysis(
  location: string,
  analysis: IEvidenceCheckAnalysis,
  planned: Map<number, IEvidenceConfigPlanClaim>,
  canonical: (filename: string, logicalRoot?: string) => string,
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

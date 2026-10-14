import type {
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderFinding,
} from "@automovie/interface";

import type { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";
import { IAutoMovieRenderBudgetEvidence } from "./IAutoMovieRenderBudgetEvidence";

/**
 * Format the caller-supplied budget evidence as an over-limit or unknown-required-texture diagnostic, or return null when neither condition is recorded. This helper returns text; it raises no job refusal and does not verify the provenance of supplied reports.
 *
 * Every recorded over-limit and required-texture count/byte gap remains visible together; absent storage facts do not become clearance. Other incomplete analyses retain their owning contract's outcome, so a null result is not blanket admission.
 *
 * Maintained consumers are internal budget helpers and tests. ProductionDesign.renderBudgets has no execution reader connecting this text to automatic render-job refusal.
 *
 * @evidence contracts/common.md#principled-implementation Over-limit assessments and gaps in required texture counts or bytes produce independent diagnostics, so unknown storage remains a refusal even beside an over-limit verdict.
 * @evidence contracts/common.md#clear-and-simple-design The function converts budget evidence into an operator message and leaves each measurement or recovery explanation with the owning engine report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A finding-less over verdict still names its shot instead of disappearing, and unavailable texture bounds are never treated as zero.
 * @evidence contracts/common.md#meaningful-documentation Defines the explicit supplied-evidence diagnostic conditions, null-result limits and internal/test-only caller boundary, including the absent automatic ProductionDesign.renderBudgets refusal wiring.
 * @evidence contracts/performance.md#efficient-algorithms For S shots and their total G gaps and findings, the fixed filter and message-building passes cost O(S+G) time and allocate only the selected records and resulting strings.
 * @evidence contracts/performance.md#reuse-equivalent-work Messages reuse recorded gap reasons and finding recoveries; no inventory or budget measurement is repeated during refusal formatting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Filtered shot arrays and recovery strings are temporary, and only the returned diagnostic string escapes; no evidence store or host handle is acquired.
 */
export const autoMovieRenderBudgetRefusal: (
  evidence: IAutoMovieRenderBudgetEvidence,
) => string | null = (
  evidence: IAutoMovieRenderBudgetEvidence,
): string | null => {
  const over: IAutoMovieRenderBudgetAssessment[] = evidence.shots.filter(
    (shot: IAutoMovieRenderBudgetAssessment): boolean => shot.status === "over",
  );
  const unknown: IAutoMovieRenderBudgetAssessment[] = evidence.shots.filter(
    (shot: IAutoMovieRenderBudgetAssessment): boolean =>
      shot.inventory?.gaps.some(
        (gap: IAutoMovieRenderAnalysisGap): boolean =>
          gap.metric === "textureBytes" || gap.metric === "textures",
      ) === true,
  );
  const unknownMessage: string | null =
    unknown.length === 0
      ? null
      : `Render tier "${evidence.tier}" has no safe resident texture bound in ${unknown.length} shot(s): ${unknown
          .map(
            (shot: IAutoMovieRenderBudgetAssessment): string =>
              `${shot.shot}: ${shot
                .inventory!.gaps.filter(
                  (gap: IAutoMovieRenderAnalysisGap): boolean =>
                    gap.metric === "textureBytes" || gap.metric === "textures",
                )
                .map(
                  (gap: IAutoMovieRenderAnalysisGap): string =>
                    `${gap.reason}; ${gap.remedy}`,
                )
                .join("; ")}`,
          )
          .join(" | ")}`;
  if (over.length === 0) return unknownMessage;
  const overMessage: string = `Render tier "${evidence.tier}" is over budget in ${over.length} shot(s): ${over
    .map((shot: IAutoMovieRenderBudgetAssessment): string => {
      // A verdict carries the findings that produced it. One that does not is
      // a caller-built record, and the refusal still has to name the shot: a
      // message that quietly dropped it would leave an over-budget render with
      // nothing to act on.
      const recoveries: Array<string | null> = (shot.report?.findings ?? [])
        .filter(
          (finding: IAutoMovieRenderFinding): boolean =>
            finding.status === "over",
        )
        .map(
          (finding: IAutoMovieRenderFinding): string | null => finding.recovery,
        );
      return `${shot.shot}: ${
        recoveries.length === 0
          ? "the assessment recorded no over-limit finding to recover from"
          : recoveries.join("; ")
      }`;
    })
    .join(" | ")}`;
  return unknownMessage === null
    ? overMessage
    : `${overMessage}\n${unknownMessage}`;
};

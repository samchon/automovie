import type {
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderBudgetAssessment,
  IAutoMovieRenderBudgetEvidence,
  IAutoMovieRenderFinding,
} from "@automovie/interface";

/*
 * Format the caller-supplied budget evidence as an over-limit or
 * unknown-required-texture diagnostic, or return null when neither condition is
 * recorded. This helper returns text; it raises no job refusal and does not
 * verify the provenance of supplied reports.
 *
 * Every recorded over-limit and required-texture count/byte gap remains visible
 * together; absent storage facts do not become clearance. Other incomplete
 * analyses retain their owning contract's outcome, so a null result is not
 * blanket admission.
 *
 * Maintained consumers are internal budget helpers and tests.
 * ProductionDesign.renderBudgets has no execution reader connecting this text
 * to automatic render-job refusal.
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

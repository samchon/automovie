import { IAutoMovieRenderBudgetEvidence } from "./IAutoMovieRenderBudgetEvidence";


/**
 * The refusal a render job raises for over-budget evidence, or `null` when
 * all required texture bounds are known and nothing is over.
 *
 * Over-limit evidence refuses. A required resident texture with no safe upload
 * bound or allocation count also refuses. Every over-limit and unknown
 * diagnostic remains visible together; an absent value cannot certify admission.
 * Other incomplete analyses remain reported by their owning contract.
 *
 * @author Samchon
 */
export const autoMovieRenderBudgetRefusal = (
  evidence: IAutoMovieRenderBudgetEvidence,
): string | null => {
  const over = evidence.shots.filter((shot) => shot.status === "over");
  const unknown = evidence.shots.filter((shot) =>
    shot.inventory?.gaps.some((gap) => (gap.metric === "textureBytes" || gap.metric === "textures")) === true);
  const unknownMessage = unknown.length === 0 ? null :
      `Render tier "${evidence.tier}" has no safe resident texture bound in ${unknown.length} shot(s): ${unknown.map((shot) =>
        `${shot.shot}: ${shot.inventory!.gaps.filter((gap) => (gap.metric === "textureBytes" || gap.metric === "textures")).map((gap) => `${gap.reason}; ${gap.remedy}`).join("; ")}`).join(" | ")}`;
  if (over.length === 0) return unknownMessage;
  const overMessage = `Render tier "${evidence.tier}" is over budget in ${over.length} shot(s): ${over
    .map((shot) => {
      // A verdict carries the findings that produced it. One that does not is
      // a caller-built record, and the refusal still has to name the shot: a
      // message that quietly dropped it would leave an over-budget render with
      // nothing to act on.
      const recoveries = (shot.report?.findings ?? [])
        .filter((finding) => finding.status === "over")
        .map((finding) => finding.recovery);
      return `${shot.shot}: ${
        recoveries.length === 0
          ? "the assessment recorded no over-limit finding to recover from"
          : recoveries.join("; ")
      }`;
    })
    .join(" | ")}`;
  return unknownMessage === null ? overMessage : `${overMessage}\n${unknownMessage}`;
};

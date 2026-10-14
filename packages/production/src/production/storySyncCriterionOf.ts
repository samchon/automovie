import type { IAutoMovieAcceptanceScenario } from "@automovie/interface";

/**
 * Select the cross-shot criterion from one acceptance scenario.
 *
 * @evidence contracts/common.md#principled-implementation Discriminates the criterion's declared kind; storySyncDiagnostics measures story-sync scenarios and leaves other acceptance families to their owners.
 * @evidence contracts/common.md#clear-and-simple-design Returns the existing criterion or null without translating events or tolerance; its caller decides how to evaluate it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selects no particular scenario, shot or event and adds no default tolerance or fabricated criterion.
 * @evidence contracts/common.md#meaningful-documentation Names the selected family and the null result for every other kind; this typed adapter does not validate arbitrary ingress.
 * @evidence contracts/performance.md#efficient-algorithms One discriminant comparison and reference return take constant time and space regardless of event count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reading one discriminant is the entire operation; retaining a result would add lookup and retention without removing substantial work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates no collection and retains nothing; the returned criterion remains the caller's scenario object.
 */
export function storySyncCriterionOf(
  scenario: IAutoMovieAcceptanceScenario,
): Extract<IAutoMovieAcceptanceScenario["criterion"], { kind: "story-sync" }> | null {
  return scenario.criterion.kind === "story-sync" ? scenario.criterion : null;
}

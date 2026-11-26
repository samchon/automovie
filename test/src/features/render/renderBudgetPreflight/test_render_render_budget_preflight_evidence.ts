import type { IAutoMovieRenderBudgetAssessment } from "@automovie/interface";
import { AutoMovieRenderBudgetPreflight } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * The render budget preflight gathers per-shot assessments into evidence and a
 * refusal.
 *
 * Scenarios:
 *
 * 1. `AutoMovieRenderBudgetPreflight.budgetEvidence` sorts the shots by id,
 *    takes the worst status (`within` < `incomplete` < `not-run` < `over`), is
 *    `not-run` with
 *    no shot, is not budgeted without budgets, and digests the same input to
 *    the same text and a changed status to another.
 * 2. `AutoMovieRenderBudgetPreflight.budgetRefusal` is null when nothing is
 *    over, and names each over-budget shot, with the tier, when one is.
 * 3. `AutoMovieRenderBudgetPreflight.targetRendererOfGraphics` is null without
 *    graphics and names blank fields `unknown`.
 */
export function test_render_render_budget_preflight_evidence(): void {
  const assessment = (
    shot: string,
    status: IAutoMovieRenderBudgetAssessment["status"],
  ): IAutoMovieRenderBudgetAssessment => ({
    shot,
    status,
    reason: null,
    report: null,
    inventory: null,
    mask: null,
    target: null,
  });
  const evidence = (...assessments: IAutoMovieRenderBudgetAssessment[]) =>
    AutoMovieRenderBudgetPreflight.budgetEvidence({
      tier: "final",
      budgets: undefined,
      assessments,
    });
  const mixed = evidence(assessment("b", "within"), assessment("a", "incomplete"));
  TestValidator.equals(
    "sorted and worst",
    [mixed.shots.map((shot): string => shot.shot), mixed.status, mixed.budgeted, mixed.declaredTiers],
    [["a", "b"], "incomplete", false, []],
  );
  TestValidator.equals("empty", evidence().status, "not-run");
  TestValidator.equals(
    "over is worst",
    evidence(assessment("a", "not-run"), assessment("b", "over")).status,
    "over",
  );
  TestValidator.equals(
    "stable digest",
    evidence(assessment("a", "within")).digest,
    evidence(assessment("a", "within")).digest,
  );
  TestValidator.predicate(
    "digest follows status",
    evidence(assessment("a", "within")).digest !== evidence(assessment("a", "over")).digest,
  );

  TestValidator.equals(
    "nothing over",
    AutoMovieRenderBudgetPreflight.budgetRefusal(
      evidence(assessment("a", "within")),
    ),
    null,
  );
  const refusal: string | null = AutoMovieRenderBudgetPreflight.budgetRefusal(
    evidence(assessment("a", "within"), assessment("b", "over")),
  );
  TestValidator.equals(
    "over",
    refusal,
    'Render tier "final" is over budget in 1 shot(s): b: the assessment recorded no over-limit finding to recover from',
  );

  TestValidator.equals(
    "no graphics",
    AutoMovieRenderBudgetPreflight.targetRendererOfGraphics(null),
    null,
  );
  TestValidator.equals(
    "blank fields",
    AutoMovieRenderBudgetPreflight.targetRendererOfGraphics({
      api: "webgl2",
      vendor: " ",
      renderer: "",
    }),
    { api: "webgl2", vendor: "unknown", device: "unknown" },
  );
}

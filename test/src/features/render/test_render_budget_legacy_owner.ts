import { TestValidator } from "@nestia/e2e";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";

/**
 * Legacy and explicit own rows retain additive editable-owner accounting.
 *
 * Scenarios:
 *
 * 1. Two rows for the same lantern combine into one contributor without losing either cost.
 */
export const test_render_budget_legacy_owner = (): void => {
  const target = renderBudgetTargetFixture();
  const subject = renderBudgetSubjectFixture;
  const budget = renderReportBudgetFixture();

  const inventory = measure(subject());

  TestValidator.equals(
    "a legacy owner and an explicit own row are summed, not listed twice",
    report(
      {
        ...inventory,
        owners: [
          {
            owner: "node:lantern",
            source: 'scene.nodes["lantern"]',
            metric: "triangles",
            cost: 7,
          },
          {
            owner: "node:lantern",
            source: 'scene.nodes["lantern"]',
            metric: "triangles",
            cost: 5,
            kind: "own",
          },
        ],
      },
      { ...budget, limits: { triangles: 1 } },
      target,
    ).findings.find((finding) => finding.metric === "triangles")!.contributors,
    [{ owner: "node:lantern", source: 'scene.nodes["lantern"]', cost: 12 }],
  );
};

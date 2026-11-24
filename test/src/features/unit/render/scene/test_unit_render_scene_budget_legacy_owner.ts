import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../../../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../../../internal/measureRenderBudgetSubject";
import { renderBudgetSubjectFixture } from "../../../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../../../internal/renderBudgetTargetFixture";
import { renderReportBudgetFixture } from "../../../internal/renderReportBudgetFixture";

/**
 * Legacy and explicit own rows retain additive editable-owner accounting.
 *
 * Scenarios:
 *
 * 1. Two rows for the same lantern combine into one contributor without losing either cost.
 */
export function test_unit_render_scene_budget_legacy_owner(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> =
    renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> =
    renderReportBudgetFixture();

  const inventory: ReturnType<typeof measure> = measure(subject());

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
    ).findings.find(
      (finding: ReturnType<typeof report>["findings"][number]): boolean =>
        finding.metric === "triangles",
    )!.contributors,
    [{ owner: "node:lantern", source: 'scene.nodes["lantern"]', cost: 12 }],
  );
}

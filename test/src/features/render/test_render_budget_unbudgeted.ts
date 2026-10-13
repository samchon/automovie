import { TestValidator } from "@nestia/e2e";
import { BOX_TRIANGLES } from "../internal/renderFixtures";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";

/**
 * A production without declared limits still reports its measured resources.
 *
 * Scenarios:
 *
 * 1. Every metric remains unbudgeted and the report retains its measured triangle total.
 */
export const test_render_budget_unbudgeted = (): void => {
  const target = renderBudgetTargetFixture();
  const subject = renderBudgetSubjectFixture;

  const inventory = measure(subject());

  const legacy = report(inventory, null, target);

  TestValidator.equals(
    "a production declaring no budget keeps the documented unbudgeted default",
    {
      tier: legacy.tier,
      status: legacy.status,
      statuses: [...new Set(legacy.findings.map((finding) => finding.status))],
      limits: [...new Set(legacy.findings.map((finding) => finding.limit))],
      measured: legacy.findings.find(
        (finding) => finding.metric === "triangles",
      )!.measured,
    },
    {
      tier: "unbudgeted",
      status: "within",
      statuses: ["unbudgeted"],
      limits: [null],
      measured: 2 * (5 * BOX_TRIANGLES + 12 * BOX_TRIANGLES),
    },
  );
};

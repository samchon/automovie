import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../../../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../../../internal/measureRenderBudgetSubject";
import { renderBudgetSubjectFixture } from "../../../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../../../internal/renderBudgetTargetFixture";
import { BOX_TRIANGLES } from "../../../internal/renderFixtures";

/**
 * A production without declared limits still reports its measured resources.
 *
 * Scenarios:
 *
 * 1. Every metric remains unbudgeted and the report retains its measured triangle total.
 */
export function test_unit_render_scene_budget_unbudgeted(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> =
    renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;

  const inventory: ReturnType<typeof measure> = measure(subject());

  const legacy: ReturnType<typeof report> = report(inventory, null, target);

  TestValidator.equals(
    "a production declaring no budget keeps the documented unbudgeted default",
    {
      tier: legacy.tier,
      status: legacy.status,
      statuses: [
        ...new Set(
          legacy.findings.map(
            (
              finding: (typeof legacy.findings)[number],
            ): typeof finding.status => finding.status,
          ),
        ),
      ],
      limits: [
        ...new Set(
          legacy.findings.map(
            (finding: (typeof legacy.findings)[number]): number | null =>
              finding.limit,
          ),
        ),
      ],
      measured: legacy.findings.find(
        (finding: (typeof legacy.findings)[number]): boolean =>
          finding.metric === "triangles",
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
}

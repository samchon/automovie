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
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the original subject and evaluates it with a null budget, asserting the unbudgeted tier, aggregate status, unique per-metric status/limit sets and retained triangle measurement.
 * @evidence contracts/testing.md#independent-expectations No declared limits means null limits and unbudgeted findings under the documented within aggregate, not missing measurements. Five staged unit boxes and twelve instance slots give the literal two-pass triangle formula; within here proves no declared limit was exceeded, not budget clearance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the absent-budget twin against an otherwise populated measurable subject; explicit limits, incomplete observations and over-limit refusals are covered separately.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_unbudgeted owns one portable inventory/report case through existing fixtures with no drawing, capture, file write or GPU allocation.
 */
export function test_render_budget_unbudgeted(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> = renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;

  const inventory: ReturnType<typeof measure> = measure(subject());

  const legacy: ReturnType<typeof report> = report(inventory, null, target);

  TestValidator.equals(
    "a production declaring no budget keeps the documented unbudgeted default",
    {
      tier: legacy.tier,
      status: legacy.status,
      statuses: [...new Set(legacy.findings.map((finding: typeof legacy.findings[number]): typeof finding.status => finding.status))],
      limits: [...new Set(legacy.findings.map((finding: typeof legacy.findings[number]): number | null => finding.limit))],
      measured: legacy.findings.find(
        (finding: typeof legacy.findings[number]): boolean => finding.metric === "triangles",
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

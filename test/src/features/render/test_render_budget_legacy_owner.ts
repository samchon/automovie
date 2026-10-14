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
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates an inventory whose two lantern rows differ only by absent versus explicit own kind, asserting one combined contributor and its unchanged editable source path.
 * @evidence contracts/testing.md#independent-expectations The legacy absent-kind contract means own, so authored costs seven and five add to the literal twelve without duplicate contributor identities; no measured total is used to derive that expectation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the absent/explicit-kind twin at one owner address; pass rows, multiple dominant owners and contributor truncation are owned by adjacent tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_legacy_owner owns one portable CPU report case over caller-built inventory rows and acquires no renderer, file or native host.
 */
export function test_render_budget_legacy_owner(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> = renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> = renderReportBudgetFixture();

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
    ).findings.find((finding: ReturnType<typeof report>["findings"][number]): boolean => finding.metric === "triangles")!.contributors,
    [{ owner: "node:lantern", source: 'scene.nodes["lantern"]', cost: 12 }],
  );
}

import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { BOX_TRIANGLES } from "../internal/renderFixtures";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";

/**
 * A pass-only public inventory retains its cost without inventing an editable resource.
 *
 * Scenarios:
 *
 * 1. The outline pass is omitted from ranked contributors but remains in the complete overrun and recovery.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates a public inventory whose only triangle attribution is an outline pass, requiring over status, no editable contributors, one omitted contributor with its complete cost and recovery naming the pass without an invented edit destination.
 * @evidence contracts/testing.md#independent-expectations The authored single pass costs BOX_TRIANGLES against a zero limit, so all cost exceeds the limit while none belongs to an editable scene resource. Literal count/status/recovery fragments distinguish accounting from actionable owner ranking.
 * @evidence contracts/testing.md#distinguishing-cases Retains pass-only overrun, omitted contributor count/cost, missing editable-owner explanation and prohibition on false edit instructions. Mixed editable/pass populations and ranked truncation belong to overrun-owner and contributor-bound tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_pass_accounting owns synchronous portable report evaluation through the shared fixture seam; the outline pass is accounting data and no graphical pass or native host executes.
 */
export function test_render_budget_pass_accounting(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> =
    renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> =
    renderReportBudgetFixture();

  const inventory: ReturnType<typeof measure> = measure(subject());

  const passOnly: ReturnType<typeof report>["findings"][number] = report(
    {
      ...inventory,
      totals: { ...inventory.totals, triangles: BOX_TRIANGLES },
      owners: [
        {
          owner: "render-pass:outline",
          source: "render.pass.outline",
          metric: "triangles",
          cost: BOX_TRIANGLES,
          kind: "pass",
        },
      ],
      gaps: [],
    },
    { ...budget, limits: { ...budget.limits, triangles: 0 } },
    target,
  ).findings.find(
    (finding: ReturnType<typeof report>["findings"][number]): boolean =>
      finding.metric === "triangles",
  )!;

  TestValidator.equals(
    "a pass-only boundary has accounting but no false edit destination",
    {
      status: passOnly.status,
      contributors: passOnly.contributors,
      omittedContributors: passOnly.omittedContributors,
      omittedCost: passOnly.omittedCost,
      explainsNoEditableOwner: (passOnly.recovery ?? "").includes(
        "attributed none of it to an editable owner",
      ),
      explainsPass: (passOnly.recovery ?? "").includes(
        `a further ${BOX_TRIANGLES} of that total is frame passes redrawing the opaque owners, the largest "render-pass:outline" at ${BOX_TRIANGLES}`,
      ),
      inventsEdit: (passOnly.recovery ?? "").includes("edited at"),
    },
    {
      status: "over",
      contributors: [],
      omittedContributors: 1,
      omittedCost: BOX_TRIANGLES,
      explainsNoEditableOwner: true,
      explainsPass: true,
      inventsEdit: false,
    },
  );
}

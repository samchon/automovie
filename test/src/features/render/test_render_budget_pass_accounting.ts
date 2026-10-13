import { TestValidator } from "@nestia/e2e";
import { BOX_TRIANGLES } from "../internal/renderFixtures";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";

/**
 * A pass-only public inventory retains its cost without inventing an editable resource.
 *
 * Scenarios:
 *
 * 1. The outline pass is omitted from ranked contributors but remains in the complete overrun and recovery.
 */
export const test_render_budget_pass_accounting = (): void => {
  const target = renderBudgetTargetFixture();
  const subject = renderBudgetSubjectFixture;
  const budget = renderReportBudgetFixture();

  const inventory = measure(subject());

  const passOnly = report(
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
  ).findings.find((finding) => finding.metric === "triangles")!;

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
};

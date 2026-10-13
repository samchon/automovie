import { IAutoMovieRenderInventory } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";

/**
 * An absent measurement reason and an unowned overrun cannot become a cleared report.
 *
 * Scenarios:
 *
 * 1. Missing vertices are not-run; material overrun remains over and explains its absent editable attribution.
 */
export const test_render_budget_unexplained_gap = (): void => {
  const target = renderBudgetTargetFixture();
  const subject = renderBudgetSubjectFixture;
  const budget = renderReportBudgetFixture();

  const inventory = measure(subject());

  const silent: IAutoMovieRenderInventory = {
    ...inventory,
    totals: { ...inventory.totals, vertices: null },
    owners: inventory.owners.filter((entry) => entry.metric !== "materials"),
    gaps: [],
  };

  const silentReport = report(
    silent,
    { ...budget, limits: { ...budget.limits, materials: 0 } },
    target,
  );

  TestValidator.equals(
    "a value with no reason is not-run, and an unowned overrun still says what to do",
    {
      vertices: silentReport.findings.find(
        (finding) => finding.metric === "vertices",
      )!.status,
      reason: (
        silentReport.findings.find((finding) => finding.metric === "vertices")!
          .recovery ?? ""
      ).includes("declared no reason"),
      materials: silentReport.findings.find(
        (finding) => finding.metric === "materials",
      )!.contributors.length,
      unowned: (
        silentReport.findings.find((finding) => finding.metric === "materials")!
          .recovery ?? ""
      ).includes("attributed none of it to an editable owner"),
      status: silentReport.status,
    },
    {
      vertices: "not-run",
      reason: true,
      materials: 0,
      unowned: true,
      status: "over",
    },
  );
};

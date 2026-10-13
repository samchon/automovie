import { TestValidator } from "@nestia/e2e";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";

/**
 * Unavailable texture and fluid measurements stay incomplete rather than becoming zero cost.
 *
 * Scenarios:
 *
 * 1. Absent texture facts report not-run; an unmeasured water body reports unsupported fluid metrics.
 */
export const test_render_budget_incomplete_resources = (): void => {
  const target = renderBudgetTargetFixture();
  const subject = renderBudgetSubjectFixture;
  const budget = renderReportBudgetFixture();

  const blind = measure({ ...subject(), textures: [] });

  const blindReport = report(blind, budget, target);

  TestValidator.equals(
    "withholding texture dimensions is not-run, never zero",
    {
      total: blind.totals.textureBytes,
      count: blind.totals.textures,
      gaps: blind.gaps.map((gap) => [gap.metric, gap.status]),
      status: blindReport.status,
      finding: blindReport.findings.find(
        (finding) => finding.metric === "textureBytes",
      )!.status,
      recovers: (
        blindReport.findings.find(
          (finding) => finding.metric === "textureBytes",
        )!.recovery ?? ""
      ).includes("decoded dimensions"),
    },
    {
      total: null,
      count: null,
      gaps: [["textureBytes", "not-run"], ["textures", "not-run"]],
      status: "incomplete",
      finding: "not-run",
      recovers: true,
    },
  );

  const unsolved = measure({
    ...subject(),
    waterBodies: [
      {
        id: "atrium-pool",
        owner: "space:tower/ground-hall",
        nodes: [],
        cells: null,
        particles: null,
        domain: null,
        material: null,
      },
    ],
  });

  const unsolvedReport = report(unsolved, budget, target);

  TestValidator.equals(
    "a water body no solver measured is unsupported, never zero",
    {
      cells: unsolved.totals.fluidCells,
      particles: unsolved.totals.fluidParticles,
      statuses: unsolvedReport.findings
        .filter(
          (finding) =>
            finding.metric === "fluidCells" ||
            finding.metric === "fluidParticles",
        )
        .map((finding) => finding.status),
      report: unsolvedReport.status,
    },
    {
      cells: null,
      particles: null,
      statuses: ["unsupported", "unsupported"],
      report: "incomplete",
    },
  );
};

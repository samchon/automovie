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
 *
 * @evidence contracts/testing.md#behavioral-verification Measures and evaluates the supplied subject after withholding texture facts and then water-domain counts, asserting null totals, ordered gap/finding statuses, incomplete reports and the existing texture recovery wording.
 * @evidence contracts/testing.md#independent-expectations Missing decoded storage observations are unknown rather than zero, while a water body with no domain/cell/particle measurement cannot yield supported fluid counts. Literal null/not-run/unsupported/incomplete expectations follow those contracts without estimating GPU use.
 * @evidence contracts/testing.md#distinguishing-cases Preserves separate absent-texture and unresolved-water cases; populated measurement, malformed refusal and an intentionally undeclared budget are covered by adjacent tests.
 * @evidence contracts/testing.md#execution-ownership The named test_render_budget_incomplete_resources owns both portable CPU inventory/report cases through existing fixtures; no texture upload, fluid solver host, browser or GPU runs.
 */
export function test_render_budget_incomplete_resources(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> = renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> = renderReportBudgetFixture();

  const blind: ReturnType<typeof measure> = measure({ ...subject(), textures: [] });

  const blindReport: ReturnType<typeof report> = report(blind, budget, target);

  TestValidator.equals(
    "withholding texture dimensions is not-run, never zero",
    {
      total: blind.totals.textureBytes,
      count: blind.totals.textures,
      gaps: blind.gaps.map((gap: ReturnType<typeof measure>["gaps"][number]): string[] => [gap.metric, gap.status]),
      status: blindReport.status,
      finding: blindReport.findings.find(
        (finding: ReturnType<typeof report>["findings"][number]): boolean => finding.metric === "textureBytes",
      )!.status,
      recovers: (
        blindReport.findings.find(
          (finding: ReturnType<typeof report>["findings"][number]): boolean => finding.metric === "textureBytes",
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

  const unsolved: ReturnType<typeof measure> = measure({
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

  const unsolvedReport: ReturnType<typeof report> = report(unsolved, budget, target);

  TestValidator.equals(
    "a water body no solver measured is unsupported, never zero",
    {
      cells: unsolved.totals.fluidCells,
      particles: unsolved.totals.fluidParticles,
      statuses: unsolvedReport.findings
        .filter(
          (finding: ReturnType<typeof report>["findings"][number]): boolean =>
            finding.metric === "fluidCells" ||
            finding.metric === "fluidParticles",
        )
        .map((finding: ReturnType<typeof report>["findings"][number]): ReturnType<typeof report>["findings"][number]["status"] => finding.status),
      report: unsolvedReport.status,
    },
    {
      cells: null,
      particles: null,
      statuses: ["unsupported", "unsupported"],
      report: "incomplete",
    },
  );
}

import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../../../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../../../internal/measureRenderBudgetSubject";
import { renderBudgetSubjectFixture } from "../../../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../../../internal/renderBudgetTargetFixture";
import { renderReportBudgetFixture } from "../../../internal/renderReportBudgetFixture";

/**
 * Unavailable texture and fluid measurements stay incomplete rather than becoming zero cost.
 *
 * Scenarios:
 *
 * 1. Absent texture facts report not-run; an unmeasured water body reports unsupported fluid metrics.
 */
export function test_unit_render_scene_budget_incomplete_resources(): void {
  const target: ReturnType<typeof renderBudgetTargetFixture> =
    renderBudgetTargetFixture();
  const subject: typeof renderBudgetSubjectFixture = renderBudgetSubjectFixture;
  const budget: ReturnType<typeof renderReportBudgetFixture> =
    renderReportBudgetFixture();

  const blind: ReturnType<typeof measure> = measure({
    ...subject(),
    textures: [],
  });

  const blindReport: ReturnType<typeof report> = report(blind, budget, target);

  TestValidator.equals(
    "withholding texture dimensions is not-run, never zero",
    {
      total: blind.totals.textureBytes,
      count: blind.totals.textures,
      gaps: blind.gaps.map(
        (gap: ReturnType<typeof measure>["gaps"][number]): string[] => [
          gap.metric,
          gap.status,
        ],
      ),
      status: blindReport.status,
      finding: blindReport.findings.find(
        (finding: ReturnType<typeof report>["findings"][number]): boolean =>
          finding.metric === "textureBytes",
      )!.status,
      recovers: (
        blindReport.findings.find(
          (finding: ReturnType<typeof report>["findings"][number]): boolean =>
            finding.metric === "textureBytes",
        )!.recovery ?? ""
      ).includes("decoded dimensions"),
    },
    {
      total: null,
      count: null,
      gaps: [
        ["textureBytes", "not-run"],
        ["textures", "not-run"],
      ],
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

  const unsolvedReport: ReturnType<typeof report> = report(
    unsolved,
    budget,
    target,
  );

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
        .map(
          (
            finding: ReturnType<typeof report>["findings"][number],
          ): ReturnType<typeof report>["findings"][number]["status"] =>
            finding.status,
        ),
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

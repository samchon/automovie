import {
  AutoMovieRenderMetric,
  IAutoMovieRenderBudget,
  IAutoMovieRenderFinding,
  IAutoMovieRenderInventory,
  IAutoMovieRenderOwnerCost,
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture as report } from "../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { renderBudgetSubjectFixture } from "../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../internal/renderBudgetTargetFixture";
import { renderReportBudgetFixture } from "../internal/renderReportBudgetFixture";
import type { IAutoMovieRenderSubject } from "./../../../../packages/engine/src/render/IAutoMovieRenderSubject";

/**
 * An absent measurement reason and an unowned overrun cannot become a cleared report.
 *
 * Scenarios:
 *
 * 1. Missing vertices are not-run; material overrun remains over and explains its absent editable attribution.
 * 2. Equal measured costs with different contributor source paths or gap reason/remedy must produce distinct report identities.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates the real report for missing analysis and unowned overrun, then changes only editable source or explicit recovery facts; omitted finding fields in the digest fail the identity assertions without changing cost/status.
 * @evidence contracts/testing.md#independent-expectations Null vertices without a gap have no measured success, and a material total above zero limit remains over even with no owner. Distinct authored source paths and reason/remedy strings represent different report findings despite identical metric/owner/cost values, so their sealed identities must differ.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent explanation, absent editable attribution, equal-cost source changes, reason-only and remedy-only neighbors plus unchanged report repetition. Cost-ranking and contributor population bounds belong to test_render_budget_contributor_bounds.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_budget_unexplained_gap owns portable synchronous report cases through the shared evaluation seam; it replaces no globals/methods and starts no renderer, process or installed consumer.
 */
export function test_render_budget_unexplained_gap(): void {
  const target: IAutoMovieRenderTarget = renderBudgetTargetFixture();
  const subject: () => IAutoMovieRenderSubject = renderBudgetSubjectFixture;
  const budget: IAutoMovieRenderBudget = renderReportBudgetFixture();

  const inventory: IAutoMovieRenderInventory = measure(subject());

  const silent: IAutoMovieRenderInventory = {
    ...inventory,
    totals: { ...inventory.totals, vertices: null },
    owners: inventory.owners.filter(
      (entry: IAutoMovieRenderOwnerCost): boolean =>
        entry.metric !== "materials",
    ),
    gaps: [],
  };

  const silentReport: IAutoMovieRenderReport = report(
    silent,
    { ...budget, limits: { ...budget.limits, materials: 0 } },
    target,
  );

  TestValidator.equals(
    "a value with no reason is not-run, and an unowned overrun still says what to do",
    {
      vertices: silentReport.findings.find(
        (finding: IAutoMovieRenderFinding): boolean =>
          finding.metric === "vertices",
      )!.status,
      reason: (
        silentReport.findings.find(
          (finding: IAutoMovieRenderFinding): boolean =>
            finding.metric === "vertices",
        )!.recovery ?? ""
      ).includes("declared no reason"),
      materials: silentReport.findings.find(
        (finding: IAutoMovieRenderFinding): boolean =>
          finding.metric === "materials",
      )!.contributors.length,
      unowned: (
        silentReport.findings.find(
          (finding: IAutoMovieRenderFinding): boolean =>
            finding.metric === "materials",
        )!.recovery ?? ""
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
  const identity: ReturnType<typeof report> = report(inventory, budget, target);
  const movedSource: ReturnType<typeof report> = report(
    {
      ...inventory,
      owners: inventory.owners.map(
        (
          entry: IAutoMovieRenderOwnerCost,
        ): {
          source: string;
          owner: string;
          metric: AutoMovieRenderMetric;
          kind?: "own" | "pass" | "runtime";
          cost: number;
        } => ({ ...entry, source: `${entry.source}\nother|source=1` }),
      ),
    },
    budget,
    target,
  );
  TestValidator.predicate(
    "identical cost does not erase contributor source identity",
    (): boolean => identity.digest !== movedSource.digest,
  );
  TestValidator.equals(
    "unchanged full findings repeat identity",
    report(inventory, budget, target).digest,
    identity.digest,
  );
  const gapInventory: IAutoMovieRenderInventory = {
    ...silent,
    gaps: [
      {
        metric: "vertices",
        status: "not-run",
        reason: "missing decoded fact",
        remedy: "supply the fact",
      },
    ],
  };
  const explained: ReturnType<typeof report> = report(
    gapInventory,
    budget,
    target,
  );
  TestValidator.predicate(
    "gap reason participates in report identity",
    (): boolean =>
      explained.digest !==
      report(
        {
          ...gapInventory,
          gaps: [
            { ...gapInventory.gaps[0]!, reason: "different missing fact" },
          ],
        },
        budget,
        target,
      ).digest,
  );
  TestValidator.predicate(
    "gap remedy participates in report identity",
    (): boolean =>
      explained.digest !==
      report(
        {
          ...gapInventory,
          gaps: [
            { ...gapInventory.gaps[0]!, remedy: "different recovery action" },
          ],
        },
        budget,
        target,
      ).digest,
  );
}

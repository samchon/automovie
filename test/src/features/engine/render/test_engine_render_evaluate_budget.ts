import type {
  IAutoMovieRenderFinding,
  IAutoMovieRenderInventory,
  IAutoMovieRenderReport,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { evaluateRenderBudgetFixture } from "../../internal/evaluateRenderBudgetFixture";
import { measureRenderBudgetSubject } from "../../internal/measureRenderBudgetSubject";
import { renderBudgetSubjectFixture } from "../../internal/renderBudgetSubjectFixture";
import { renderBudgetTargetFixture } from "../../internal/renderBudgetTargetFixture";
import { BOX_TRIANGLES } from "../../internal/renderFixtures";
import { renderReportBudgetFixture } from "../../internal/renderReportBudgetFixture";
import { throwsError } from "../../internal/throwsError";

/**
 * The staged triangles: five boxes and twelve instances, drawn twice for the
 * shadow map.
 */
const TRIANGLES: number = 2 * (5 * BOX_TRIANGLES + 12 * BOX_TRIANGLES);

/** The finding of a metric. */
const finding: (
  report: IAutoMovieRenderReport,
  metric: IAutoMovieRenderFinding["metric"],
) => IAutoMovieRenderFinding = (
  report: IAutoMovieRenderReport,
  metric: IAutoMovieRenderFinding["metric"],
): IAutoMovieRenderFinding =>
  report.findings.find(
    (entry: IAutoMovieRenderFinding): boolean => entry.metric === metric,
  )!;

/**
 * `evaluateRenderBudget` sets a measured inventory against a budget's
 * limits, one finding for each metric.
 *
 * Scenarios, on the staged tower (five boxes, twelve instanced windows, one
 * shadow-casting light, so 2 x (5 + 12) x 12 = 408 triangles):
 *
 * 1. Under the generous review budget the report is "within", the triangle finding
 *    measures 408 against the limit 1000 with no excess, and the report carries
 *    the budget's tier.
 * 2. A triangle limit of 400 is "over" by 8, so the whole report is "over".
 * 3. With no budget the tier is "unbudgeted" and every finding has no limit.
 * 4. The same inputs give the same digest; a different limit another one.
 * 5. A negative limit and a contributor bound of zero are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names within and over limits, unbudgeted reporting, stable and varied digests, and malformed limit and contributor requests.
 * @evidence contracts/development/testing.md#behavioral-verification Measures an authored render subject through the inventory fixture and passes it to the budget evaluator with two limits and an absent budget.
 * @evidence contracts/development/testing.md#independent-expectations Five boxes and twelve instances have twelve triangles each. Drawing each twice for the shadow pass yields 408. Limits 1000 and 400 give zero and eight excess, respectively.
 */
export function test_engine_render_evaluate_budget(): void {
  const inventory: IAutoMovieRenderInventory = measureRenderBudgetSubject(
    renderBudgetSubjectFixture(),
  );
  const budget = renderReportBudgetFixture();
  const target = renderBudgetTargetFixture();
  const within: IAutoMovieRenderReport = evaluateRenderBudgetFixture(
    inventory,
    budget,
    target,
  );
  const triangles: IAutoMovieRenderFinding = finding(within, "triangles");
  TestValidator.equals(
    "within the generous budget",
    [
      within.status,
      within.tier,
      triangles.measured,
      triangles.limit,
      triangles.excess,
    ],
    ["within", "review", TRIANGLES, 1000, 0],
  );
  const over: IAutoMovieRenderReport = evaluateRenderBudgetFixture(
    inventory,
    { ...budget, limits: { ...budget.limits, triangles: 400 } },
    target,
  );
  TestValidator.equals(
    "over a tight triangle limit",
    [
      over.status,
      finding(over, "triangles").status,
      finding(over, "triangles").excess,
    ],
    ["over", "over", TRIANGLES - 400],
  );
  const open: IAutoMovieRenderReport = evaluateRenderBudgetFixture(
    inventory,
    null,
    target,
  );
  TestValidator.predicate(
    "no budget",
    open.tier === "unbudgeted" &&
      open.findings.every(
        (entry: IAutoMovieRenderFinding): boolean => entry.limit === null,
      ),
  );
  TestValidator.predicate(
    "digests",
    within.digest ===
      evaluateRenderBudgetFixture(inventory, budget, target).digest &&
      within.digest !== over.digest,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      (): unknown =>
        evaluateRenderBudgetFixture(
          inventory,
          { ...budget, limits: { triangles: -1 } },
          target,
        ),
      "at or above zero",
    ) &&
      throwsError(
        (): unknown =>
          evaluateRenderBudgetFixture(inventory, budget, target, 0),
        "contributor bound",
      ),
  );
}

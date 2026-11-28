import type { IAutoMovieRenderBudget } from "@automovie/interface";
import { AutoMovieRenderBudgetPreflight } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderBudgetPreflight.selectBudget` picks the budget declared for
 * a tier.
 *
 * Scenarios:
 *
 * 1. Of review and delivery budgets, "delivery" picks the delivery one.
 * 2. An undeclared tier and no budgets at all give null.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines tier selection and absence when the request has no declared budget.
 * @evidence contracts/development/testing.md#behavioral-verification Selects among distinct review and delivery entries and tries an undeclared tier and empty inputs.
 * @evidence contracts/development/testing.md#independent-expectations The literal delivery tier resolves only its own entry. No matching entry yields null in both absence cases.
 */
export function test_render_render_budget_preflight_select_budget(): void {
  const review: IAutoMovieRenderBudget = {
    version: 1,
    tier: "review",
    limits: {},
  };
  const delivery: IAutoMovieRenderBudget = {
    version: 1,
    tier: "delivery",
    limits: {},
  };
  TestValidator.equals(
    "the declared tier",
    AutoMovieRenderBudgetPreflight.selectBudget(
      [review, delivery],
      "delivery",
    ),
    delivery,
  );
  TestValidator.equals(
    "no budget",
    [
      AutoMovieRenderBudgetPreflight.selectBudget([review], "delivery"),
      AutoMovieRenderBudgetPreflight.selectBudget(undefined, "review"),
    ],
    [null, null],
  );
}

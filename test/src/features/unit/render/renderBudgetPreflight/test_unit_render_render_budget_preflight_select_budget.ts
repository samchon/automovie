import type { IAutoMovieRenderBudget } from "@automovie/interface";
import { selectAutoMovieRenderBudget } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `selectAutoMovieRenderBudget` picks the budget declared for a tier.
 *
 * Scenarios:
 *
 * 1. Of review and delivery budgets, "delivery" picks the delivery one.
 * 2. An undeclared tier and no budgets at all give null.
 */
export function test_unit_render_render_budget_preflight_select_budget(): void {
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
    selectAutoMovieRenderBudget([review, delivery], "delivery"),
    delivery,
  );
  TestValidator.equals(
    "no budget",
    [
      selectAutoMovieRenderBudget([review], "delivery"),
      selectAutoMovieRenderBudget(undefined, "review"),
    ],
    [null, null],
  );
}

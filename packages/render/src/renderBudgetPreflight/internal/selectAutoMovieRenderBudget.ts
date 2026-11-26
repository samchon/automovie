import { IAutoMovieRenderBudget } from "@automovie/interface";

/**
 * Select the budget a render job targets, or `null` when the production
 * declared none for this tier.
 *
 * Duplicate tiers resolve to the first declaration; this helper does not
 * validate their uniqueness or equality. `null` is not a pass: it makes every
 * metric `unbudgeted`, and a job that treated that as a clearance would be
 * reporting that nobody's limits were met.
 */
export const selectAutoMovieRenderBudget: (
  budgets: readonly IAutoMovieRenderBudget[] | undefined,
  tier: string,
) => IAutoMovieRenderBudget | null = (
  budgets: readonly IAutoMovieRenderBudget[] | undefined,
  tier: string,
): IAutoMovieRenderBudget | null =>
  (budgets ?? []).find(
    (budget: IAutoMovieRenderBudget): boolean => budget.tier === tier,
  ) ?? null;

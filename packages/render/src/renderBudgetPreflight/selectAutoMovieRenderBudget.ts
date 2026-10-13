import { IAutoMovieRenderBudget } from "@automovie/interface";


/**
 * Select the budget a render job targets, or `null` when the production
 * declared none for this tier.
 *
 * Ties resolve to the first declaration so the verdict never depends on which
 * of two identical tiers a reader happens to look at. `null` is not a pass: it
 * makes every metric `unbudgeted`, and a job that treated that as a clearance
 * would be reporting that nobody's limits were met.
 *
 * @author Samchon
 */
export const selectAutoMovieRenderBudget = (
  budgets: readonly IAutoMovieRenderBudget[] | undefined,
  tier: string,
): IAutoMovieRenderBudget | null =>
  (budgets ?? []).find((budget) => budget.tier === tier) ?? null;

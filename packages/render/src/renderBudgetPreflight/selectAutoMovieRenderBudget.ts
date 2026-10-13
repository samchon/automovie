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
 * @evidence requirements/rendering/budgets.md#rendering-budget-decision `selectAutoMovieRenderBudget` carries the conservative measurement basis and deterministic budget decision.
 * @evidence requirements/rendering/budgets.md#rendering-budget-tiers Selects only the caller-requested purpose tier and preserves an undeclared tier as an explicit unbudgeted result.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `selectAutoMovieRenderBudget` exposes that responsibility through the package-independent system contract.
 * @author Samchon
 */
export const selectAutoMovieRenderBudget = (
  budgets: readonly IAutoMovieRenderBudget[] | undefined,
  tier: string,
): IAutoMovieRenderBudget | null =>
  (budgets ?? []).find((budget) => budget.tier === tier) ?? null;

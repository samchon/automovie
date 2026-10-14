import { IAutoMovieRenderBudget } from "@automovie/interface";


/**
 * Select the budget a render job targets, or `null` when the production
 * declared none for this tier.
 *
 * Duplicate tiers resolve to the first declaration; this helper does not validate their uniqueness or equality. `null` is not a pass: it
 * makes every metric `unbudgeted`, and a job that treated that as a clearance
 * would be reporting that nobody's limits were met.
 *
 * @evidence contracts/common.md#principled-implementation Array find implements declaration-order tier lookup with exact string equality; the first match wins and an absent declaration returns null rather than a passing report.
 * @evidence contracts/common.md#clear-and-simple-design One lookup defines tier selection for both job preflight and published evidence, keeping duplicate-tier precedence in the declaration owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither tier names nor budgets are normalized or repaired; missing and unmatched arrays share the contract's explicit unbudgeted result.
 * @evidence contracts/common.md#meaningful-documentation The comment states first-declaration precedence, null meaning and why an undeclared limit cannot certify clearance.
 * @evidence contracts/performance.md#efficient-algorithms For B declarations lookup stops at the first match and costs O(B) in the unmatched case, with constant extra space and no sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work The selected budget is returned by reference rather than copied; callers retain its declared identity and no lookup cache can become stale after a caller mutation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No array or module state is retained by the selector; the returned budget remains owned by the caller that supplied the declarations.
 */
export const selectAutoMovieRenderBudget: (budgets: readonly IAutoMovieRenderBudget[] | undefined, tier: string) => IAutoMovieRenderBudget | null = (
  budgets: readonly IAutoMovieRenderBudget[] | undefined,
  tier: string,
): IAutoMovieRenderBudget | null =>
  (budgets ?? []).find((budget: IAutoMovieRenderBudget): boolean => budget.tier === tier) ?? null;

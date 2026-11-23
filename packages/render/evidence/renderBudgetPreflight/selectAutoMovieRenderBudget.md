# src/renderBudgetPreflight/selectAutoMovieRenderBudget.ts#selectAutoMovieRenderBudget

## @evidence contracts/development/implementation.md#principled-implementation

Array find implements declaration-order tier lookup with exact string equality; the first match wins and an absent declaration returns null rather than a passing report.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup defines tier selection for both job preflight and published evidence, keeping duplicate-tier precedence in the declaration owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither tier names nor budgets are normalized or repaired; missing and unmatched arrays share the contract's explicit unbudgeted result.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states first-declaration precedence, null meaning and why an undeclared limit cannot certify clearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

For B declarations lookup stops at the first match and costs O(B) in the unmatched case, with constant extra space and no sorting.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The selected budget is returned by reference rather than copied; callers retain its declared identity and no lookup cache can become stale after a caller mutation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No array or module state is retained by the selector; the returned budget remains owned by the caller that supplied the declarations.

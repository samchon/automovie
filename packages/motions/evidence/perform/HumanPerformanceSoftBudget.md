# src/perform/HumanPerformanceSoftBudget.ts#HumanPerformanceSoftBudget

## @evidence contracts/development/common.md#meaningful-documentation

Names the film and fixed-step clocks and the budget.

## @evidence contracts/development/implementation.md#principled-implementation

Ceiling covers the film's full interval with a rounding allowance at native boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Compute the native count and compare it to the declared limit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses over-budget spans instead of clipping the film or running a pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

One conversion and comparison.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No evaluation needs caching.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.

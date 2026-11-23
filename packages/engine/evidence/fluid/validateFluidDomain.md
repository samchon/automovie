# src/fluid/validateFluidDomain.ts#validateFluidDomain

## @evidence contracts/development/implementation.md#principled-implementation

Checks authored scalar domains, indexed-array cardinality and population/site constraints before callers integrate. The design-depth Courant expression is rejected only when greater than one; representable intermediate arithmetic, future depth stability and valid object structure remain premises rather than guarantees of this pass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One linear pass per field group with private helpers for integer, length, budget, identity, cell-site and activity-window rules; finite intervals use the shared `validateRange` and blank ids the collector's `nonEmpty`, so no range or blank rule is restated here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No authored value is clamped or defaulted; named budgets apply uniformly. A broken referenceDepth uses Infinity only as the depth-check ceiling to avoid repeated dependent findings. Finite cell products past the budget are refused even outside safe-integer precision, while the derived-NaN Courant bypass remains unresolved.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the field groups checked, path/value preservation, typed-object premise and the derived arithmetic/depth limits that admission leaves to consumers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is linear in actual bed/depth/solid array lengths, source/drain/spray counts and id text, even when declared counts are invalid or over budget. Full array scans name bad entries after cardinality/budget findings; id sets avoid sibling rescans, and findings plus distinct ids determine temporary/result storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single validation pass per call; nothing is shared across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the collector and id sets die with the call, and the returned violations, at most a few per declared field, belong to the caller.

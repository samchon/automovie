# src/film/equalProductionFrameRates.ts#equalProductionFrameRates

## @evidence contracts/development/implementation.md#principled-implementation

Reduced fractions are unique, so equality of reduced numerators and denominators is equality of the rational rates, with no floating-point division or tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A predicate over the shared canonicalizer, read by the render planners, the delivery profile check and production validation, so every rate comparison follows one identity rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No near-equal rates are treated as equal; 29.97 against 30000/1001 is refused by the canonicalizer rather than approximated.

## @evidence contracts/development/common.md#meaningful-documentation

States what equality means with equal and unequal examples and the throwing case it inherits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two canonicalizations, each logarithmic in its smaller term, and two integer comparisons.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure comparison of two values that coordinates nothing across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the two reduced records are dropped on return.

# src/validation/affordanceTravelRange.ts#affordanceTravelRange

## @evidence contracts/development/common.md#meaningful-documentation

States each kind's range, the units, the other way's travel and the meaning of null.

## @evidence contracts/development/implementation.md#principled-implementation

The ranges `IAutoMovieAffordance.travel` and `reverse` state for each kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per rule: the endless crank, the two-sided wheel, then the rest from the other way's travel to the forward one; owned here so engine admission of `follows` and the archetypes' pose read one rule.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case beyond the kinds' stated rules.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

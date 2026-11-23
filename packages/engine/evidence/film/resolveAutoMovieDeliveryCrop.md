# src/film/resolveAutoMovieDeliveryCrop.ts#resolveAutoMovieDeliveryCrop

## @evidence contracts/development/implementation.md#principled-implementation

Checks the four edges with `Number.isFinite` and closed unit bounds and the two orderings strictly, which is exactly the non-empty sub-rectangle of the unit square the interface allows; a malformed window throws instead of being clamped, so the author sees the fault.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one validator and default for a crop, called by `deliveryCropNdc` for culling and by geometry measurement, so every consumer reads the same window and the same refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No crop or resolution is special-cased; the whole-gate default is the interface's stated meaning of omission.

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate frame and origin, the acceptance conditions, the omission default, the copy guarantee and the error type with its causes.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Four finiteness and range tests and two comparisons in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validates one small record per call; callers that read the crop per frame call it once per frame and the cost is constant.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one four-field copy owned by the caller and retains nothing.

# src/geometry/IAutoMovieMeshSeparationResult.ts#IAutoMovieMeshSeparationResult

## @evidence contracts/development/design.md#principled-representation

The running bound starts at the target, the clearance or the smallest positive binary64 at zero, and falls only to a triangle's conservative projection bound below it, so `certified` is exactly `lowerBound > 0 && lowerBound >= clearance` over a bound that never overstates separation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the decision, the proof bound, the limiting face, the spent work and the attachment caps, which is what a caller needs to accept a row, report the blocking face and account its budget without a second query.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bound is capped at the target rather than refined toward a true distance, and an attachment result reports zero instead of a positive bound it did not prove, so no field claims more than the walk established.

## @evidence contracts/development/common.md#meaningful-documentation

States what certified and its negation mean, the cap and zero-clearance meaning of the bound, the limiting-triangle sentinel and tie rule, the budget count, and the attachment cap order.

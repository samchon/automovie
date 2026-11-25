# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes physical tolerance from arc and subdivision budgets.

## @evidence contracts/development/design.md#principled-representation

Positive finite tolerance and positive integer budgets require admission; reaching a budget returns partial evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies the three controls needed to bound adaptive approximation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No specimen-dependent preset or hidden quality option is exposed.

# src/geometry/IAutoMovieConicApproximation.ts#IAutoMovieConicApproximation.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines status, omission, certification and query accounting.

## @evidence contracts/development/design.md#principled-representation

The closed status union separates complete, limited and refused operations; runtime logic owns consistency with coefficients.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both experiments report their coefficients and limitations through one recovery result owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Diagnostics preserve unsupported premises rather than hiding them behind an empty successful fit.

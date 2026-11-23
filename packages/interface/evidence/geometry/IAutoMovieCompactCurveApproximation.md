# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

States geometric tolerance, candidate degrees and distinct output, subdivision and callback budgets.

## @evidence contracts/development/design.md#principled-representation

Closed degree choices prevent unsupported fitting modes; positive finite limits require runtime admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These controls are read by the current fitter and comparison consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No specimen preset, hidden quality mode or tolerance relaxation is supplied.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines completion as sampled fit coverage, not continuous error, topology or likeness certification.

## @evidence contracts/development/design.md#principled-representation

The status union and immutable coefficients distinguish complete, incomplete and empty refused outputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The comparison consumes every reported measurement, including numeric storage and callback cost.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

certified is always false because held-out samples do not establish continuous Hausdorff bounds.

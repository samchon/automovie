# src/geometry/sweep/IAutoMovieInterpolateMonotone.ts#IAutoMovieInterpolateMonotone

## @evidence contracts/development/common.md#meaningful-documentation

Increasing scalar knots and ordinates keep caller-chosen units; optional period shares the knot unit. Absent period selects constant open extension; one knot is valid, while numeric types leave ordering and finiteness to runtime admission.

## @evidence contracts/development/design.md#principled-representation

Increasing scalar knots and ordinates keep caller-chosen units; optional period shares the knot unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interpolateAutoMovieMonotone copies and admits IProps before compiling its reusable scalar evaluator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent period selects constant open extension; one knot is valid, while numeric types leave ordering and finiteness to runtime admission.

# src/geometry/sweep/IAutoMovieInterpolateMonotone.ts#IAutoMovieInterpolateMonotone.IProps

## @evidence contracts/development/design.md#principled-representation

Knots and period share caller-selected abscissa units; values retain their ordinate unit. interpolateAutoMovieMonotone admits nonempty finite ordered knots, matched values and periodic bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interpolator copies these arrays into its scalar evaluator, reused by geometric profiles without owning their metre or dimensionless interpretation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One optional period distinguishes open constant extension from periodic wrapping; no sorting, merging or positivity constraint changes the supplied data.

## @evidence contracts/development/common.md#meaningful-documentation

Gives admission, copied ownership, singleton behavior, unit correspondence and open versus periodic endpoint rules.

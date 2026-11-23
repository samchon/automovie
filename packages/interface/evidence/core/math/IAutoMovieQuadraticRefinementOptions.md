# src/core/math/IAutoMovieQuadraticRefinementOptions.ts#IAutoMovieQuadraticRefinementOptions

## @evidence contracts/development/design.md#principled-representation

One absolute threshold applied to the three KKT residuals of the original program, the standard admission for a numerical QP solution, plus a finite step count so polishing always terminates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two knobs the refinement reads, with no per-method or per-residual variant, so one budget covers both polishing methods.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The refinement never loosens the threshold or extends the budget for a hard problem.

## @evidence contracts/development/common.md#meaningful-documentation

States which residuals the threshold bounds and in which units, that passing is not a geometric guarantee, and each field's valid range and the meaning of a zero budget.

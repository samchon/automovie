# src/human/expression/IAutoMovieHumanActionUnitActivation.ts#IAutoMovieHumanActionUnitActivation

## @evidence contracts/development/common.md#meaningful-documentation

One action unit acting at one intensity on one or both sides.

## @evidence contracts/development/design.md#principled-representation `unit`: The action unit. `intensity`: Intensity from rest (0) to maximum (1). `side`: Which side acts, as the person's own left and right; `both` acts symmetrically.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanActionUnitActivation is the canonical exchange used by IAutoMovieHumanActionUnitActivationSchema, IAutoMovieHumanExpression.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `unit`, `intensity`, `side`; callers supply the complete record.

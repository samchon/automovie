# src/core/math/IAutoMovieSwingTwist.ts#IAutoMovieSwingTwist.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Gives factor order, shared frame, ownership, caller premises and the actual threshold convention.

## @evidence contracts/development/design.md#principled-representation

Two dimensionless canonical quaternions separate axial twist from residual swing; valid unit input and axis geometry are caller responsibilities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The engine swingTwist producer shares these factors between joint twist distribution and hinged-chain effector-error consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Degenerate projection has an explicit identity-twist convention; the result carries no validation status or physiological joint limit claim.

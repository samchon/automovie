# src/core/math/IAutoMovieQuadraticState.ts#IAutoMovieQuadraticState

## @evidence contracts/development/design.md#principled-representation

The Goulart and Chen quadratic homogeneous embedding augments primal, slack and dual vectors with tau and kappa, allowing either an optimum or an infeasibility certificate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The same private vector record carries iterates and their linearized directions; the iteration owner distinguishes their roles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No geometry or fixture identifiers enter numerical state.

## @evidence contracts/development/common.md#meaningful-documentation

States scalar positivity, equality freedom and the distinction between iterates and directions.

# src/analysis/IAutoMovieReferenceGround.ts#IAutoMovieReferenceGround

## @evidence contracts/development/design.md#principled-representation

A plane in normal-offset form; `autoMovieSkyward` tests `dot(direction, normalize(up)) > 0`, and `validateAutoMovieEnvironmentContext` requires a finite `up` longer than `1e-12` and a finite elevation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One direction and one offset define the analysis reference; terrain geometry and materials stay with their scene owners instead of being duplicated here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The horizon is taken through each sample point rather than at the stated elevation, which the documentation names as the current limitation instead of implying a height test that no solver performs.

## @evidence contracts/development/common.md#meaningful-documentation

States the plane's role, the scope exclusion, which field the solvers read, the exact ground-ray test, the elevation equation and unit, and that elevation is not yet evaluated.

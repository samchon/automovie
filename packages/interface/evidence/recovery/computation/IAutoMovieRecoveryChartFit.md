# src/recovery/computation/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Input

## @evidence contracts/development/design.md#principled-representation

Explicit chart parameters, physical observations and a shared coefficient registry define linear Bernstein fitting with box constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Null entries without affine owners are independent unknowns; repeated IDs and declared acyclic relations express positional sharing between patches.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller must supply the enclosure and parameter correspondence; the fitter infers neither topology nor material transport.

## @evidence contracts/development/common.md#meaningful-documentation

States coefficient ordering, fixed authority, physical units and explicit work limits.

# src/recovery/computation/IAutoMovieRecoveryChartFit.ts#IAutoMovieRecoveryChartFit.Result

## @evidence contracts/development/design.md#principled-representation

The result retains the constrained coefficients and evaluates every original weighted observation after solving.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Numerical convergence, residual acceptance and unresolved identifiability are separate fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither a solved gradient nor a small sample residual is labelled an injectivity or continuous-surface certificate.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes finite display data from convergence, source coverage and actual surface quality.

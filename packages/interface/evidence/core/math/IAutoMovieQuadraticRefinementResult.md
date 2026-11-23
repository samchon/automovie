# src/core/math/IAutoMovieQuadraticRefinementResult.ts#IAutoMovieQuadraticRefinementResult

## @evidence contracts/development/design.md#principled-representation

Reports the KKT residuals of the original program at the returned point, primal feasibility, stationarity of `H·x + q + Aᵀ·y` and complementarity, so admission reads the actual conditions rather than the solver's normalized measures or status alone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The solution, the three admission residuals and the diagnostics a failed solve's error message prints, the native report, row groups and the polishing attempt, in one record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Polishing can replace the solution only through full-row admission and never changes `status`, so no residual or status is massaged into success.

## @evidence contracts/development/common.md#meaningful-documentation

States when the solution is the native one or the polished candidate, that the status is never promoted, the caller's admission rule, ownership, and each residual's formula and unit.

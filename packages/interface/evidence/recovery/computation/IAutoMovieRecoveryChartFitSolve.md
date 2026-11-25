# src/recovery/computation/IAutoMovieRecoveryChartFitSolve.ts#IAutoMovieRecoveryChartFitSolve.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Lower componentwise control bound in the normalized solver chart. Upper componentwise control bound in the normalized solver chart.

## @evidence contracts/development/design.md#principled-representation

Lower componentwise control bound in the normalized solver chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

RecoveryChartFit, RecoveryChartFitReport, RecoveryChartFitSolve share IAutoMovieRecoveryChartFitSolve's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numerical box-solver output retained with its actual termination and objective diagnostics.

# src/recovery/IAutoMovieRecoveryChartFitSolve.ts#IAutoMovieRecoveryChartFitSolve.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The result separates normalized box solver diagnostics from restored original control coordinates.

## @evidence contracts/development/design.md#principled-representation

One vector iterate contains three axes per independent control. The prepared substitution reconstructs every original ID and restores translation and scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation owns numerical solve and coefficient reconstruction. Final rank, residual and enclosure qualification belongs to reporting.

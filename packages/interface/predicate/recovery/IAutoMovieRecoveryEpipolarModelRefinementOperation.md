# src/recovery/IAutoMovieRecoveryEpipolarModelRefinementOperation.ts#IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The result distinguishes the selected calibrated model and measured support, completed local reports, and failures of convergence or support stabilization.

## @evidence contracts/development/design.md#principled-representation

A fixed-subset fit can converge while changing the support. A changed set requires another fixed-population fit within the explicit refit ceiling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The refiner owns the current model, support and numerical diagnostics. Independent pair gates govern publication of the relative pose.

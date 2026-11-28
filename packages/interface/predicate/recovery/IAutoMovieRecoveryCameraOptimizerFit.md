# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit

## @evidence contracts/development/common.md#meaningful-documentation

The fit reports stopping rule, trial count, accepted updates, robust costs in squared pixels and a dimensionless local observability ratio.

## @evidence contracts/development/design.md#principled-representation

The optimizer uses an undamped weighted, column-scaled five-parameter design to qualify rank. Damping supplies a trial step, whose actual soft-L1 score decides acceptance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record explains one fixed-set fit. Final consensus owns support stability and camera acceptance across refits.

# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit.iterations

## @evidence contracts/development/common.md#meaningful-documentation

The loop counts trial steps, including rejected ones, and can stop on the prepared gradient without adding a trial.

# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit.acceptedSteps

## @evidence contracts/development/common.md#meaningful-documentation

The solver increments this count only after comparing the candidate objective with the current one.

# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit.termination

## @evidence contracts/development/common.md#meaningful-documentation

The optimizer distinguishes a small gradient, a small selected step, a small selected improvement, and exhausted iterations.

# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit.converged

## @evidence contracts/development/common.md#meaningful-documentation

The report marks exhausted iterations unfinished. Independent support stabilization still belongs to final consensus.

# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit.initialCost

## @evidence contracts/development/common.md#meaningful-documentation

The fixed report starts from the current calibrated pose model and evaluates its original-chart signed residual vector.

# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit.finalCost

## @evidence contracts/development/common.md#meaningful-documentation

The solver preserves its current accepted objective if later trial steps are refused.

# src/recovery/IAutoMovieRecoveryCameraOptimizerFit.ts#IAutoMovieRecoveryCameraOptimizerFit.minimumLocalDesignRatio

## @evidence contracts/development/common.md#meaningful-documentation

The rank calculation excludes damping rows, and the report takes the smallest ratio across visited local designs.

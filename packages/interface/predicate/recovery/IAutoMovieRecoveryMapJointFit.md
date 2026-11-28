# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit

## @evidence contracts/development/common.md#meaningful-documentation

The report separates robust cost and unweighted squared-pixel error, states the fixed observation population, and identifies the numerical convergence and original-design rank measures.

## @evidence contracts/development/design.md#principled-representation

Ordinary and feasible methods refine poses and points in a fixed gauge. Each evaluates the same observations throughout the fit. Their reports preserve distinct termination states and keep optional regularization, curvature and feasible evidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record owns the diagnostics for one fit. Scene transactions decide whether the fitted population can commit. An earlier report can survive a later capacity refusal without transferring rejected geometry.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.converged

## @evidence contracts/development/common.md#meaningful-documentation

Ordinary and feasible methods copy their local termination result. A scene still checks geometric eligibility after the fit.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.termination

## @evidence contracts/development/common.md#meaningful-documentation

The feasible adapter maps constrained `kkt` to `pixel-kkt` when it assembles this report.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.iterations

## @evidence contracts/development/common.md#meaningful-documentation

The report preserves the selected optimizer's actual attempt count, including rejected trials.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.acceptedSteps

## @evidence contracts/development/common.md#meaningful-documentation

The solvers count only selected updates, so this total can stay below the attempted work.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.observationCount

## @evidence contracts/development/common.md#meaningful-documentation

The fit prepares one fixed point-observation population and carries its count into the report.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.initialCost

## @evidence contracts/development/common.md#meaningful-documentation

The objective uses each two-coordinate residual norm and the declared pixel loss scale before any fit update.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.finalCost

## @evidence contracts/development/common.md#meaningful-documentation

The last selected state's objective uses the same fixed residual population and loss scale.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.initialSquaredError

## @evidence contracts/development/common.md#meaningful-documentation

The fitter also accumulates the squared pixel residual magnitudes without robust weights.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.finalSquaredError

## @evidence contracts/development/common.md#meaningful-documentation

This value is carried independently of the robust objective used for acceptance.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.minimumCameraDesignRatio

## @evidence contracts/development/common.md#meaningful-documentation

The fit tracks the weakest reduced original camera rank measure before regularization can affect a step.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.minimumPointDesignRatio

## @evidence contracts/development/common.md#meaningful-documentation

The point-elimination solve tests original point blocks and tracks the weakest observed point ratio.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.regularization

## @evidence contracts/development/common.md#meaningful-documentation

The feasible fit copies its optional adaptive agreement report with the completed numerical result.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.curvature

## @evidence contracts/development/common.md#meaningful-documentation

Lagged models report separate admission and model-use counters, leaving original rank diagnostics intact.

# src/recovery/IAutoMovieRecoveryMapJointFit.ts#IAutoMovieRecoveryMapJointFit.feasible

## @evidence contracts/development/common.md#meaningful-documentation

The feasible adapter copies its completed numerical report into an owned JSON-safe representation.

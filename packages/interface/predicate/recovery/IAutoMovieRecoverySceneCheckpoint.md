# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint

## @evidence contracts/development/common.md#meaningful-documentation

The outcome carries complete accepted geometry and its pixel and angular gates, or reasons and available fit evidence for refusal.

## @evidence contracts/development/design.md#principled-representation

The completion loop tests convergence, seed gauge and every retained point. Growth repeats only when the point or observation population increases. Failure outputs empty geometry even when a fit report exists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Completion owns trial poses, points and measurements. The coordinator owns publication to the accepted scene and keeps the earlier checkpoint when this one refuses.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.accepted

## @evidence contracts/development/common.md#meaningful-documentation

The completion step returns acceptance only after no further valid observations or new points grow the already qualified solution.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.reasons

## @evidence contracts/development/common.md#meaningful-documentation

The completion loop collects observed convergence, gauge and per-point failures in one deduplicated set.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.poses

## @evidence contracts/development/common.md#meaningful-documentation

Active compact pose indices are mapped back to source slots only for a qualified checkpoint.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.landmarks

## @evidence contracts/development/common.md#meaningful-documentation

Every fitted point must pass depth, residual and parallax checks before any of the new points are returned as accepted geometry.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.joint

## @evidence contracts/development/common.md#meaningful-documentation

A completed fit can be reported even when its final geometric qualification refuses.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.proposedLandmarks

## @evidence contracts/development/common.md#meaningful-documentation

The operation records the proposal size used by the last numerical fit.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.proposedObservations

## @evidence contracts/development/common.md#meaningful-documentation

It sums the observations associated with each proposed point using the fit's actual population.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.maximumReprojectionErrorPx

## @evidence contracts/development/common.md#meaningful-documentation

The measure is the maximum over all accepted retained observations after returning from compact indices to source indices.

# src/recovery/IAutoMovieRecoverySceneCheckpoint.ts#IAutoMovieRecoverySceneCheckpoint.minimumPointParallaxDegrees

## @evidence contracts/development/common.md#meaningful-documentation

For each point the largest acute angle comes from its actual retained camera observations. The reported minimum is taken across those points.

# src/recovery/IAutoMovieRecoverySceneGrowth.ts#IAutoMovieRecoverySceneGrowth

## @evidence contracts/development/common.md#meaningful-documentation

The record reports the complete proposed set and the separate amounts of point and measurement growth.

## @evidence contracts/development/design.md#principled-representation

Existing points may acquire new individually qualified observations. New tracks require finite triangulation and qualification over every available registered observation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Growth owns proposed point and observation copies and their counts. Joint qualification and scene commit remain with the enclosing transaction.

# src/recovery/IAutoMovieRecoverySceneGrowth.ts#IAutoMovieRecoverySceneGrowth.landmarks

## @evidence contracts/development/common.md#meaningful-documentation

Growth copies the original accepted population before attempting modifications, and appends only separately qualified tracks and measurements.

# src/recovery/IAutoMovieRecoverySceneGrowth.ts#IAutoMovieRecoverySceneGrowth.addedLandmarks

## @evidence contracts/development/common.md#meaningful-documentation

The counter advances once when triangulation admits a new track.

# src/recovery/IAutoMovieRecoverySceneGrowth.ts#IAutoMovieRecoverySceneGrowth.addedObservations

## @evidence contracts/development/common.md#meaningful-documentation

A newly retained measurement of an existing point adds one. A new point adds its full retained observation count.

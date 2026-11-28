# src/recovery/IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.ts#IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation distinguishes signed first-order normalized incidence from the symmetric mean of two point-to-line distances.

## @evidence contracts/development/design.md#principled-representation

Each correspondence uses its own two epipolar normals. The Sampson denominator is their joint norm, while each symmetric distance uses its own line norm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation owns measured residuals and their ordering. The scorer owns support thresholds and summary statistics.

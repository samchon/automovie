# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy

## @evidence contracts/development/common.md#meaningful-documentation

The policy separates Euclidean pixel thresholds from ray angles, conditional sampling controls, and design-rank diagnostics.

## @evidence contracts/development/design.md#principled-representation

Under the unit-baseline seed gauge, point and camera designs keep explicit rank, target inlier population and pixel requirements throughout registration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The seed policy retains the two-view Sampson and homography thresholds. This policy governs point and camera registration, while the candidate evidence records achieved measurements.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.maximumReprojectionErrorPx

## @evidence contracts/development/common.md#meaningful-documentation

The map applies the limit to each observing chart during seed-point admission and to the final retained observations after refinement.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.minimumPointParallaxDegrees

## @evidence contracts/development/common.md#meaningful-documentation

The triangulator's viewing-ray angle is folded to its acute value, converted to degrees and checked before accepting the point.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.minimumResectionInliers

## @evidence contracts/development/common.md#meaningful-documentation

The map needs this many distinct target candidates before resection, and the winning sample must retain that many inliers.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.minimumResectionInlierFraction

## @evidence contracts/development/common.md#meaningful-documentation

Consensus divides retained inliers by the eligible correspondence count, before final resection acceptance.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.samplingConfidence

## @evidence contracts/development/common.md#meaningful-documentation

The trial bound concerns drawing an all-inlier six-point proposal under the chosen probabilistic model.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.samplingSeed

## @evidence contracts/development/common.md#meaningful-documentation

Proposal order derives from the supplied uint32 seed; admission includes both unsigned endpoints.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.minimumDesignSingularRatio

## @evidence contracts/development/common.md#meaningful-documentation

The direct linear transform checks the next-smallest-to-largest singular value ratio before using its resolved null direction.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.maximumDltNullRatio

## @evidence contracts/development/common.md#meaningful-documentation

The smallest-to-next-smallest ratio determines whether the normalized resection design isolates one projective direction.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.maximumRotationProjectionError

## @evidence contracts/development/common.md#meaningful-documentation

The pose construction checks the scale-normalized discrepancy after projecting the direct-linear block to a proper rotation.

# src/recovery/IAutoMovieRecoveryCameraMapPolicy.ts#IAutoMovieRecoveryCameraMapPolicy.lossScalePx

## @evidence contracts/development/common.md#meaningful-documentation

Resection and joint fit use a robust term over the magnitude of each complete pixel residual.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy

## @evidence contracts/development/common.md#meaningful-documentation

The policy records the detector, matcher, sampling, residual, depth, rank and planar ambiguity operating point.

## @evidence contracts/development/design.md#principled-representation

The detector and appearance matcher propose tentative correspondences. Independent calibrated epipolar, relative pose and homography thresholds determine whether the pair qualifies.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies values and the deterministic seed. Recoverable numerical and feature populations are recorded separately from that policy.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.family

## @evidence contracts/development/common.md#meaningful-documentation

Seed admission requires this exact operation family before feature allocation.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.minimumCornerResponse

## @evidence contracts/development/common.md#meaningful-documentation

The grayscale gradient tensor contributes its determinant divided by trace. A candidate must strictly exceed the policy threshold.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.suppressionRobustness

## @evidence contracts/development/common.md#meaningful-documentation

For each candidate the detector considers neighbours whose response exceeds its own response divided by this factor.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.descriptorDistanceRatio

## @evidence contracts/development/common.md#meaningful-documentation

The matcher squares this threshold for comparison against best and second squared descriptor distances.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.maximumSampsonErrorPx

## @evidence contracts/development/common.md#meaningful-documentation

The fundamental consensus compares finite absolute Sampson residuals to this inclusive limit.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.samplingConfidence

## @evidence contracts/development/common.md#meaningful-documentation

The proposal planner uses its ideal unique-sample support model to determine the conditional draw target.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.samplingSeed

## @evidence contracts/development/common.md#meaningful-documentation

Fundamental and homography searches share the caller's seed and use distinct deterministic proposal domains.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.minimumInliers

## @evidence contracts/development/common.md#meaningful-documentation

The final calibrated support must meet this count after matching and refit.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.minimumInlierFraction

## @evidence contracts/development/common.md#meaningful-documentation

The final calibrated inlier count is divided by the complete tentative population.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.maximumMedianErrorPx

## @evidence contracts/development/common.md#meaningful-documentation

After essential reprojection the pair measures both sides' line distances and compares their median to this gate.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.maximumP90ErrorPx

## @evidence contracts/development/common.md#meaningful-documentation

The same measured inlier population provides the interpolated tail statistic for independent qualification.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.minimumPositiveDepthFraction

## @evidence contracts/development/common.md#meaningful-documentation

The leading positive-depth branch's count is divided by all its tested inliers.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.minimumParallaxRadians

## @evidence contracts/development/common.md#meaningful-documentation

Pose selection measures the median ray angle among finite points in front of both cameras.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.maximumHomographyOverlapFraction

## @evidence contracts/development/common.md#meaningful-documentation

The planar search rounds this fraction of the fixed epipolar inlier population up to a forbidden integer support.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.maximumHomographyTransferPx

## @evidence contracts/development/common.md#meaningful-documentation

Planar scoring uses forward and inverse pixel transfer errors on that fixed population.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.minimumDesignSingularRatio

## @evidence contracts/development/common.md#meaningful-documentation

The same policy floor gates original epipolar, local pose and planar design owners using their relevant singular values.

# src/recovery/IAutoMovieRecoveryCameraPolicy.ts#IAutoMovieRecoveryCameraPolicy.refinementLossScalePx

## @evidence contracts/development/common.md#meaningful-documentation

Each signed Sampson residual enters the fixed-subset optimizer's soft-L1 sum with this scale.

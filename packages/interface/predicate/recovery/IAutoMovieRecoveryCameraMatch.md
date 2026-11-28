# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch

## @evidence contracts/development/common.md#meaningful-documentation

The row distinguishes retained feature indices, original pixel measurements, descriptor comparison and epipolar or competing planar support.

## @evidence contracts/development/design.md#principled-representation

A strict forward descriptor ratio and unambiguous reciprocal nearest identity admit a match. Calibrated epipolar scoring and competing homography scoring then classify the same tentative row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The matcher owns appearance evidence. The estimators add geometric flags and publish pose acceptance separately.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.firstFeatureIndex

## @evidence contracts/development/common.md#meaningful-documentation

The matching loop saves the first feature's array index so support can be tied back to its observation.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.secondFeatureIndex

## @evidence contracts/development/common.md#meaningful-documentation

The matcher requires the second feature's unique reverse nearest result to identify the same first feature.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.firstPx

## @evidence contracts/development/common.md#meaningful-documentation

The estimator copies the first measured coordinate from the match without fitting a new pixel location.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.secondPx

## @evidence contracts/development/common.md#meaningful-documentation

The second coordinate stays in its own image chart for calibrated residual evaluation.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.descriptorDistanceRatio

## @evidence contracts/development/common.md#meaningful-documentation

The matcher compares squared distances using the squared policy threshold and reports the square root of their ratio.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.squaredDescriptorDistance

## @evidence contracts/development/common.md#meaningful-documentation

All 128 normalized descriptor components contribute a squared difference to the reported distance.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.epipolarInlier

## @evidence contracts/development/common.md#meaningful-documentation

The assembler flags indices from the selected consensus. A later essential reclassification can still refuse the pose.

# src/recovery/IAutoMovieRecoveryCameraMatch.ts#IAutoMovieRecoveryCameraMatch.homographyInlier

## @evidence contracts/development/common.md#meaningful-documentation

The planar solver operates on the epipolar inliers and maps its local support indices back to the original match rows.

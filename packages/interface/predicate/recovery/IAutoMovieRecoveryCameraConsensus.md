# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus

## @evidence contracts/development/common.md#meaningful-documentation

The record explains sampling and optimization work, measured epipolar support, positive-depth evidence, the distribution in each image and the competing planar explanation.

## @evidence contracts/development/design.md#principled-representation

Eight-point proposals and fixed-inlier refits select tentative support. Separate design, reprojection, pose-branch and planar gates can still refuse the pair. Unavailable stage measurements use nulls or an empty branch count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Consensus owns measured support and numerical diagnostics. The match records keep the original paired pixels, and the outer estimate exposes a pose only after every gate qualifies.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.trials

## @evidence contracts/development/common.md#meaningful-documentation

The sampler increments the proposal count before testing whether the calibrated design can yield a candidate.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.requiredTrialsAtFinalSupport

## @evidence contracts/development/common.md#meaningful-documentation

Any support change after final re-estimation recomputes the ideal stopping target against the input match population.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.conditionalTrialTargetMet

## @evidence contracts/development/common.md#meaningful-documentation

The result compares the actual proposals with the final conditional target, whose probability describes drawing an all-inlier combination.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.numericalRefusals

## @evidence contracts/development/common.md#meaningful-documentation

Recognized design, calibration or scoring errors advance this counter while the proposal loop continues.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.localRefinements

## @evidence contracts/development/common.md#meaningful-documentation

The solver admits proposals with at least eight supported pairs to local refinement in draw order while capacity remains.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.localRefinementRefusals

## @evidence contracts/development/common.md#meaningful-documentation

The solver counts local nonconvergence and recognized local exceptions. A final re-estimation exception also advances the counter.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.finalReestimations

## @evidence contracts/development/common.md#meaningful-documentation

After the bounded proposal search, the chosen support is refitted, and a revised target can resume the same search.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.finalRefinementConverged

## @evidence contracts/development/common.md#meaningful-documentation

The pair qualifier clears the stabilization flag when essential-space reprojection changes support identities.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.optimizerFits

## @evidence contracts/development/common.md#meaningful-documentation

The estimate retains diagnostics from completed optimizers over fixed subsets, without transferring their intermediate poses.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.finalDesignSingularRatio

## @evidence contracts/development/common.md#meaningful-documentation

The qualifier fits the original design on the final inlier population and records the eighth singular value relative to the leading one.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.inliers

## @evidence contracts/development/common.md#meaningful-documentation

The selected epipolar score supplies indices used both for the count and for flags on the original match rows.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.inlierFraction

## @evidence contracts/development/common.md#meaningful-documentation

All tentative matches remain in the denominator after calibrated scoring.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.medianSymmetricPointLinePx

## @evidence contracts/development/common.md#meaningful-documentation

The pair re-evaluates the final essential model in both original charts and includes finite inlier errors above policy limits in this statistic.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.p90SymmetricPointLinePx

## @evidence contracts/development/common.md#meaningful-documentation

The scorer takes the linear percentile over finite inlier distances before independent median and tail qualification.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.inlierImageHullFractions

## @evidence contracts/development/common.md#meaningful-documentation

Dividing the inlier coordinates by image width and height before forming the hull expresses its area as a chart fraction.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.positiveDepthFraction

## @evidence contracts/development/common.md#meaningful-documentation

The selected branch divides its count positive in both views by the full tested inlier count, independently of ties.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.medianParallaxRadians

## @evidence contracts/development/common.md#meaningful-documentation

Pose selection retains angles only from finite points that are positive in both cameras and takes their median.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.allPositiveDepthCounts

## @evidence contracts/development/common.md#meaningful-documentation

The four branches share the same inlier population, so a tie in their maximum is explicit ambiguity evidence.

# src/recovery/IAutoMovieRecoveryCameraConsensus.ts#IAutoMovieRecoveryCameraConsensus.homography

## @evidence contracts/development/common.md#meaningful-documentation

The planar competitor is fitted on the fixed epipolar inlier subset and flags its supported matches in the pair record.

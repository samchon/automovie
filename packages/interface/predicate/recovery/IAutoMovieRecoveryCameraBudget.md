# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget

## @evidence contracts/development/common.md#meaningful-documentation

The budget states how pixel, feature, matching, proposal and numerical work is measured and bounded.

## @evidence contracts/development/design.md#principled-representation

Separate population and iteration ceilings allow each stage to refuse before traversing excessive input. Seed limits stay independent of scene-wide totals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resident pair checks supplied images and seed controls. Detector, matcher and geometry owners enforce their work ceilings at use.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxPixels

## @evidence contracts/development/common.md#meaningful-documentation

Shared view admission checks both seed raster areas before chart construction.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxCandidates

## @evidence contracts/development/common.md#meaningful-documentation

The extractor refuses before adding another descriptor-window-valid candidate to a full population.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxFeatures

## @evidence contracts/development/common.md#meaningful-documentation

Adaptive spatial selection takes at most this many candidates. Later descriptor failures can reduce the retained feature count.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxPyramidLevels

## @evidence contracts/development/common.md#meaningful-documentation

The extractor observes available levels from the starting image and downsamples only when another level remains permitted.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxDescriptorPairs

## @evidence contracts/development/common.md#meaningful-documentation

The directed matcher preflights source count times target count for a target population of at least two. A smaller target performs no comparisons.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxRansacTrials

## @evidence contracts/development/common.md#meaningful-documentation

The fundamental and planar solvers each count proposals, including numerically refused designs, within this ceiling.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.minimumRansacTrials

## @evidence contracts/development/common.md#meaningful-documentation

The two samplers must cover both this floor and the conditional confidence target to claim completed sampling.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxLocalRefinements

## @evidence contracts/development/common.md#meaningful-documentation

The epipolar search consumes this allowance for eligible supports before comparing the candidates.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxRefinementIterations

## @evidence contracts/development/common.md#meaningful-documentation

Fixed-subset fits apply the ceiling independently. An exhausted fit reports incomplete termination.

# src/recovery/IAutoMovieRecoveryCameraBudget.ts#IAutoMovieRecoveryCameraBudget.maxSingularSweeps

## @evidence contracts/development/common.md#meaningful-documentation

The original and augmented factors receive the declared sweep cap whenever they are decomposed.

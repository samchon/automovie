# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate

## @evidence contracts/development/common.md#meaningful-documentation

The estimate makes geometric qualification, sparse coordinate gauge, retained populations and final diagnostics explicit without erasing incomplete measurements.

## @evidence contracts/development/design.md#principled-representation

The producer begins with null poses and an empty landmark list, then retains seed poses and eligible seed landmarks. It replaces those with the jointly accepted candidate only after final qualification.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record owns detached metadata, fitting points and diagnostic counts. The original image bytes remain with acquisition, and the gauge retains unknown metric scale.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.schema

## @evidence contracts/development/common.md#meaningful-documentation

The producer stamps the exact estimate identifier on every completed status.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.objectId

## @evidence contracts/development/common.md#meaningful-documentation

The map uses the admitted scene identifier and retains it in the detached answer.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.cohort

## @evidence contracts/development/common.md#meaningful-documentation

The value retains the declared observation population even when seed geometry is refused.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.status

## @evidence contracts/development/common.md#meaningful-documentation

An outer partial value may carry any internal qualification. The third completed pose is published only after every final gate passes.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.refusalReasons

## @evidence contracts/development/common.md#meaningful-documentation

The builder records seed refusal or the resection and joint criteria reached by that candidate.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.sources

## @evidence contracts/development/common.md#meaningful-documentation

The seed supplies the first two metadata records; the third source is copied from the resection view in the same array.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.seed

## @evidence contracts/development/common.md#meaningful-documentation

The map shares the normal two-view qualification result as evidence for every later stage.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.policy

## @evidence contracts/development/common.md#meaningful-documentation

The builder saves the exact operating thresholds of the attempted map.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.budget

## @evidence contracts/development/common.md#meaningful-documentation

The builder saves the limits used during that run, independently of the retained counts.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.gauge

## @evidence contracts/development/common.md#meaningful-documentation

The first pose is identity at zero translation. Final admission checks the adjusted second pose's translation norm against one.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.metricScale

## @evidence contracts/development/common.md#meaningful-documentation

The gauge's unit baseline carries no physical length. Rescaling the common reconstruction leaves image reprojection unchanged.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.poses

## @evidence contracts/development/common.md#meaningful-documentation

The producer installs only seed poses before resection and transfers all three only after joint qualification.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.landmarks

## @evidence contracts/development/common.md#meaningful-documentation

Seed-only evidence retains only two seed measurements per fitting point; qualified resection inliers can add third-view measurements to the finalized geometry.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.featureCounts

## @evidence contracts/development/common.md#meaningful-documentation

Features are observed for each admitted view before seed construction.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.descriptorComparisons

## @evidence contracts/development/common.md#meaningful-documentation

The caller supplies measured descriptor work from the six directed match calls.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.intersectionMatches

## @evidence contracts/development/common.md#meaningful-documentation

The linker intersects both directions before creating the observations and components.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.linkedObservations

## @evidence contracts/development/common.md#meaningful-documentation

Only endpoints of admitted appearance links enter its feature graph.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.linkedTracks

## @evidence contracts/development/common.md#meaningful-documentation

The linker counts the components before filtering conflicting tracks.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.conflictingTracks

## @evidence contracts/development/common.md#meaningful-documentation

A transitive component can contain multiple features in one image; the linker withholds those observations from fitting.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.untriangulatedTracks

## @evidence contracts/development/common.md#meaningful-documentation

The builder counts a track without both seed observations and a direct accepted epipolar match, or all remaining tracks after seed refusal.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.refusedSeedPoints

## @evidence contracts/development/common.md#meaningful-documentation

Unresolved, nonpositive, low-parallax and excessive-residual seed points contribute at most one count per track.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.unresolvedSeedPoints

## @evidence contracts/development/common.md#meaningful-documentation

A null triangulation result contributes to both unresolved and total refused counts.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.nonpositiveSeedPoints

## @evidence contracts/development/common.md#meaningful-documentation

The positive-depth requirement is applied after resolving a finite triangulated point, independently of parallax and error.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.lowParallaxSeedPoints

## @evidence contracts/development/common.md#meaningful-documentation

The geometry gate compares the folded ray angle in degrees with the minimum declared by the map policy.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.reprojectionRefusedSeedPoints

## @evidence contracts/development/common.md#meaningful-documentation

The point gate uses the larger of the two seed view reprojection distances.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.resection

## @evidence contracts/development/common.md#meaningful-documentation

Resection metrics remain inspectable after a target pose refusal; the slot is null when there are too few usable targets.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.joint

## @evidence contracts/development/common.md#meaningful-documentation

The result retains the joint report before assessing convergence and final reprojection, depth and parallax.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.maximumReprojectionErrorPx

## @evidence contracts/development/common.md#meaningful-documentation

After a joint result, the map compares projected coordinates against every retained observation. This measurement can explain a joint refusal.

# src/recovery/IAutoMovieRecoveryCameraMapEstimate.ts#IAutoMovieRecoveryCameraMapEstimate.minimumPointParallaxDegrees

## @evidence contracts/development/common.md#meaningful-documentation

After a joint result, the map derives this diagnostic from the first camera and the second camera's fitted center.

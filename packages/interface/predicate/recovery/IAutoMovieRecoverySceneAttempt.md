# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies the target, input revision, qualification outcome and available work-stage reports.

## @evidence contracts/development/design.md#principled-representation

Resection, proposal growth, joint fitting and final qualification have distinct outcomes. A proposal count can describe a later pass than the last completed report, so the joint report keeps its own population.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An attempt holds diagnostics and counts. The scene coordinator publishes qualified geometry at commit and retains the attempt even when it keeps the previous scene.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.viewIndex

## @evidence contracts/development/common.md#meaningful-documentation

The coordinator looks up the target using its fixed source index and records that same index on the attempt.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.revision

## @evidence contracts/development/common.md#meaningful-documentation

The attempt is initialized before any transaction can increment the accepted revision.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.candidates

## @evidence contracts/development/common.md#meaningful-documentation

Every proposed resection correspondence joins an existing 3D landmark with a target feature from its linked track.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.outcome

## @evidence contracts/development/common.md#meaningful-documentation

The coordinator starts with a resection refusal state, records joint refusal after numerical resection success, and advances to acceptance only after commit. A charged budget failure marks exhaustion.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.reasons

## @evidence contracts/development/common.md#meaningful-documentation

Resection reports, joint qualification or a recognized stage exception contribute the reasons reached during that attempt.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.resection

## @evidence contracts/development/common.md#meaningful-documentation

The resection counters and stability are transferred before the pose is tested for a usable result.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.joint

## @evidence contracts/development/common.md#meaningful-documentation

The proposal observer retains a completed report across a later pass that can fail to finish. It retains no failed geometry.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.proposedLandmarks

## @evidence contracts/development/common.md#meaningful-documentation

The checkpoint announces a count before paying for a joint fit, so the last proposed point count can survive without a matching completed fit.

# src/recovery/IAutoMovieRecoverySceneAttempt.ts#IAutoMovieRecoverySceneAttempt.proposedObservations

## @evidence contracts/development/common.md#meaningful-documentation

The reported count includes every retained measurement across that proposal's points.

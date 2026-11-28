# src/recovery/IAutoMovieRecoverySceneCheckpointTrace.ts#IAutoMovieRecoverySceneCheckpointTrace

## @evidence contracts/development/common.md#meaningful-documentation

The diagnostic records phase, closure pass, source-to-compact view mapping and the exact point population for that numerical call.

## @evidence contracts/development/design.md#principled-representation

Each trace clones the compact active state at the joint boundary. Before-fit traces carry no fit report. After-fit traces carry the numerical report, before scene acceptance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller owns the delivered clone. The checkpoint retains its working pose and point arrays and can continue or refuse independently of observer inspection.

# src/recovery/IAutoMovieRecoverySceneCheckpointTrace.ts#IAutoMovieRecoverySceneCheckpointTrace.phase

## @evidence contracts/development/common.md#meaningful-documentation

The optional callback is invoked once before and once after a completed fit, with separate cloned states.

# src/recovery/IAutoMovieRecoverySceneCheckpointTrace.ts#IAutoMovieRecoverySceneCheckpointTrace.pass

## @evidence contracts/development/common.md#meaningful-documentation

Repeated closure advances the pass only after point or observation counts increase.

# src/recovery/IAutoMovieRecoverySceneCheckpointTrace.ts#IAutoMovieRecoverySceneCheckpointTrace.activeViews

## @evidence contracts/development/common.md#meaningful-documentation

The checkpoint forms compact storage from non-null source poses and preserves the mapping for interpretation.

# src/recovery/IAutoMovieRecoverySceneCheckpointTrace.ts#IAutoMovieRecoverySceneCheckpointTrace.poses

## @evidence contracts/development/common.md#meaningful-documentation

The before phase clones the active input poses. The after phase clones the fitter's returned poses.

# src/recovery/IAutoMovieRecoverySceneCheckpointTrace.ts#IAutoMovieRecoverySceneCheckpointTrace.landmarks

## @evidence contracts/development/common.md#meaningful-documentation

The trace includes the exact compact population passed to or returned by the fit before final point filtering.

# src/recovery/IAutoMovieRecoverySceneCheckpointTrace.ts#IAutoMovieRecoverySceneCheckpointTrace.joint

## @evidence contracts/development/common.md#meaningful-documentation

The trace owner attaches the report after the fitter returns, before checking if the detached state can commit.

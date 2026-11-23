# src/cinematics/IAutoMovieCompileCameraClearanceReports.ts#IAutoMovieCompileCameraClearanceReports.IProps

## @evidence contracts/development/design.md#principled-representation

Scene placement is world metres and motion time is shot-local seconds. The engine checks camera membership, runtime revision/rate, models and clock admission; the type alone cannot establish conservative bounds or representable arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compilePerformShotCameras supplies the shared scene, finalized actor/object motions and model snapshot once for hero and coverage checks; camera, clip and collector identities reuse their canonical contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent runtime is representable because a shot without envelopes needs none; envelope-bearing takes report its absence instead of inventing a clock or geometry revision.

## @evidence contracts/development/common.md#meaningful-documentation

States take selection, shared timebase, model-bound scope, refusal effects and collector ownership.

# src/cinematics/IAutoMovieCompileCameraClearanceReports.ts#IAutoMovieCompileCameraClearanceReports

## @evidence contracts/development/design.md#principled-representation

IProps combines one shot snapshot with world geometry, shot-local motion and a collector; numeric/revision admission stays in the engine.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The namespace owns clearance-compilation inputs shared with compilePerformShotCameras, reusing canonical scene and runtime records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Conditional runtime absence is documented in IProps instead of concealed by a fabricated clearance context.

## @evidence contracts/development/common.md#meaningful-documentation

IProps defines take selection, units, borrowed inputs and refusal effects for clearance compilation.

# src/cinematics/IAutoMovieCompileCameraClearanceReports.ts#IAutoMovieCompileCameraClearanceReports.IProps

## @evidence contracts/development/design.md#principled-representation

Scene placement is world metres and motion time is shot-local seconds. The engine checks camera membership, runtime revision/rate, models and clock admission; the type alone cannot establish conservative bounds or representable arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compilePerformShotCameras supplies the shared scene, finalized actor/object motions and model snapshot once for hero and coverage checks; camera, clip and collector identities reuse their canonical contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent runtime is representable because a shot without envelopes needs none; envelope-bearing takes report its absence instead of inventing a clock or geometry revision.

## @evidence contracts/development/common.md#meaningful-documentation

States take selection, shared timebase, model-bound scope, refusal effects and collector ownership.

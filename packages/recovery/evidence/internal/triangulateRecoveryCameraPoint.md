# src/index.ts#triangulateRecoveryCameraPoint

## @evidence contracts/development/implementation.md#principled-implementation

Two cross-product projection equations per camera define the original homogeneous DLT design. Its last right singular direction yields a finite point only when rank and division resolve; camera depths, actual calibrated pixel reprojection and ray angle are then measured separately.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pair-level helper keeps the first-camera gauge and geometric diagnostics together; the caller aggregates four-pose cheirality and decides the minimum admissible parallax.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No positive-depth clamp, guessed finite point, regularization, metric-scale claim or source mesh supplies a missing triangulation. Invalid or overflowing matrix actions and SVD nonconvergence propagate instead of passing as geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States row-major world-to-second convention, first-camera gauge, null reasons, signed-depth handling, pixel units and sparse fitting-only status.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded 4-by-4 original-design SVD and fixed-size projections cost O(S) time and constant temporary memory per pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The calibrated rays serve both DLT and parallax; the single reconstructed point serves depths and both independent pixel reprojections.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only an owned three-coordinate point and scalar diagnostics escape; call-local factors and rays expire, and no image, process or cache remains.

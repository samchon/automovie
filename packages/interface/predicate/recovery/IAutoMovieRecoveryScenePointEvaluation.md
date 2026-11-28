# src/recovery/IAutoMovieRecoveryScenePointEvaluation.ts#IAutoMovieRecoveryScenePointEvaluation

## @evidence contracts/development/common.md#meaningful-documentation

The result reports pixel error, positive depth, and the actual supporting camera pair and angle. Read these measurements alongside the admission flag and reasons.

## @evidence contracts/development/design.md#principled-representation

Each retained observation is checked for a registered camera, projectable positive depth, and its Euclidean pixel residual. The strongest acute angle is selected over the available actual world-space rays.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The evaluator records one point's qualification. The triangulation or transaction owner decides whether to retain a point after reading it.

# src/recovery/IAutoMovieRecoveryScenePointEvaluation.ts#IAutoMovieRecoveryScenePointEvaluation.accepted

## @evidence contracts/development/common.md#meaningful-documentation

The evaluator requires at least two distinct measurements and rejects depth, unresolved ray, reprojection and weak-parallax failures.

# src/recovery/IAutoMovieRecoveryScenePointEvaluation.ts#IAutoMovieRecoveryScenePointEvaluation.reasons

## @evidence contracts/development/common.md#meaningful-documentation

A set consolidates repeated instances of failed gates across observations.

# src/recovery/IAutoMovieRecoveryScenePointEvaluation.ts#IAutoMovieRecoveryScenePointEvaluation.maximumReprojectionPx

## @evidence contracts/development/common.md#meaningful-documentation

The maximum is accumulated from calibrated image differences. Missing views or nonpositive depth clear this measurement for the result.

# src/recovery/IAutoMovieRecoveryScenePointEvaluation.ts#IAutoMovieRecoveryScenePointEvaluation.minimumDepth

## @evidence contracts/development/common.md#meaningful-documentation

The minimum only uses resolved positive projections. It can remain available even when another retained observation refuses.

# src/recovery/IAutoMovieRecoveryScenePointEvaluation.ts#IAutoMovieRecoveryScenePointEvaluation.supportingViews

## @evidence contracts/development/common.md#meaningful-documentation

A selected pair carries original source indices from the ray records. Equal angles keep the first pair visited in observation order.

# src/recovery/IAutoMovieRecoveryScenePointEvaluation.ts#IAutoMovieRecoveryScenePointEvaluation.acuteParallaxDegrees

## @evidence contracts/development/common.md#meaningful-documentation

The angle uses the cross magnitude and absolute dot product of normalized rays, so it is folded to an acute-or-right diagnostic.

# src/recovery/IAutoMovieRecoveryScenePointEvaluationOperation.ts#IAutoMovieRecoveryScenePointEvaluationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation states which observations and chart slots may support a point, and how the available per-point diagnostics and residual observer are populated.

## @evidence contracts/development/design.md#principled-representation

Pointwise evaluation combines every available calibrated residual with the actual ray pair yielding the largest acute angle. Later registered views may provide both supporting rays.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation evaluates fixed inputs. The joint and growth owners decide whether the point and its measurement population may join a checkpoint.

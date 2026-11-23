# src/cinematics/IAutoMovieCameraClearanceEvaluation.ts#IAutoMovieCameraClearanceEvaluation

## @evidence contracts/development/design.md#principled-representation

Revision identities, a camera-local sphere envelope and world-space samples bind one shot-local second clock; evaluateCameraClearance checks positive finite rate, nonnegative duration and a complete ordered sample grid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The clearance compiler supplies the same explicit plan the pure evaluator reads, without exposing scene evaluation or renderer objects.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Revision mismatch returns stale; interpolation between samples still requires linear translation, constant scale, bounded obstacle motion and the documented rotation approximation.

## @evidence contracts/development/common.md#meaningful-documentation

States revision comparison, sample clock, geometry frames and caller-owned intersample premises.

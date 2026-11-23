# src/authoring/IAutoMovieStageCamera.ts#IAutoMovieStageCamera

## @evidence contracts/development/design.md#principled-representation `stageScene` requires finite position, field of view in `(0, 180)` degrees, finite `0 < near < far`, valid depth precision and clearance, and a placed-node or finite-point look target at least `1e-9` m away. lookRotation builds the level-horizon basis rather than a shortest-arc aim; representable target subtraction and normalization remain premises because lowering has no separate rotation-result gate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record states the lens, clip range, precision demand and opening aim in the stage's own vocabulary; the resolved rotation and lowered envelope belong to the scene camera, so the author never writes a quaternion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A camera aimed at its own position is refused rather than given an arbitrary rotation, and a node `lookAt` resolves to the target's placement point with no per-kind height offset.

## @evidence contracts/development/common.md#meaningful-documentation

States the id's role, the world frame and units, how `lookAt` resolves and what may be named, the strict field-of-view and clip bounds, and what an omitted clearance means.

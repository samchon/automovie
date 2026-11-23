# src/cinematics/IAutoMoviePoseKeypoint.ts#IAutoMoviePoseKeypoint

## @evidence contracts/development/design.md#principled-representation `resolvePoseKeypoints` resolves the pose by forward kinematics, lifts each bone by the staged node's TRS, projects it with `projectToNdc` through the camera's vertical field of view, the render aspect and the delivery crop, then maps NDC to the top-left frame by `x = (ndcX + 1) / 2` and `y = (1 - ndcY) / 2`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record carries only the bone, two normalized coordinates and one visibility flag, so pixel scaling and confidence policy stay with the host that knows its raster.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Off-frame points are not snapped to edges, missing resolved bones are not invented, and zero-depth nonfinite projection is exposed rather than replaced. The membership flag makes no occlusion or observed-image claim.

## @evidence contracts/development/common.md#meaningful-documentation

States delivered-frame coordinates, default-FK compatibility premises, omission, unclamped and zero-depth results, and the depth/rectangle test without an occlusion guarantee.

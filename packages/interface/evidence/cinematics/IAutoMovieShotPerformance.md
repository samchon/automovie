# src/cinematics/IAutoMovieShotPerformance.ts#IAutoMovieShotPerformance

## @evidence contracts/development/design.md#principled-representation `realizeShotContract`, `reviewVisualRead`, `resolveBeatEnd`, `measureAutoMovieGeometry` and the pose-keypoint plan all sample the motion at `max(0, t - startOffset)`, and `validateShotArtifact` requires a unique node that resolves in the scene, an offset within `[0, duration]`, and a non-blank motion id that resolves when the caller supplies the motion registry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The performance references the node and motion by id and adds one offset, so the motion stays a reusable clip and the shot only says when it starts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every consumer applies the same clamp at zero instead of extrapolating before the start, and a second performance for one node is refused rather than merged.

## @evidence contracts/development/common.md#meaningful-documentation

States how the offset maps shot time to motion time, what the node shows before it, what a null motion means, the per-node uniqueness, and the offset's range.

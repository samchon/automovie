# src/drawing/IAutoMovieDrawingFrame.ts#IAutoMovieDrawingFrame

## @evidence contracts/development/design.md#principled-representation `autoMovieDrawingFrame` checks finite vector components, direction/up lengths above 1e-9, positive finite scale and optional finite nonnegative depth bands. It normalizes -direction, normalizes up cross normal and derives normal cross right, rejecting raw cross length at or below 1e-9; this parallelism threshold depends on up magnitude. Usable finite cross-product intermediates remain a premise, and the published drawing rounds each axis component to six decimals after projecting with the unrounded frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Origin plus three unit vectors is the complete affine frame, and the cut plane reuses the same origin and normal, so no separate plane record is needed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The mirror for a reflected ceiling plan is the single negation of `right`, stated as making the basis left-handed, rather than a flip applied later in a serializer.

## @evidence contracts/development/common.md#meaningful-documentation

States how each axis is derived, the reflected handedness, that the origin is both page origin and cut-plane point, and the rounding precision.

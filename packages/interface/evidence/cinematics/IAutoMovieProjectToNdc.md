# src/cinematics/IAutoMovieProjectToNdc.ts#IAutoMovieProjectToNdc

## @evidence contracts/development/design.md#principled-representation

IResult keeps dimensionless delivered NDC separate from signed metre depth, without claiming every result is finite.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All projection consumers share the same three-number result while deciding their own near/far and frame inclusion policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Out-of-frame and behind-lens values remain representable instead of being coerced into visible coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

IResult describes crop remapping, axis direction, non-finite values and caller ownership.

# src/cinematics/IAutoMovieProjectToNdc.ts#IAutoMovieProjectToNdc.IResult

## @evidence contracts/development/design.md#principled-representation

NDC components are dimensionless and depth is signed camera-forward metres. A finite world point alone cannot guarantee finite projection; camera rotation, positive lens/aspect and nonzero depth remain producer premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectToNdc returns only the two projected coordinates and depth used by film grammar, framing and keypoint consumers; visibility policy is not duplicated here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coordinates outside the frame or behind the lens remain observable instead of being clamped to valid-looking values; no pixel or occlusion result is implied.

## @evidence contracts/development/common.md#meaningful-documentation

States crop remapping, axes, signed depth, zero-depth behavior, caller-owned mutability and visibility limits.

# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumBox.ts#IAutoMovieIntersectsPerspectiveFrustumBox

## @evidence contracts/development/design.md#principled-representation

World-axis box bounds and camera-local lens depths describe two convex volumes; clipping edges of both volumes handles either containment direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Plain geometry and crop facts suffice without a renderer camera or scene handle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite ordered bounds, valid lens and representable arithmetic are caller premises; the boolean is not a pixel-visibility or certified-rounding result.

## @evidence contracts/development/common.md#meaningful-documentation

Members state world metres, lens tangent/aspect units, inclusive contact and crop admission.

# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumBox.ts#IAutoMovieIntersectsPerspectiveFrustumBox.IProps

## @evidence contracts/development/design.md#principled-representation

A shared perspective lens and camera pose meet finite ordered world-axis box corners in metres; zero-width axes and touching are supported.

## @evidence contracts/development/design.md#minimal-and-owned-surface

intersectsPerspectiveFrustumBox consumes the existing lens, camera and vector contracts without a native rendering object.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite geometry, valid lens and representable intermediates are caller premises; crop admission may throw and intersection does not certify visible pixels.

## @evidence contracts/development/common.md#meaningful-documentation

States world metres, camera orientation, inclusive contact and crop failure.

# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumBox.ts#IAutoMovieIntersectsPerspectiveFrustumBox.IProps

## @evidence contracts/development/design.md#principled-representation

A shared perspective lens and camera pose meet finite ordered world-axis box corners in metres; zero-width axes and touching are supported.

## @evidence contracts/development/design.md#minimal-and-owned-surface

intersectsPerspectiveFrustumBox consumes the existing lens, camera and vector contracts without a native rendering object.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite geometry, valid lens and representable intermediates are caller premises; crop admission may throw and intersection does not certify visible pixels.

## @evidence contracts/development/common.md#meaningful-documentation

States world metres, camera orientation, inclusive contact and crop failure.

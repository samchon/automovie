# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumSphere.ts#IAutoMovieIntersectsPerspectiveFrustumSphere.IProps

## @evidence contracts/development/design.md#principled-representation

A world-metre centre and radius pair with the common camera/lens contract; a zero radius is a point and negative or nonfinite radius returns false.

## @evidence contracts/development/design.md#minimal-and-owned-surface

intersectsPerspectiveFrustumSphere accepts plain geometric facts used by visibility accounting and formation culling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A retained sphere can still miss a frustum corner; early radius/depth rejection can bypass malformed-crop admission, so true is only conservative retention.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world units, conservative meaning, numeric premises and conditional crop failure.

# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumSphere.ts#IAutoMovieIntersectsPerspectiveFrustumSphere

## @evidence contracts/development/design.md#principled-representation

Compare the world sphere against normalized camera-frustum planes; retained edge/corner false positives bound culling rather than prove intersection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A centre, radius and plain camera/lens facts describe the test without native camera or geometry objects.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid radius returns false, while other finite/unit lens premises are caller-owned; boundary rounding and pixel visibility are not certified.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish world metres, dimensionless lens values and the early-return-dependent crop failure path.

# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumSphere.ts#IAutoMovieIntersectsPerspectiveFrustumSphere.IProps

## @evidence contracts/development/design.md#principled-representation

A world-metre centre and radius pair with the common camera/lens contract; a zero radius is a point and negative or nonfinite radius returns false.

## @evidence contracts/development/design.md#minimal-and-owned-surface

intersectsPerspectiveFrustumSphere accepts plain geometric facts used by visibility accounting and formation culling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A retained sphere can still miss a frustum corner; early radius/depth rejection can bypass malformed-crop admission, so true is only conservative retention.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world units, conservative meaning, numeric premises and conditional crop failure.

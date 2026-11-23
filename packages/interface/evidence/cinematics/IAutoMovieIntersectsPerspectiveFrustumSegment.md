# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumSegment.ts#IAutoMovieIntersectsPerspectiveFrustumSegment

## @evidence contracts/development/design.md#principled-representation

Two world endpoints define the entire segment; algebraic plane crossings can find an interior intersection even when both endpoints lie outside.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Plain points, camera pose, lens and crop facts require no renderer camera handle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite coordinates, valid lens and representable arithmetic remain caller premises; chosen point samples and certified boundary-rounding claims are excluded.

## @evidence contracts/development/common.md#meaningful-documentation

Members specify world metres, camera depth, dimensionless lens values and crop defaults/refusal.

# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumSegment.ts#IAutoMovieIntersectsPerspectiveFrustumSegment.IProps

## @evidence contracts/development/design.md#principled-representation

Two world-metre endpoints and the shared camera/lens contract define a complete unoriented segment, including a coincident-endpoint point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

intersectsPerspectiveFrustumSegment reads only endpoints, pose and the common lens/crop fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Endpoint sampling cannot replace segment clipping; finite coordinates and valid lens arithmetic remain caller premises and crop errors propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Documents endpoint order, units, inclusive clipping and caller admission.

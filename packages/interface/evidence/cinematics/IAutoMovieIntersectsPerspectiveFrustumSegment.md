# src/cinematics/IAutoMovieIntersectsPerspectiveFrustumSegment.ts#IAutoMovieIntersectsPerspectiveFrustumSegment.IProps

## @evidence contracts/development/design.md#principled-representation

Two world-metre endpoints and the shared camera/lens contract define a complete unoriented segment, including a coincident-endpoint point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

intersectsPerspectiveFrustumSegment reads only endpoints, pose and the common lens/crop fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Endpoint sampling cannot replace segment clipping; finite coordinates and valid lens arithmetic remain caller premises and crop errors propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Documents endpoint order, units, inclusive clipping and caller admission.

# src/geometry/IAutoMovieSelectTriangleRegion.ts#IAutoMovieSelectTriangleRegion.IProps

## @evidence contracts/development/design.md#principled-representation

Indices and boundary entries are nonnegative integer vertex identities with no coordinate frame or length unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

selectAutoMovieTriangleRegion floods across nonboundary edges and returns original triangle ordinals in ascending order.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The selector checks triangle layout, distinct corners, manifold winding and a unique boundary of at least three vertices; absent edges, nonseparating loops and exterior free edges refuse.

## @evidence contracts/development/common.md#meaningful-documentation

Connectivity and an oriented separating boundary for triangle-patch selection. Indices and boundary entries are nonnegative integer vertex identities with no coordinate frame or length unit.

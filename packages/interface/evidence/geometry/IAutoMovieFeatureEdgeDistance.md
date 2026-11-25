# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IProps

## @evidence contracts/development/design.md#principled-representation

The measured edges, a triangle index and an object-space point in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The triangle selects the list the shader reads for a fragment of that triangle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point reuses `IAutoMovieVector3`.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and frame.

# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IResult

## @evidence contracts/development/design.md#principled-representation

Two distances in metres capped at the reach, so a tessellation that lists fewer distant edges reports the same value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The edge layer reads `convex`, the grime layer `concave`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The cap is stated rather than signalled by a sentinel.

## @evidence contracts/development/common.md#meaningful-documentation

States units, the cap and the empty-list value.

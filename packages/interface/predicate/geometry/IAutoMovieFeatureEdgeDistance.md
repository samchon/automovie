# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IProps

## @evidence contracts/development/common.md#meaningful-documentation

A query point on one source triangle with the feature edge lists measured in the same object-space metre frame.

## @evidence contracts/development/design.md#principled-representation

The CPU reference selects the triangle's precomputed edge list and computes point-to-segment distances using that frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The query reuses a measured edge receipt and source ordinal. Its point is supplied by the caller.

# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IProps.edges

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed feature edge receipt for the mesh carrying the queried triangle. It supplies the stored reach and referenced endpoints.

# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IProps.triangle

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based source triangle ordinal in the measured list array. An ordinal without a list throws.

# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IProps.point

## @evidence contracts/development/common.md#meaningful-documentation

Finite point on the selected triangle in object-space metres. For a skinned mesh, use the measured bind pose coordinates.

# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Capped distances to the nearest listed convex and concave segments in object-space metres.

## @evidence contracts/development/design.md#principled-representation

The measurement minimizes point-to-segment distance independently per sign over the selected list and starts both accumulators at the receipt's reach.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two scalar distances serve the CPU and shader reference. Segment identity and discarded candidates stay with the edge receipt.

# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IResult.convex

## @evidence contracts/development/common.md#meaningful-documentation

Smallest listed distance to a convex segment, capped at measured reach. A list with no nearer convex segment yields reach.

# src/geometry/IAutoMovieFeatureEdgeDistance.ts#IAutoMovieFeatureEdgeDistance.IResult.concave

## @evidence contracts/development/common.md#meaningful-documentation

Smallest listed distance to a concave segment, capped at measured reach. A list with no nearer concave segment yields reach.

# src/geometry/IAutoMovieSubdivisionRingEigenbasis.ts#IAutoMovieSubdivisionRingEigenbasis.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result gives a spatial limit point and two tangent directions with implementation-dependent scale and sign. It identifies the fixed numerical iteration and the separate normal check.

## @evidence contracts/development/design.md#principled-representation

The owner builds the affine step matrix from basis ring refinements, advances the limit mask and re-orthogonalizes a zero-sum tangent pair for 512 steps. Limit evaluation crosses the resulting spatial tangent vectors and normalizes the oriented normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result returns only evaluated spatial vectors. Internal matrix entries, coefficient masks and iteration history do not escape.

# src/geometry/IAutoMovieSubdivisionRingEigenbasis.ts#IAutoMovieSubdivisionRingEigenbasis.IResult.limit

## @evidence contracts/development/common.md#meaningful-documentation

The new XYZ point applies the dominant affine limit mask in the ring's local frame.

# src/geometry/IAutoMovieSubdivisionRingEigenbasis.ts#IAutoMovieSubdivisionRingEigenbasis.IResult.tangents

## @evidence contracts/development/common.md#meaningful-documentation

The two new vectors apply zero-sum masks to the ring positions. Their cross product is interpreted and normalized by the ring consumer.

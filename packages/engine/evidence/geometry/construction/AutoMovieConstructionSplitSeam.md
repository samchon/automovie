# src/geometry/construction/AutoMovieConstructionSplitSeam.ts#AutoMovieConstructionSplitSeam.create

## @evidence contracts/development/implementation.md#principled-implementation

Plane from the chord and the end normal, end tangents from the host's tangent planes, then the clamped spline and its arclength.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass: plane, knots, tangents, solve, lengths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a collapsed chord, an end normal along the chord, a knot outside the chord's span or on its neighbour, and an end whose tangent plane holds no direction of the seam plane.

## @evidence contracts/development/common.md#meaningful-documentation

States its refusals in its result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in knots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The two end jets serve both the ends and their tangents.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned seam retains its arrays.

# src/geometry/construction/AutoMovieConstructionSplitSeam.ts#AutoMovieConstructionSplitSeam.straight

## @evidence contracts/development/implementation.md#principled-implementation

The chord and its plane are the ones `create` builds its curve in, so a straight and a curved seam are ruled alike.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Ends, plane, then a linear reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses coincident forks and an end normal along the chord, as `create` does.

## @evidence contracts/development/common.md#meaningful-documentation

States its plane and its refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time per reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The two end jets serve both ends and the plane.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains two ends and one normal.

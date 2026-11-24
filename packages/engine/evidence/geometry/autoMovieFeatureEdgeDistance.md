# src/geometry/autoMovieFeatureEdgeDistance.ts#autoMovieFeatureEdgeDistance

## @evidence contracts/development/common.md#meaningful-documentation

States the capped result, why it is exact below the reach and the throw.

## @evidence contracts/development/implementation.md#principled-implementation

The minimum point-to-segment distance over the triangle's list, capped at the reach; any edge nearer than the reach to a point of the triangle is within the reach of the triangle and therefore listed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mirrors the shader's loop so tests compare the two.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cap is the stated contract, not a tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most 16 segment distances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

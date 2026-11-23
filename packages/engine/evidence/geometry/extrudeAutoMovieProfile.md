# src/geometry/extrudeAutoMovieProfile.ts#extrudeAutoMovieProfile

## @evidence contracts/development/implementation.md#principled-implementation

Andrew's monotone chain through `convexHull2D` both orders the profile counter-clockwise and proves convexity, since a strictly convex polygon equals its hull; a counter-clockwise convex polygon fans from any corner into non-overlapping triangles, so the caps and side quads close a 2-manifold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, hull ordering and index emission live here, while normal computation is delegated to `meshOf` shared with the revolver and sweep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A profile that is not its own hull is refused rather than silently replaced by its hull, which would change the author's shape without saying so.

## @evidence contracts/development/common.md#meaningful-documentation

States the extent along Z, every refusal, the corner reordering, units and ownership, the normal and UV result with the reason for no UVs, and the operation to use instead for a finish.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n log n) for the n-corner hull, then linear emission of 2n vertices and 4n - 4 triangles.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one mesh from its own profile; a caller placing the same prism repeatedly can keep the returned mesh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new position, index and normal arrays sized by the corner count; the hull and its lifted points are released on return.

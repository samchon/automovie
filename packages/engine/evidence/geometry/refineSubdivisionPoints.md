# src/geometry/refineSubdivisionPoints.ts#refineSubdivisionPoints

## @evidence contracts/development/implementation.md#principled-implementation

The face, edge and vertex rules of Catmull and Clark (1978) with the boundary, crease and fractional-sharpness rules of DeRose, Kass and Truong (1998), computed face points first because the edge and vertex rules read them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Only point placement lives here; connectivity is rebuilt by `refineSubdivisionLevel`, and the limit evaluation reuses these points as the one-ring of the next level without building it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every vertex and edge takes the rule its sharpness selects; there is no valence or position special case.

## @evidence contracts/development/common.md#meaningful-documentation

States the output order, each rule with its weights, and the role of the returned masks.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in corners, edges and vertices: each face point reads its corners once, each edge point four points, and each vertex point its fan once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The vertex masks are returned so face-varying UVs reuse them instead of reclassifying each vertex.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one packed array of `3 (V + E + F)` numbers and one mask per vertex; nothing else survives the call.

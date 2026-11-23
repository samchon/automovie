# src/math/tetrahedralizeAutoMovieDelaunay.ts#tetrahedralizeAutoMovieDelaunay

## @evidence contracts/development/implementation.md#principled-implementation

Each joggled point removes the tetrahedra whose circumsphere strictly contains it and fans the cavity's boundary faces to it; the enclosing tetrahedron's corners are dropped at the end. The joggle is Qhull's, the default multiple of the round-off, drawn per coordinate from the point's index so the mesh is the same every time.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Enclose, insert, drop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A point on a circumsphere is left outside it by the strict test, so cospherical points resolve the same way every time.

## @evidence contracts/development/implementation.md#efficient-algorithms

Quadratic in the points at worst: each insertion scans the current tetrahedra.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the points.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the method, the order, the joggle with its source and the orientation.

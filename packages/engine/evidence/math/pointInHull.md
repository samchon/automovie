# src/math/pointInHull.ts#pointInHull

## @evidence contracts/development/implementation.md#principled-implementation

A counter-clockwise convex hull is the intersection of inward XZ half-planes; an absolute square-metre determinant tolerance admits boundaries, and fewer than three vertices enclose no area.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One containment predicate serves support margins and hull distance while convexHull2D owns point selection and winding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same determinant tolerance applies to every edge, independent of fixtures or query identity.

## @evidence contracts/development/common.md#meaningful-documentation

States convex winding prerequisite, inclusive boundary, horizontal coordinates, tolerance units and degenerate false result.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most H edge determinants are evaluated with early outside return, using constant storage and no triangulation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each edge is tested once for the current point; no membership cache outlives mutable hull coordinates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Loop and determinant scalars are the only live state; no hull copy, query history or native resource is acquired.

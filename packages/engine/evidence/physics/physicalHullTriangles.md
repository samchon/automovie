# src/physics/physicalHullTriangles.ts#physicalHullTriangles

## @evidence contracts/development/common.md#meaningful-documentation

States the construction, what the tolerance does to coplanar points, the winding and the empty result.

## @evidence contracts/development/implementation.md#principled-implementation

Quickhull (Barber, Dobkin and Huhdanpaa 1996, The Quickhull Algorithm for Convex Hulls, ACM TOMS 22(4)): a point strictly in front of a face lies outside the hull, the faces it sees form one connected region, and the fan from the point to that region's boundary is the hull of the old hull and the point. A horizon edge cannot be collinear with the point, since the point would then lie in the plane of the visible face beside it, so no fan triangle is flat.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the triangle search; `physicalHullFaces` owns the faces, their order and their loops.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

One tolerance, the caller's, decides every visibility; a broken horizon throws instead of returning a partial hull.

## @evidence contracts/development/implementation.md#efficient-algorithms

Expected O(n log n) in the point count for points in general position: each point is filed against the triangles of the region its predecessor removed. The first tetrahedron costs three linear scans.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One search per call; `physicalHullFaces` remembers its result per points array.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Triangles, neighbour links and filed points are call-owned and die with the call; only the index triples return.

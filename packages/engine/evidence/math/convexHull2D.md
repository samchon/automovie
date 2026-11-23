# src/math/convexHull2D.ts#convexHull2D

## @evidence contracts/development/implementation.md#principled-implementation

Andrew's monotone chain sorts distinct XZ points, removes non-left turns and joins both chains; finite ordinary-range coordinates are the caller premise, and collinear points reduce to extremes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Support, toppling and convex-profile admission share this hull owner; deduplication retains the first source object at each planar coordinate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only identical XZ coordinates and collinear interior chain points are removed, independent of fixtures or requested hull size.

## @evidence contracts/development/common.md#meaningful-documentation

States ignored height, counter-clockwise output, deterministic construction and the empty/singleton/collinear degeneracies.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N points, deduplication is linear, sorting is O(N log N), and each point enters and leaves each stack once, using O(N) storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One deduplicated sort supplies both chains; mutable input populations have no shared cached hull.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Maps and chains are released after construction; output owns its order while retaining references to caller point records.

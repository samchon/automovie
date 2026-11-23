# src/physics/physicalShapePairDistance.ts#physicalShapePairDistance

## @evidence contracts/development/implementation.md#principled-implementation

The nearest features of two disjoint convex polytopes are a vertex and a face or two edges (Ericson, Real-Time Collision Detection, 2005, ch. 5 and 9), each of which contains a point of an edge of one polytope, so the least edge-to-solid distance over both is the distance; a round shape is its axis offset by its radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One wire frame per shape kind with an exhaustive check, and one loop each way over the single proximity owner; no second distance formula exists here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance, sample count or margin is added; every wire is queried exactly by the owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one proximity query per wire of each shape: one for a round shape, twelve for a box, the edge count for a hull, a few dozen for a body module; a wire farther from the sphere about the other shape's bounds than the least distance found so far costs one point-to-segment distance instead, which leaves the least as it is.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A hull's edges are read from the faces `physicalHullFaces` already shares per point list and kept beside them per point list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The edge lists live in a weak map keyed by the point list, so they go when the shape goes.

## @evidence contracts/development/common.md#meaningful-documentation

States the wire frame of each kind, why the reading is exact apart and what it measures when the shapes overlap.

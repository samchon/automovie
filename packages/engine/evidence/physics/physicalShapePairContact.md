# src/physics/physicalShapePairContact.ts#physicalShapePairContact

## @evidence contracts/development/implementation.md#principled-implementation

The nearest features of two disjoint convex sets contain a point of an edge or round axis of one of them (Ericson 2005), so the least wire distance is the distance; the same wires and pruning as `physicalShapePairDistance`, keeping the minimizing query's witnesses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop each way over the shared wire frames; proximity is the nearest-point owner's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or sample count is added; every wire not pruned by the bounding-sphere test is queried exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one proximity query per wire of each shape, as `physicalShapePairDistance`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the wire frames `physicalShapePairDistance` keeps per hull point list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh vectors; retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned, the wire-frame reading, both witnesses and the overlapping case.

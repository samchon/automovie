# src/environments/buildings/buildingWalkable.ts#buildingWalkable

## @evidence contracts/development/common.md#meaningful-documentation

Defines canonical winding, metre clearance, retained slab holes and refusal of collapsed or self-intersecting rooms.

## @evidence contracts/development/implementation.md#principled-implementation

Intersects the parallel offsets of adjacent edges along the unit inward normals. Refuses reversed edges and flipped inset topology before applying the shared region gate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates useful floor support from renderable slabs and the named aperture that bridges the physical partition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A setback that ceases to give one simple usable plan refuses instead of leaving support under a wall. Mitered corners conservatively leave additional clearance at beveled wall joints.

## @evidence contracts/development/implementation.md#efficient-algorithms

Offset work is linear in walked ring vertices before containment and the shared triangulation, whose complete cost depends on plan size and hole count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admitted room support is prepared once with the building plan, before placement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned room owns its offset rings and one anchor. Temporary triangulation and candidate points are released on return.

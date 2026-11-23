# src/environments/buildings/emitBuildingRoom.ts#emitBuildingRoom

## @evidence contracts/development/common.md#meaningful-documentation

The room and slab geometry use local metres, the named anchor and support are world coordinates, and both are recorded at the finished floor.

## @evidence contracts/development/implementation.md#principled-implementation

The already triangulated enclosure gives convex world prisms. Floor and ceiling rings include any separately admitted shaft cuts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One room owns its two solid plates and its one support patch. The wall producer uses the original plan boundaries independently.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A returned room anchor belongs to an admitted floor region, including where a stair cleared the original centre. Void rings are retained in both support and construction.

## @evidence contracts/development/implementation.md#efficient-algorithms

World support and enclosure generation scan their canonical points and triangles once each. Region extrusions own the final mesh work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Room plans and triangulations are reused across placements, with independent stage/support IDs and world geometry per occurrence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates the caller-owned assembly tables with one bounded set of records per admitted room and retains no resource.

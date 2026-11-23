# src/touch/touchHoldRests.ts#touchHoldRests

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, its source in the skeleton and the reach, and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The region's bone and its skeleton neighbours, each kept only where the engine's exact shape distance from the region's point is within the hand's length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One neighbour set per partner and region, one region point and one distance test per segment and second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No segment beyond the region's neighbours is excused, and a neighbour out of the hand's reach stays an obstacle.

## @evidence contracts/development/implementation.md#efficient-algorithms

The neighbour set is built once; at a second only the neighbours' shapes are measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The skeleton, the surface table and the engine's shape distance, read and not restated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the neighbour set and the region's frame; each second's bones are borrowed for that call.

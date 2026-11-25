# src/architecture/rideMovingWalkway.ts#rideMovingWalkway

## @evidence contracts/development/implementation.md#principled-implementation

A rigid translation at constant speed along the walkway's axis composed with its placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the speed, then two readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The speed limit is the standard's; no other speed is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each read is independent arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the placement, speed and direction while the caller keeps the ride.

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, the band's rest pose, the direction and the speed limit with its source.

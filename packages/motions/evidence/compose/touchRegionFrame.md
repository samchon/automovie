# src/compose/touchRegionFrame.ts#touchRegionFrame

## @evidence contracts/development/common.md#meaningful-documentation

States which pose each kind of region is read on and why.

## @evidence contracts/development/implementation.md#principled-implementation

A limb is solved after the trunk, so a limb region of the performer is placed on the entry's displayed bone; everything else goes through the target resolver.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch for a self limb region, one delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A limb region on the moving arm is the caller's error; the region is not re-read on the solved arm.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's surface placement and `AutoMovieMotionHumanTarget.resolve`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One placement or one resolve per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

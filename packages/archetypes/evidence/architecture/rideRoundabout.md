# src/architecture/rideRoundabout.ts#rideRoundabout

## @evidence contracts/development/implementation.md#principled-implementation

The disc keeps the pusher's angle while held, then turns at constant speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the release, read its rate once, then one angle reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The driven angle is the caller's, from the pusher's displayed path.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each read is independent arithmetic.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the driven reader while the caller keeps the ride.

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, the driven and coasting phases and the neglected friction.

# src/everyday/approachAbeam.ts#approachAbeam

## @evidence contracts/development/common.md#meaningful-documentation

States when a waypoint is placed, on which side, at what distance, its floor frame and when none is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Projects the point on the leg's floor direction: a point beside the leg's span nearer than the passing distance is passed abeam at that distance on the side it already lies away from, the side that deviates least.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `approach` unchanged; `approach` asks it once per person walked round.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The passing distance is the caller's clearance; a degenerate leg under a nanometre places no waypoint.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

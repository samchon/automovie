# src/audit/AutoMovieMotionHumanAuditRange.ts#AutoMovieMotionHumanAuditRange.measure

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

Every joint of every instant goes through the gate's scan against the table's constraint for its bone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two nested loops and one callback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A fault without a distance is a non-finite angle and reads as `Infinity`, never as zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan per joint per instant, no allocation beyond the grid.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grid is `AutoMovieMotionHumanAuditMotion.grid`, the scan the engine's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/audit/AutoMovieMotionHumanAuditRange.ts#AutoMovieMotionHumanAuditRange.unloaded

## @evidence contracts/development/common.md#meaningful-documentation

States the two limits, where a foot's load is read from and what overshoots.

## @evidence contracts/development/implementation.md#principled-implementation

The unloaded limit applies exactly where the declared plants say a foot bears nothing.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk over the grid and two feet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-finite angle reads as `Infinity`; no foot or instant is exempt.

## @evidence contracts/development/implementation.md#efficient-algorithms

One window test per foot per instant, and one pose only at an instant where some foot bears nothing: a reading of both planted feet is zero whatever the pose, so it is not resolved.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grid and the windows are `IAutoMovieMotionHumanAuditMotion`'s, the limit the engine's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

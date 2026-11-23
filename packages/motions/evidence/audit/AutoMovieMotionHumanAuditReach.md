# src/audit/AutoMovieMotionHumanAuditReach.ts#AutoMovieMotionHumanAuditReach.gap

## @evidence contracts/development/common.md#meaningful-documentation

States each input with its frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

The distance at each instant of the span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the walk to the shared span reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance; the caller's limit judges.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pose per instant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the span walk with `tilt`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/audit/AutoMovieMotionHumanAuditReach.ts#AutoMovieMotionHumanAuditReach.tilt

## @evidence contracts/development/common.md#meaningful-documentation

States each input with its frame and the result's range.

## @evidence contracts/development/implementation.md#principled-implementation

The axis is turned into the world by the bone's displayed orientation; the angle is `atan2` of the cross and the dot, accurate at both ends of its range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the walk to the shared span reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A direction of no length throws instead of reading as aligned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pose per instant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the engine's `Quaternion.rotateVector`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanPartnerClear.ts#AutoMovieMotionHumanPartnerClear.at

## @evidence contracts/development/common.md#meaningful-documentation

States the reader, the timebase and the frame of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The partner's bones at the second, as the performance shows them, placed by the single collider placement owner (`HumanColliders.placed`) over the bones its profile reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bone read and one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the partner's displayed pose; no segment is approximated or skipped beyond the placement's own absent-bone rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Forward kinematics of only the profile's bones and O(S) placement per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each second's pose is read afresh; the planner reads each instant once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array and retains nothing.

# src/compose/AutoMovieMotionHumanPartnerClear.ts#AutoMovieMotionHumanPartnerClear.onto

## @evidence contracts/development/common.md#meaningful-documentation

States the extended fields, the absent-goal case and the default.

## @evidence contracts/development/implementation.md#principled-implementation

Appends to the goal's own `clear` and `rests`, the fields the arm planner reads as another person's segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal copy with two appended lists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every other goal field and any segments the law already gave.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the segments appended.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure copy.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

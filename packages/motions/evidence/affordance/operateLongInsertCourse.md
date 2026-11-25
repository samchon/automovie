# src/affordance/operateLongInsertCourse.ts#operateLongInsertCourse

## @evidence contracts/development/common.md#meaningful-documentation

States the axis frame, the chords, the hand order, the cycle, the steps, the withdrawal and the closing regrip.

## @evidence contracts/development/implementation.md#principled-implementation

Each hand's reach on the axis is the exact line-sphere chord; each step is the exact interval of stances keeping the held places within reach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Present, drive in by cycles, draw out by cycles, regrip home.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A depth the staff cannot reach, or a cycle that gains nothing at any stance, is refused, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per segment, at most `MOST` segments.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each insertion has its own bore and body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain records and retains nothing.

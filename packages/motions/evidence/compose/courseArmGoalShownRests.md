# src/compose/courseArmGoalShownRests.ts#courseArmGoalShownRests

## @evidence contracts/development/common.md#meaningful-documentation

States which arm the display shows before a later course, how each case is read and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A course leaves from the arm the display shows as it takes over: the plan's own joints where it writes no goal before the start, and otherwise the display's own swivel course of the plan's goals from the entry (`courseLimbSwivels`, the same knots), never a cold fit of the goal, which may turn the arm another way for the same hand place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved verbatim from `courseArmGoal`, with its own parameters: one goal-free resolve, then one display course and one seeded resolve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rest is the arm shown; no goal, swivel or timing is invented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Once per start the group's arms share, a continued fit per frame up to it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the display's own swivel course and the entry's seeds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the rests and retains nothing.

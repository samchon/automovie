# src/compose/AutoMovieMotionHumanArm.ts#AutoMovieMotionHumanArm.entered

## @evidence contracts/development/common.md#meaningful-documentation

States what record it is, the rule it serves and its parameters and result.

## @evidence contracts/development/implementation.md#principled-implementation

transitions.md "Carry resolved entry state through cuts" and "Plan the target action from that entry state": the arm's angles in the pose the action is entered with, read by the angle owner (`AutoMovieMotionHumanArmAngles.angles`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one entry arm record every course defaults its rest to (`courseArmGoal.rest`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No assumed pose: the entry's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

One angle reading of three joints and the fingers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the angles and retains nothing.

# src/compose/AutoMovieMotionHumanArm.ts#AutoMovieMotionHumanArm.IEntry

## @evidence contracts/development/common.md#meaningful-documentation

States its one member.

## @evidence contracts/development/design.md#principled-representation

The displayed pose at the action's entry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The part of an action's entry a course reads; an action context's entry satisfies it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pose only.

# src/compose/AutoMovieMotionHumanArm.ts#AutoMovieMotionHumanArm.IEntered

## @evidence contracts/development/common.md#meaningful-documentation

States its one member.

## @evidence contracts/development/design.md#principled-representation

What carries an entry: an action's context, or a pose a helper states.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `entered` and extended by `courseArmGoal.IContext`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The entry only.
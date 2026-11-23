# src/motion/human/compose/IAutoMovieMotionHumanReach.ts#IAutoMovieMotionHumanReach.Policy

## @evidence contracts/development/common.md#meaningful-documentation

Says what the union decides and where each member is described.

## @evidence contracts/development/design.md#principled-representation

The three answers to an unreachable goal: give up, move the body, or move the goal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, read by `fit`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed literal union instead of flags that could combine into a contradiction.

# src/motion/human/compose/IAutoMovieMotionHumanReach.ts#IAutoMovieMotionHumanReach.Limb

## @evidence contracts/development/common.md#meaningful-documentation

Names the four limbs a reach is measured for.

## @evidence contracts/development/design.md#principled-representation

The posture's own limb keys, so a check names the goal it guards.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, used by every function here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A literal union, not a string.

# src/motion/human/compose/IAutoMovieMotionHumanReach.ts#IAutoMovieMotionHumanReach.ICheck

## @evidence contracts/development/common.md#meaningful-documentation

States what the record measures; each member gives its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The centre and the radius of the reachable ball with the goal's distance from the centre, the three numbers the comparison is made of.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members; `shortfall` is kept beside the two it follows from because every reader branches on it and an error prints it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required and in metres; reach is not reduced to a boolean that would hide by how much.

# src/motion/human/compose/IAutoMovieMotionHumanReach.ts#IAutoMovieMotionHumanReach.IFit

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member says what a policy may have changed.

## @evidence contracts/development/design.md#principled-representation

A policy changes the posture (a lean) or the point (a clamp), so the result carries both as they are after it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, returned by `fit` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members are always present, so a caller never asks which policy ran before reading them.

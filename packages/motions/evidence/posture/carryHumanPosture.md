# src/posture/carryHumanPosture.ts#carryHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

States what is carried, what is left and the two frames.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid transform `now * origin^-1` applied to world points and rotations; a goal attached to a bone already moves with the body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One transform, one pass over the four limbs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The heading is read from the frames' turned forward axes, so a tilted frame turns the body only about the world's up.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

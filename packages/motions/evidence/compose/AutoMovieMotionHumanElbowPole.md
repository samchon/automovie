# src/compose/AutoMovieMotionHumanElbowPole.ts#AutoMovieMotionHumanElbowPole

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the degenerate case.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's displacement under a small elbow flexion gives the bend's direction; the pole lies opposite it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One flexed read, one offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The posture's own joint is flexed; nothing assumed of the rig.

## @evidence contracts/development/implementation.md#efficient-algorithms

One FK of the hand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The pose reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

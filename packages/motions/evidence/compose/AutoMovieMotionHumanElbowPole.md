# src/compose/AutoMovieMotionHumanElbowPole.ts#AutoMovieMotionHumanElbowPole

## @evidence contracts/development/common.md#meaningful-documentation

States the degenerate hint, the olecranon and how it is read.

## @evidence contracts/development/design.md#principled-representation

A world point: the elbow plus the olecranon's direction at a share of the forearm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The share, the flexion and one reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The direction is the posture's own elbow hinge, never a fixed vector.

# src/compose/AutoMovieMotionHumanElbowPole.ts#AutoMovieMotionHumanElbowPole.of

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

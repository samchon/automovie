# src/daily/handToFaceArm.ts#handToFaceArm

## @evidence contracts/development/common.md#meaningful-documentation

States the vessel's lay, its hint and the held grasp's case.

## @evidence contracts/development/implementation.md#principled-implementation

The drinking search (`AutoMovieMotionHumanTouchDrink`) for a vessel, the held grasp's own hint and turn, else the laid arm's least-strain hint and reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The vessel, the held tool, the hint and the reference, in that order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A held grasp's turn is never re-solved.

## @evidence contracts/development/implementation.md#efficient-algorithms

One elbow solve per hand; a vessel adds its upright search, none when the law already found its drink with its rim side (`drink`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `AutoMovieMotionHumanTouchDrink`, `AutoMovieMotionHumanBend` and `AutoMovieMotionHumanTouchLaid`; a drink found with the rim side is used as found, never searched again.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

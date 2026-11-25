# src/lexicon/HumanMountReach.ts#HumanMountReach.reach

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, why the shoulder runs on a circle, what is read once and both ends of the result.

## @evidence contracts/development/implementation.md#principled-implementation

A rotation about a fixed axis moves a point on a circle, so the distance to a fixed point is an exact sinusoid in the angle and its threshold crossing is an arccos root; the circle's vectors are solved from three exact forward-kinematics readings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare both circles once, then evaluate the joint reach's crossings and extrema when neutral is out of reach.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A point beyond the reach of the specified rotation still leaves the hand short for the contact audit. The specified rotation is respected throughout.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three focused posture resolutions at preparation, then a finite set of arccos roots and no forward kinematics per instant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three resolutions share one forward-kinematics reader and one range-of-motion projector, and both shoulders share the circle's matrix and its determinant.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader and the projector end with construction; the returned function holds one circle and one reach per hand.

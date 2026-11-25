# src/daily/handToFaceSheet.ts#handToFaceSheet

## @evidence contracts/development/common.md#meaningful-documentation

States the two constraints the place meets, the side it lies on and its facing.

## @evidence contracts/development/implementation.md#principled-implementation

For the walking carrier the bilateral eye centre, current head rotation and measured gaze give the preferred target. For a head directed outside the forward arm reach, or without the walking carrier, in the vertical plane through the hand's elbow along the heading, the place is the forward intersection of the circle of the reading distance about the eyes (cut by that plane) with the circle the hand sweeps about the hanging elbow (the forearm and half the hand); when the two do not meet, the hand's circle's point nearest the eyes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One trunk resolve, one change of frame and one circle intersection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every length is the body's own or the measured reading distance; no direction is typed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanTrunk.resolve` and `HumanFrame`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One forward-kinematics pass over the eyes', the head's and the holding shoulder's ancestry only, and constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/daily/handToFaceSheet.ts#handToFaceSheet.head

## @evidence contracts/development/common.md#meaningful-documentation

States the measured flexion, the eye's range and when the head takes more.

## @evidence contracts/development/implementation.md#principled-implementation

The line of sight's depression below the horizontal is the head's flexion plus the eye's depression in the head; the eye takes what the head's measured flexion leaves, up to its measured range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One place, one angle and one maximum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both terms are measured; the sheet's place is the body's own.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the place from `of`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One place read, one forward-kinematics pass over the eyes' ancestry and constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

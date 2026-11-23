# src/floor/lieTogetherCurl.ts#lieTogetherCurl.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and its bounds.

## @evidence contracts/development/implementation.md#principled-implementation

A rotation about the lumbar joint moves the sternum on a circle of its distance from the joint, so the angle that brings its component toward the back to the target's is an arcsine less its present angle; the head check and the slide rotate the head's centre and the sternum by the same turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The trunk's frame, the angle, the range, the head's share, the slide.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target the circle cannot reach takes the circle's nearest point; no angle is searched or tuned, and the range and the heads bound it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk resolve and constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Solved once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one angle and one vector and retains nothing.

# src/floor/lieTogetherCurl.ts#lieTogetherCurl.apply

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Adds the shared angle to the lumbar joint's flexion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One joint write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The joint's side bend and twist and every other joint are kept.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh posture per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

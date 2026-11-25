# src/everyday/braceOnThighPoint.ts#braceOnThighPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the support and its source, the place along the thigh, the frame and units of the result and the bones read.

## @evidence contracts/development/implementation.md#principled-implementation

The nearer reachable point along the thigh from above the knee is projected onto the thigh collider. The hand is placed one depth of its colliders out along the normal to keep the open thumb from interpenetrating.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the hand's fixed normal depth and eased reach. Read each actual thigh, knee and shoulder to place its contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The place and clearance come from the rig's own hand and leg colliders. The surface region supplies the geometric fallback where its collider has no ray hit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads hand geometry once and projects each changing contact on one placed thigh collider.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed palm's depth, eased reach, region and padding follow the body, not the posture.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller retains body and scalar contact geometry for the plan. Each pose read returns fresh vectors and releases its current frames.
